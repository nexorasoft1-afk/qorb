import { NextRequest, NextResponse } from "next/server";
import { and, count, eq, gte, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  businesses,
  businessEvents,
} from "@/app/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EVENT_TYPES = [
  "View",
  "PhoneClick",
  "WhatsAppClick",
  "DirectionsClick",
  "WebsiteClick",
] as const;

function userIdFromSession(session: any): number | null {
  const raw =
    session?.user?.id ??
    session?.user?.userId ??
    session?.id ??
    session?.userId ??
    session?.UserID ??
    session?.user?.UserID;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function roleFromSession(session: any): string | null {
  return (
    session?.user?.role ??
    session?.user?.Role ??
    session?.role ??
    session?.Role ??
    null
  );
}

function parseId(value: string): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

async function authorize(businessId: number) {
  const session = await getSession();

  if (!session) {
    return { error: "يجب تسجيل الدخول أولًا", status: 401 };
  }

  const userId = userIdFromSession(session);
  const role = roleFromSession(session);

  if (!userId) {
    return { error: "جلسة المستخدم غير صالحة", status: 401 };
  }

  if (role !== "BusinessOwner" && role !== "Admin") {
    return { error: "ليس لديك صلاحية عرض تحليلات هذا النشاط", status: 403 };
  }

  const [business] = await db
    .select({
      id: businesses.id,
      ownerId: businesses.ownerId,
      name: businesses.name,
      status: businesses.status,
    })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!business) {
    return { error: "النشاط التجاري غير موجود", status: 404 };
  }

  if (
    role !== "Admin" &&
    Number(business.ownerId) !== userId
  ) {
    return { error: "ليس لديك صلاحية عرض تحليلات هذا النشاط", status: 403 };
  }

  return { business };
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const businessId = parseId(id);

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: "معرف النشاط غير صالح" },
        { status: 400 }
      );
    }

    const access = await authorize(businessId);

    if ("error" in access) {
      return NextResponse.json(
        { success: false, error: access.error },
        { status: access.status }
      );
    }

    const since = new Date();
    since.setDate(since.getDate() - 29);
    since.setHours(0, 0, 0, 0);

    const [summary] = await db
      .select({
        total: count(businessEvents.id),
        views: sql<number>`
          count(*) filter (
            where ${businessEvents.eventType} = 'View'
          )
        `,
        phoneClicks: sql<number>`
          count(*) filter (
            where ${businessEvents.eventType} = 'PhoneClick'
          )
        `,
        whatsappClicks: sql<number>`
          count(*) filter (
            where ${businessEvents.eventType} = 'WhatsAppClick'
          )
        `,
        directionsClicks: sql<number>`
          count(*) filter (
            where ${businessEvents.eventType} = 'DirectionsClick'
          )
        `,
        websiteClicks: sql<number>`
          count(*) filter (
            where ${businessEvents.eventType} = 'WebsiteClick'
          )
        `,
      })
      .from(businessEvents)
      .where(
        eq(
          businessEvents.businessId,
          businessId
        )
      );

    const recentRows = await db
      .select({
        day: sql<string>`
          to_char(
            date_trunc(
              'day',
              ${businessEvents.createdAt}
            ),
            'YYYY-MM-DD'
          )
        `,
        eventType: businessEvents.eventType,
        count: count(businessEvents.id),
      })
      .from(businessEvents)
      .where(
        and(
          eq(
            businessEvents.businessId,
            businessId
          ),
          gte(
            businessEvents.createdAt,
            since
          )
        )
      )
      .groupBy(
        sql`
          date_trunc(
            'day',
            ${businessEvents.createdAt}
          )
        `,
        businessEvents.eventType
      )
      .orderBy(
        sql`
          date_trunc(
            'day',
            ${businessEvents.createdAt}
          )
        `
      );

    const dailyMap = new Map<
      string,
      Record<string, number>
    >();

    for (const row of recentRows) {
      if (!dailyMap.has(row.day)) {
        dailyMap.set(row.day, {
          View: 0,
          PhoneClick: 0,
          WhatsAppClick: 0,
          DirectionsClick: 0,
          WebsiteClick: 0,
        });
      }

      dailyMap.get(row.day)![row.eventType] =
        Number(row.count);
    }

    const daily = Array.from(
      dailyMap.entries()
    ).map(([day, values]) => ({
      day,
      ...values,
      total: Object.values(values).reduce(
        (sum, value) => sum + Number(value),
        0
      ),
    }));

    const topEventRows = await db
      .select({
        eventType: businessEvents.eventType,
        count: count(businessEvents.id),
      })
      .from(businessEvents)
      .where(
        eq(
          businessEvents.businessId,
          businessId
        )
      )
      .groupBy(
        businessEvents.eventType
      );

    const byType = EVENT_TYPES.map(
      (eventType) => ({
        eventType,
        count: Number(
          topEventRows.find(
            (row) =>
              row.eventType === eventType
          )?.count ?? 0
        ),
      })
    );

    return NextResponse.json({
      success: true,
      business: access.business,
      period: {
        from: since.toISOString(),
        to: new Date().toISOString(),
        days: 30,
      },
      summary: {
        total: Number(summary?.total ?? 0),
        views: Number(summary?.views ?? 0),
        phoneClicks: Number(summary?.phoneClicks ?? 0),
        whatsappClicks: Number(summary?.whatsappClicks ?? 0),
        directionsClicks: Number(
          summary?.directionsClicks ?? 0
        ),
        websiteClicks: Number(
          summary?.websiteClicks ?? 0
        ),
      },
      byType,
      daily,
      data: {
        summary,
        byType,
        daily,
      },
    });
  } catch (error) {
    console.error("GET analytics error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "حدث خطأ أثناء جلب التحليلات",
      },
      { status: 500 }
    );
  }
}
