import { NextRequest, NextResponse } from "next/server";
import { and, asc, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  businesses,
  offers,
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

function parseDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseMoney(value: unknown): string | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return n.toFixed(2);
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
    return { error: "ليس لديك صلاحية إدارة عروض هذا النشاط", status: 403 };
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
    return { error: "ليس لديك صلاحية إدارة عروض هذا النشاط", status: 403 };
  }

  return { business };
}

function validateOfferInput(body: any) {
  const title =
    typeof body?.title === "string"
      ? body.title.trim()
      : "";

  if (!title) {
    return { error: "عنوان العرض مطلوب" };
  }

  if (title.length > 200) {
    return { error: "عنوان العرض يجب ألا يزيد عن 200 حرف" };
  }

  const description =
    typeof body?.description === "string"
      ? body.description.trim() || null
      : null;

  const discountType =
    body?.discountType === "Percentage" ||
    body?.discountType === "Fixed"
      ? body.discountType
      : null;

  if (!discountType) {
    return { error: "نوع الخصم غير صالح" };
  }

  const discountValue = parseMoney(
    body?.discountValue
  );

  if (discountValue === null) {
    return { error: "قيمة الخصم يجب أن تكون رقمًا أكبر من أو يساوي صفر" };
  }

  const numericDiscount = Number(discountValue);

  if (
    discountType === "Percentage" &&
    numericDiscount > 100
  ) {
    return { error: "نسبة الخصم لا يمكن أن تتجاوز 100%" };
  }

  const startDate = parseDate(body?.startDate);
  const endDate = parseDate(body?.endDate);

  if (!startDate || !endDate) {
    return { error: "تاريخ بداية ونهاية العرض مطلوبان" };
  }

  if (endDate <= startDate) {
    return { error: "تاريخ نهاية العرض يجب أن يكون بعد تاريخ البداية" };
  }

  const isActive =
    typeof body?.isActive === "boolean"
      ? body.isActive
      : true;

  return {
    values: {
      title,
      description,
      discountType,
      discountValue,
      startDate,
      endDate,
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
        id: offers.id,
        businessId: offers.businessId,
        title: offers.title,
        description: offers.description,
        discountType: offers.discountType,
        discountValue: offers.discountValue,
        startDate: offers.startDate,
        endDate: offers.endDate,
        isActive: offers.isActive,
        createdAt: offers.createdAt,
      })
      .from(offers)
      .where(eq(offers.businessId, businessId))
      .orderBy(
        desc(offers.isActive),
        desc(offers.startDate),
        asc(offers.id)
      );

    return NextResponse.json({
      success: true,
      business: access.business,
      offers: rows,
      data: rows,
    });
  } catch (error) {
    console.error("GET offers error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "حدث خطأ أثناء جلب العروض",
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
    const validation = validateOfferInput(body);

    if (validation.error) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(offers)
      .values({
        businessId,
        ...validation.values!,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        message: "تمت إضافة العرض بنجاح",
        offer: created,
        data: created,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST offers error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "حدث خطأ أثناء إضافة العرض",
      },
      { status: 500 }
    );
  }
}
