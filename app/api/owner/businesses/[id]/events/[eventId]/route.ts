import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

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

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{ id: string; eventId: string }>;
  }
) {
  try {
    const { id, eventId } = await context.params;
    const businessId = parseId(id);
    const eventIdNumber = parseId(eventId);

    if (!businessId || !eventIdNumber) {
      return NextResponse.json(
        { success: false, error: "معرف النشاط أو الفعالية غير صالح" },
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
      .from(businessPublicEvents)
      .where(
        and(
          eq(businessPublicEvents.id, eventIdNumber),
          eq(businessPublicEvents.businessId, businessId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "الفعالية غير موجودة" },
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
          { success: false, error: "عنوان الفعالية مطلوب" },
          { status: 400 }
        );
      }

      if (title.length > 200) {
        return NextResponse.json(
          {
            success: false,
            error: "عنوان الفعالية يجب ألا يزيد عن 200 حرف",
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

    if (body?.startAt !== undefined) {
      const d = parseDate(body.startAt);

      if (!d) {
        return NextResponse.json(
          { success: false, error: "تاريخ بداية الفعالية غير صالح" },
          { status: 400 }
        );
      }

      updateData.startAt = d;
    }

    if (body?.endAt !== undefined) {
      const d = parseDate(body.endAt);

      if (!d) {
        return NextResponse.json(
          { success: false, error: "تاريخ نهاية الفعالية غير صالح" },
          { status: 400 }
        );
      }

      updateData.endAt = d;
    }

    const nextStart =
      updateData.startAt ??
      existing.startAt;

    const nextEnd =
      updateData.endAt ??
      existing.endAt;

    if (nextEnd <= nextStart) {
      return NextResponse.json(
        {
          success: false,
          error: "نهاية الفعالية يجب أن تكون بعد بدايتها",
        },
        { status: 400 }
      );
    }

    if (body?.isActive !== undefined) {
      if (typeof body.isActive !== "boolean") {
        return NextResponse.json(
          { success: false, error: "حالة الفعالية غير صالحة" },
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

    updateData.updatedAt = new Date();

    const [updated] = await db
      .update(businessPublicEvents)
      .set(updateData)
      .where(
        and(
          eq(businessPublicEvents.id, eventIdNumber),
          eq(businessPublicEvents.businessId, businessId)
        )
      )
      .returning();

    return NextResponse.json({
      success: true,
      message: "تم تحديث الفعالية بنجاح",
      event: updated,
      data: updated,
    });
  } catch (error) {
    console.error("PATCH event error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "حدث خطأ أثناء تحديث الفعالية",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: {
    params: Promise<{ id: string; eventId: string }>;
  }
) {
  try {
    const { id, eventId } = await context.params;
    const businessId = parseId(id);
    const eventIdNumber = parseId(eventId);

    if (!businessId || !eventIdNumber) {
      return NextResponse.json(
        { success: false, error: "معرف النشاط أو الفعالية غير صالح" },
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
      .delete(businessPublicEvents)
      .where(
        and(
          eq(businessPublicEvents.id, eventIdNumber),
          eq(businessPublicEvents.businessId, businessId)
        )
      )
      .returning({
        id: businessPublicEvents.id,
        businessId: businessPublicEvents.businessId,
        title: businessPublicEvents.title,
      });

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "الفعالية غير موجودة" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "تم حذف الفعالية بنجاح",
      event: deleted,
      data: deleted,
    });
  } catch (error) {
    console.error("DELETE event error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "حدث خطأ أثناء حذف الفعالية",
      },
      { status: 500 }
    );
  }
}
