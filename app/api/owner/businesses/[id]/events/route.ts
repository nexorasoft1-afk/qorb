import { NextRequest, NextResponse } from "next/server";
import { asc, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  businesses,
  businessPublicEvents,
} from "@/app/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
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
    return { error: "ليس لديك صلاحية إدارة فعاليات هذا النشاط", status: 403 };
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
    return { error: "ليس لديك صلاحية إدارة فعاليات هذا النشاط", status: 403 };
  }

  return { business };
}

function validate(body: any) {
  const title =
    typeof body?.title === "string"
      ? body.title.trim()
      : "";

  if (!title) return { error: "عنوان الفعالية مطلوب" };
  if (title.length > 200) {
    return { error: "عنوان الفعالية يجب ألا يزيد عن 200 حرف" };
  }

  const description =
    typeof body?.description === "string"
      ? body.description.trim() || null
      : null;

  const startAt = parseDate(body?.startAt);
  const endAt = parseDate(body?.endAt);

  if (!startAt || !endAt) {
    return { error: "تاريخ بداية ونهاية الفعالية مطلوبان" };
  }

  if (endAt <= startAt) {
    return { error: "نهاية الفعالية يجب أن تكون بعد بدايتها" };
  }

  const isActive =
    typeof body?.isActive === "boolean"
      ? body.isActive
      : true;

  return {
    values: {
      title,
      description,
      startAt,
      endAt,
      isActive,
    },
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

    const rows = await db
      .select({
        id: businessPublicEvents.id,
        businessId: businessPublicEvents.businessId,
        title: businessPublicEvents.title,
        description: businessPublicEvents.description,
        startAt: businessPublicEvents.startAt,
        endAt: businessPublicEvents.endAt,
        isActive: businessPublicEvents.isActive,
        createdAt: businessPublicEvents.createdAt,
        updatedAt: businessPublicEvents.updatedAt,
      })
      .from(businessPublicEvents)
      .where(eq(businessPublicEvents.businessId, businessId))
      .orderBy(
        asc(businessPublicEvents.startAt),
        desc(businessPublicEvents.id)
      );

    return NextResponse.json({
      success: true,
      business: access.business,
      events: rows,
      data: rows,
    });
  } catch (error) {
    console.error("GET events error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "حدث خطأ أثناء جلب الفعاليات",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
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

    const body = await request.json().catch(() => null);
    const validation = validate(body);

    if (validation.error) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(businessPublicEvents)
      .values({
        businessId,
        ...validation.values!,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        message: "تمت إضافة الفعالية بنجاح",
        event: created,
        data: created,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST events error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "حدث خطأ أثناء إضافة الفعالية",
      },
      { status: 500 }
    );
  }
}
