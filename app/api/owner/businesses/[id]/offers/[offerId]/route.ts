import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

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
  if (typeof value !== "string" || !value.trim()) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
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

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{ id: string; offerId: string }>;
  }
) {
  try {
    const { id, offerId } = await context.params;
    const businessId = parseId(id);
    const offerIdNumber = parseId(offerId);

    if (!businessId || !offerIdNumber) {
      return NextResponse.json(
        { success: false, error: "معرف النشاط أو العرض غير صالح" },
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

    const [existing] = await db
      .select()
      .from(offers)
      .where(
        and(
          eq(offers.id, offerIdNumber),
          eq(offers.businessId, businessId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "العرض غير موجود" },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => null);
    const updateData: any = {};

    if (body?.title !== undefined) {
      const title =
        typeof body.title === "string"
          ? body.title.trim()
          : "";
      if (!title) {
        return NextResponse.json(
          { success: false, error: "عنوان العرض مطلوب" },
          { status: 400 }
        );
      }
      if (title.length > 200) {
        return NextResponse.json(
          {
            success: false,
            error: "عنوان العرض يجب ألا يزيد عن 200 حرف",
          },
          { status: 400 }
        );
      }
      updateData.title = title;
    }

    if (body?.description !== undefined) {
      updateData.description =
        typeof body.description === "string"
          ? body.description.trim() || null
          : null;
    }

    if (body?.discountType !== undefined) {
      if (
        body.discountType !== "Percentage" &&
        body.discountType !== "Fixed"
      ) {
        return NextResponse.json(
          { success: false, error: "نوع الخصم غير صالح" },
          { status: 400 }
        );
      }
      updateData.discountType = body.discountType;
    }

    if (body?.discountValue !== undefined) {
      const value = parseMoney(body.discountValue);
      if (value === null) {
        return NextResponse.json(
          {
            success: false,
            error: "قيمة الخصم يجب أن تكون رقمًا أكبر من أو يساوي صفر",
          },
          { status: 400 }
        );
      }
      updateData.discountValue = value;
    }

    const nextType =
      updateData.discountType ??
      existing.discountType;

    const nextValue =
      Number(
        updateData.discountValue ??
          existing.discountValue
      );

    if (
      nextType === "Percentage" &&
      nextValue > 100
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "نسبة الخصم لا يمكن أن تتجاوز 100%",
        },
        { status: 400 }
      );
    }

    if (body?.startDate !== undefined) {
      const date = parseDate(body.startDate);
      if (!date) {
        return NextResponse.json(
          { success: false, error: "تاريخ البداية غير صالح" },
          { status: 400 }
        );
      }
      updateData.startDate = date;
    }

    if (body?.endDate !== undefined) {
      const date = parseDate(body.endDate);
      if (!date) {
        return NextResponse.json(
          { success: false, error: "تاريخ النهاية غير صالح" },
          { status: 400 }
        );
      }
      updateData.endDate = date;
    }

    const nextStart =
      updateData.startDate ??
      existing.startDate;
    const nextEnd =
      updateData.endDate ??
      existing.endDate;

    if (nextEnd <= nextStart) {
      return NextResponse.json(
        {
          success: false,
          error: "تاريخ نهاية العرض يجب أن يكون بعد تاريخ البداية",
        },
        { status: 400 }
      );
    }

    if (body?.isActive !== undefined) {
      if (typeof body.isActive !== "boolean") {
        return NextResponse.json(
          {
            success: false,
            error: "حالة العرض غير صالحة",
          },
          { status: 400 }
        );
      }
      updateData.isActive = body.isActive;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "لم يتم إرسال بيانات للتعديل",
        },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(offers)
      .set(updateData)
      .where(
        and(
          eq(offers.id, offerIdNumber),
          eq(offers.businessId, businessId)
        )
      )
      .returning();

    return NextResponse.json({
      success: true,
      message: "تم تحديث العرض بنجاح",
      offer: updated,
      data: updated,
    });
  } catch (error) {
    console.error("PATCH offer error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "حدث خطأ أثناء تحديث العرض",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: {
    params: Promise<{ id: string; offerId: string }>;
  }
) {
  try {
    const { id, offerId } = await context.params;
    const businessId = parseId(id);
    const offerIdNumber = parseId(offerId);

    if (!businessId || !offerIdNumber) {
      return NextResponse.json(
        { success: false, error: "معرف النشاط أو العرض غير صالح" },
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

    const [deleted] = await db
      .delete(offers)
      .where(
        and(
          eq(offers.id, offerIdNumber),
          eq(offers.businessId, businessId)
        )
      )
      .returning({
        id: offers.id,
        businessId: offers.businessId,
        title: offers.title,
      });

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "العرض غير موجود" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "تم حذف العرض بنجاح",
      offer: deleted,
      data: deleted,
    });
  } catch (error) {
    console.error("DELETE offer error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "حدث خطأ أثناء حذف العرض",
      },
      { status: 500 }
    );
  }
}
