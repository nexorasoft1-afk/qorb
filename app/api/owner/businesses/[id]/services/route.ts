import { NextRequest, NextResponse } from "next/server";
import { and, asc, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { businesses, businessServices } from "@/app/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// =========================================================
// Helpers
// =========================================================

function getSessionUserId(session: any): number | null {
  const rawId =
    session?.user?.id ??
    session?.user?.userId ??
    session?.id ??
    session?.userId ??
    session?.UserID ??
    session?.user?.UserID;

  const id = Number(rawId);

  return Number.isInteger(id) && id > 0 ? id : null;
}

function getSessionRole(session: any): string | null {
  return (
    session?.user?.role ??
    session?.user?.Role ??
    session?.role ??
    session?.Role ??
    null
  );
}

function parseBusinessId(value: string): number | null {
  const id = Number(value);

  return Number.isInteger(id) && id > 0 ? id : null;
}

function parseInteger(
  value: unknown,
  fieldName: string,
  options: {
    min?: number;
    max?: number;
    allowNull?: boolean;
  } = {}
): { value: number | null; error?: string } {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    if (options.allowNull) {
      return { value: null };
    }

    return {
      value: null,
      error: `${fieldName} مطلوب`,
    };
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    return {
      value: null,
      error: `${fieldName} يجب أن يكون رقمًا صحيحًا`,
    };
  }

  if (
    options.min !== undefined &&
    parsed < options.min
  ) {
    return {
      value: null,
      error: `${fieldName} يجب ألا يقل عن ${options.min}`,
    };
  }

  if (
    options.max !== undefined &&
    parsed > options.max
  ) {
    return {
      value: null,
      error: `${fieldName} يجب ألا يزيد عن ${options.max}`,
    };
  }

  return { value: parsed };
}

function parsePrice(
  value: unknown
): { value: string | null; error?: string } {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return { value: null };
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return {
      value: null,
      error: "السعر يجب أن يكون رقمًا صحيحًا أو عشريًا",
    };
  }

  if (parsed < 0) {
    return {
      value: null,
      error: "السعر لا يمكن أن يكون أقل من صفر",
    };
  }

  return {
    value: parsed.toFixed(2),
  };
}

// =========================================================
// Access
// =========================================================

async function getAuthorizedBusiness(
  businessId: number
) {
  const session = await getSession();

  if (!session) {
    return {
      error: "يجب تسجيل الدخول أولًا",
      status: 401,
    };
  }

  const userId = getSessionUserId(session);
  const role = getSessionRole(session);

  if (!userId) {
    return {
      error: "جلسة المستخدم غير صالحة",
      status: 401,
    };
  }

  if (
    role !== "BusinessOwner" &&
    role !== "Admin"
  ) {
    return {
      error: "ليس لديك صلاحية إدارة هذا النشاط",
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
      error: "ليس لديك صلاحية إدارة هذا النشاط",
      status: 403,
    };
  }

  return {
    session,
    userId,
    role,
    business,
  };
}

// =========================================================
// GET
// =========================================================

export async function GET(
  _request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;
    const businessId = parseBusinessId(id);

    if (!businessId) {
      return NextResponse.json(
        {
          success: false,
          error: "معرف النشاط غير صالح",
        },
        { status: 400 }
      );
    }

    const access = await getAuthorizedBusiness(
      businessId
    );

    if ("error" in access) {
      return NextResponse.json(
        {
          success: false,
          error: access.error,
        },
        { status: access.status }
      );
    }

    const services = await db
      .select({
        id: businessServices.id,
        businessId: businessServices.businessId,
        name: businessServices.name,
        description: businessServices.description,
        price: businessServices.price,
        durationMinutes:
          businessServices.durationMinutes,
        isActive: businessServices.isActive,
        sortOrder: businessServices.sortOrder,
        createdAt: businessServices.createdAt,
      })
      .from(businessServices)
      .where(
        eq(
          businessServices.businessId,
          businessId
        )
      )
      .orderBy(
        asc(businessServices.sortOrder),
        asc(businessServices.id)
      );

    return NextResponse.json({
      success: true,
      business: access.business,
      services,
      data: services,
    });
  } catch (error) {
    console.error(
      "GET /api/owner/businesses/[id]/services error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "حدث خطأ أثناء جلب الخدمات",
      },
      { status: 500 }
    );
  }
}

// =========================================================
// POST
// =========================================================

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;
    const businessId = parseBusinessId(id);

    if (!businessId) {
      return NextResponse.json(
        {
          success: false,
          error: "معرف النشاط غير صالح",
        },
        { status: 400 }
      );
    }

    const access = await getAuthorizedBusiness(
      businessId
    );

    if ("error" in access) {
      return NextResponse.json(
        {
          success: false,
          error: access.error,
        },
        { status: access.status }
      );
    }

    let body: any;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "بيانات الطلب غير صالحة",
        },
        { status: 400 }
      );
    }

    const name =
      typeof body?.name === "string"
        ? body.name.trim()
        : "";

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: "اسم الخدمة مطلوب",
        },
        { status: 400 }
      );
    }

    if (name.length > 200) {
      return NextResponse.json(
        {
          success: false,
          error:
            "اسم الخدمة يجب ألا يزيد عن 200 حرف",
        },
        { status: 400 }
      );
    }

    const description =
      typeof body?.description === "string"
        ? body.description.trim() || null
        : null;

    const priceResult = parsePrice(body?.price);

    if (priceResult.error) {
      return NextResponse.json(
        {
          success: false,
          error: priceResult.error,
        },
        { status: 400 }
      );
    }

    const durationResult = parseInteger(
      body?.durationMinutes,
      "مدة الخدمة",
      {
        min: 1,
        max: 1440,
        allowNull: true,
      }
    );

    if (durationResult.error) {
      return NextResponse.json(
        {
          success: false,
          error: durationResult.error,
        },
        { status: 400 }
      );
    }

    let sortOrder = 0;

    const requestedSort = parseInteger(
      body?.sortOrder,
      "ترتيب الخدمة",
      {
        min: 0,
        allowNull: true,
      }
    );

    if (requestedSort.error) {
      return NextResponse.json(
        {
          success: false,
          error: requestedSort.error,
        },
        { status: 400 }
      );
    }

    if (
      requestedSort.value !== null
    ) {
      sortOrder = requestedSort.value;
    } else {
      const [lastService] = await db
        .select({
          sortOrder:
            businessServices.sortOrder,
        })
        .from(businessServices)
        .where(
          eq(
            businessServices.businessId,
            businessId
          )
        )
        .orderBy(
          desc(businessServices.sortOrder),
          desc(businessServices.id)
        )
        .limit(1);

      sortOrder =
        Number(lastService?.sortOrder ?? -1) + 1;
    }

    const isActive =
      typeof body?.isActive === "boolean"
        ? body.isActive
        : true;

    const [createdService] = await db
      .insert(businessServices)
      .values({
        businessId,
        name,
        description,
        price: priceResult.value,
        durationMinutes:
          durationResult.value,
        isActive,
        sortOrder,
      })
      .returning({
        id: businessServices.id,
        businessId: businessServices.businessId,
        name: businessServices.name,
        description:
          businessServices.description,
        price: businessServices.price,
        durationMinutes:
          businessServices.durationMinutes,
        isActive: businessServices.isActive,
        sortOrder: businessServices.sortOrder,
        createdAt: businessServices.createdAt,
      });

    return NextResponse.json(
      {
        success: true,
        message: "تمت إضافة الخدمة بنجاح",
        service: createdService,
        data: createdService,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST /api/owner/businesses/[id]/services error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "حدث خطأ أثناء إضافة الخدمة",
      },
      { status: 500 }
    );
  }
}

