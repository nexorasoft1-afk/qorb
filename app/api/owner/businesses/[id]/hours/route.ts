import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { businesses, businessHours } from "@/app/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAYS = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

function userIdFromSession(session: any): number | null {
  const raw =
    session?.user?.id ??
    session?.user?.userId ??
    session?.id ??
    session?.userId ??
    session?.UserID ??
    session?.user?.UserID;

  const value = Number(raw);

  return Number.isInteger(value) && value > 0 ? value : null;
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

function validTime(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{2}:\d{2}$/.test(value) &&
    Number(value.slice(0, 2)) >= 0 &&
    Number(value.slice(0, 2)) <= 23 &&
    Number(value.slice(3, 5)) >= 0 &&
    Number(value.slice(3, 5)) <= 59
  );
}

async function authorize(businessId: number) {
  const session = await getSession();

  if (!session) {
    return {
      error: "يجب تسجيل الدخول أولًا",
      status: 401,
    };
  }

  const userId = userIdFromSession(session);
  const role = roleFromSession(session);

  if (!userId) {
    return {
      error: "جلسة المستخدم غير صالحة",
      status: 401,
    };
  }

  if (role !== "BusinessOwner" && role !== "Admin") {
    return {
      error: "ليس لديك صلاحية إدارة مواعيد هذا النشاط",
      status: 403,
    };
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
    return {
      error: "النشاط التجاري غير موجود",
      status: 404,
    };
  }

  if (
    role !== "Admin" &&
    Number(business.ownerId) !== userId
  ) {
    return {
      error: "ليس لديك صلاحية إدارة مواعيد هذا النشاط",
      status: 403,
    };
  }

  return {
    business,
  };
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
        {
          success: false,
          error: "معرف النشاط غير صالح",
        },
        { status: 400 }
      );
    }

    const access = await authorize(businessId);

    if ("error" in access) {
      return NextResponse.json(
        {
          success: false,
          error: access.error,
        },
        { status: access.status }
      );
    }

    const rows = await db
      .select({
        id: businessHours.id,
        businessId: businessHours.businessId,
        dayOfWeek: businessHours.dayOfWeek,
        openTime: businessHours.openTime,
        closeTime: businessHours.closeTime,
        isClosed: businessHours.isClosed,
        createdAt: businessHours.createdAt,
      })
      .from(businessHours)
      .where(eq(businessHours.businessId, businessId));

    const byDay = new Map(
      rows.map((row) => [Number(row.dayOfWeek), row])
    );

    const hours = DAYS.map((name, dayOfWeek) => {
      const row = byDay.get(dayOfWeek);

      return {
        id: row?.id ?? null,
        businessId,
        dayOfWeek,
        dayName: name,
        openTime: row?.openTime ?? "09:00",
        closeTime: row?.closeTime ?? "22:00",
        isClosed: row?.isClosed ?? true,
        createdAt: row?.createdAt ?? null,
      };
    });

    return NextResponse.json({
      success: true,
      business: access.business,
      hours,
      data: hours,
    });
  } catch (error) {
    console.error("GET hours error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "حدث خطأ أثناء جلب مواعيد العمل",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const businessId = parseId(id);

    if (!businessId) {
      return NextResponse.json(
        {
          success: false,
          error: "معرف النشاط غير صالح",
        },
        { status: 400 }
      );
    }

    const access = await authorize(businessId);

    if ("error" in access) {
      return NextResponse.json(
        {
          success: false,
          error: access.error,
        },
        { status: access.status }
      );
    }

    const body = await request.json().catch(() => null);

    if (!body || !Array.isArray(body.hours)) {
      return NextResponse.json(
        {
          success: false,
          error: "يجب إرسال مصفوفة مواعيد العمل",
        },
        { status: 400 }
      );
    }

    const normalized = body.hours.map((item: any) => ({
      dayOfWeek: Number(item?.dayOfWeek),

      openTime:
        typeof item?.openTime === "string"
          ? item.openTime
          : null,

      closeTime:
        typeof item?.closeTime === "string"
          ? item.closeTime
          : null,

      isClosed: Boolean(item?.isClosed),
    }));

    /*
     * مهم:
     * تحديد نوع Set على أنه Set<number>
     * يمنع خطأ TS18046:
     * "'day' is of type 'unknown'"
     */
    const uniqueDays = new Set<number>(
      normalized.map((item: { dayOfWeek: any; }) => item.dayOfWeek)
    );

    const hasInvalidDay = [...uniqueDays].some(
      (day: number) => day < 0 || day > 6
    );

    if (
      normalized.length !== 7 ||
      uniqueDays.size !== 7 ||
      hasInvalidDay
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "يجب إرسال الأيام السبعة من الأحد إلى السبت",
        },
        { status: 400 }
      );
    }

    for (const item of normalized) {
      if (item.isClosed) {
        continue;
      }

      if (
        !validTime(item.openTime) ||
        !validTime(item.closeTime)
      ) {
        return NextResponse.json(
          {
            success: false,
            error: `مواعيد اليوم ${DAYS[item.dayOfWeek]} غير صالحة`,
          },
          { status: 400 }
        );
      }

      if (item.openTime === item.closeTime) {
        return NextResponse.json(
          {
            success: false,
            error: `وقت الفتح والغلق في ${DAYS[item.dayOfWeek]} لا يمكن أن يكونا متساويين`,
          },
          { status: 400 }
        );
      }
    }

    await db.transaction(async (tx) => {
      for (const item of normalized) {
        await tx
          .insert(businessHours)
          .values({
            businessId,
            dayOfWeek: item.dayOfWeek,
            openTime: item.isClosed
              ? null
              : item.openTime,
            closeTime: item.isClosed
              ? null
              : item.closeTime,
            isClosed: item.isClosed,
          })
          .onConflictDoUpdate({
            target: [
              businessHours.businessId,
              businessHours.dayOfWeek,
            ],
            set: {
              openTime: item.isClosed
                ? null
                : item.openTime,
              closeTime: item.isClosed
                ? null
                : item.closeTime,
              isClosed: item.isClosed,
            },
          });
      }
    });

    const rows = await db
      .select({
        id: businessHours.id,
        businessId: businessHours.businessId,
        dayOfWeek: businessHours.dayOfWeek,
        openTime: businessHours.openTime,
        closeTime: businessHours.closeTime,
        isClosed: businessHours.isClosed,
        createdAt: businessHours.createdAt,
      })
      .from(businessHours)
      .where(eq(businessHours.businessId, businessId));

    const byDay = new Map(
      rows.map((row) => [Number(row.dayOfWeek), row])
    );

    const hours = DAYS.map((name, dayOfWeek) => ({
      ...(byDay.get(dayOfWeek) ?? {}),
      dayOfWeek,
      dayName: name,
    }));

    return NextResponse.json({
      success: true,
      message: "تم حفظ مواعيد العمل بنجاح",
      business: access.business,
      hours,
      data: hours,
    });
  } catch (error) {
    console.error("PUT hours error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "حدث خطأ أثناء حفظ مواعيد العمل",
      },
      { status: 500 }
    );
  }
}
