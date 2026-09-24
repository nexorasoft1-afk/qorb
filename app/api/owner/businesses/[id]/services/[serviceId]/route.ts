import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
businesses,
businessServices,
} from "@/app/db/schema";

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

function parsePositiveInteger(
value: string
): number | null {
const id = Number(value);

return Number.isInteger(id) && id > 0
? id
: null;
}

function parseInteger(
value: unknown,
fieldName: string,
options: {
min?: number;
max?: number;
allowNull?: boolean;
} = {}
): {
value: number | null;
error?: string;
} {
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

return {
value: parsed,
};
}

function parsePrice(
value: unknown
): {
value: string | null;
error?: string;
} {
if (
value === undefined ||
value === null ||
value === ""
) {
return {
value: null,
};
}

const parsed = Number(value);

if (!Number.isFinite(parsed)) {
return {
value: null,
error:
"السعر يجب أن يكون رقمًا صحيحًا أو عشريًا",
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
// Authorization
// =========================================================

async function authorizeBusiness(
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
// PATCH
// =========================================================

export async function PATCH(
request: NextRequest,
context: {
params: Promise<{
id: string;
serviceId: string;
}>;
}
) {
try {
const { id, serviceId } = await context.params;
const businessId =
  parsePositiveInteger(id);

const serviceIdNumber =
  parsePositiveInteger(serviceId);

if (!businessId) {
  return NextResponse.json(
    {
      success: false,
      error: "معرف النشاط غير صالح",
    },
    { status: 400 }
  );
}

if (!serviceIdNumber) {
  return NextResponse.json(
    {
      success: false,
      error: "معرف الخدمة غير صالح",
    },
    { status: 400 }
  );
}

const access =
  await authorizeBusiness(businessId);

if ("error" in access) {
  return NextResponse.json(
    {
      success: false,
      error: access.error,
    },
    { status: access.status }
  );
}

const [existingService] = await db
  .select({
    id: businessServices.id,
    businessId:
      businessServices.businessId,
    name: businessServices.name,
    description:
      businessServices.description,
    price: businessServices.price,
    durationMinutes:
      businessServices.durationMinutes,
    isActive: businessServices.isActive,
    sortOrder:
      businessServices.sortOrder,
  })
  .from(businessServices)
  .where(
    and(
      eq(
        businessServices.id,
        serviceIdNumber
      ),
      eq(
        businessServices.businessId,
        businessId
      )
    )
  )
  .limit(1);

if (!existingService) {
  return NextResponse.json(
    {
      success: false,
      error: "الخدمة غير موجودة",
    },
    { status: 404 }
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

const updateData: any = {};

// =====================================================
// Name
// =====================================================

if (body?.name !== undefined) {
  if (
    typeof body.name !== "string"
  ) {
    return NextResponse.json(
      {
        success: false,
        error:
          "اسم الخدمة يجب أن يكون نصًا",
      },
      { status: 400 }
    );
  }

  const name = body.name.trim();

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

  updateData.name = name;
}

// =====================================================
// Description
// =====================================================

if (body?.description !== undefined) {
  if (
    body.description === null ||
    body.description === ""
  ) {
    updateData.description = null;
  } else if (
    typeof body.description === "string"
  ) {
    updateData.description =
      body.description.trim() || null;
  } else {
    return NextResponse.json(
      {
        success: false,
        error:
          "وصف الخدمة يجب أن يكون نصًا",
      },
      { status: 400 }
    );
  }
}

// =====================================================
// Price
// =====================================================

if (body?.price !== undefined) {
  const priceResult =
    parsePrice(body.price);

  if (priceResult.error) {
    return NextResponse.json(
      {
        success: false,
        error: priceResult.error,
      },
      { status: 400 }
    );
  }

  updateData.price =
    priceResult.value;
}

// =====================================================
// Duration
// =====================================================

if (
  body?.durationMinutes !== undefined
) {
  const durationResult =
    parseInteger(
      body.durationMinutes,
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
        error:
          durationResult.error,
      },
      { status: 400 }
    );
  }

  updateData.durationMinutes =
    durationResult.value;
}

// =====================================================
// Active
// =====================================================

if (
  body?.isActive !== undefined
) {
  if (
    typeof body.isActive !==
    "boolean"
  ) {
    return NextResponse.json(
      {
        success: false,
        error:
          "حالة الخدمة غير صالحة",
      },
      { status: 400 }
    );
  }

  updateData.isActive =
    body.isActive;
}

// =====================================================
// Sort Order
// =====================================================

if (
  body?.sortOrder !== undefined
) {
  const sortResult =
    parseInteger(
      body.sortOrder,
      "ترتيب الخدمة",
      {
        min: 0,
        allowNull: false,
      }
    );

  if (sortResult.error) {
    return NextResponse.json(
      {
        success: false,
        error: sortResult.error,
      },
      { status: 400 }
    );
  }

  updateData.sortOrder =
    sortResult.value;
}

if (
  Object.keys(updateData).length === 0
) {
  return NextResponse.json(
    {
      success: false,
      error:
        "لم يتم إرسال أي بيانات للتعديل",
    },
    { status: 400 }
  );
}

const [updatedService] =
  await db
    .update(businessServices)
    .set(updateData)
    .where(
      and(
        eq(
          businessServices.id,
          serviceIdNumber
        ),
        eq(
          businessServices.businessId,
          businessId
        )
      )
    )
    .returning({
      id: businessServices.id,
      businessId:
        businessServices.businessId,
      name: businessServices.name,
      description:
        businessServices.description,
      price: businessServices.price,
      durationMinutes:
        businessServices.durationMinutes,
      isActive:
        businessServices.isActive,
      sortOrder:
        businessServices.sortOrder,
      createdAt:
        businessServices.createdAt,
    });

if (!updatedService) {
  return NextResponse.json(
    {
      success: false,
      error: "تعذر تحديث الخدمة",
    },
    { status: 404 }
  );
}

return NextResponse.json({
  success: true,
  message: "تم تحديث الخدمة بنجاح",
  service: updatedService,
  data: updatedService,
});
} catch (error) {
console.error(
"PATCH /api/owner/businesses/[id]/services/[serviceId] error:",
error
);

return NextResponse.json(
  {
    success: false,
    error:
      "حدث خطأ أثناء تحديث الخدمة",
  },
  { status: 500 }
);
}
}

// =========================================================
// DELETE
// =========================================================

export async function DELETE(
_request: NextRequest,
context: {
params: Promise<{
id: string;
serviceId: string;
}>;
}
) {
try {
const { id, serviceId } =
await context.params;
const businessId =
  parsePositiveInteger(id);

const serviceIdNumber =
  parsePositiveInteger(serviceId);

if (!businessId) {
  return NextResponse.json(
    {
      success: false,
      error: "معرف النشاط غير صالح",
    },
    { status: 400 }
  );
}

if (!serviceIdNumber) {
  return NextResponse.json(
    {
      success: false,
      error: "معرف الخدمة غير صالح",
    },
    { status: 400 }
  );
}

const access =
  await authorizeBusiness(businessId);

if ("error" in access) {
  return NextResponse.json(
    {
      success: false,
      error: access.error,
    },
    { status: access.status }
  );
}

const [deletedService] =
  await db
    .delete(businessServices)
    .where(
      and(
        eq(
          businessServices.id,
          serviceIdNumber
        ),
        eq(
          businessServices.businessId,
          businessId
        )
      )
    )
    .returning({
      id: businessServices.id,
      businessId:
        businessServices.businessId,
      name: businessServices.name,
    });

if (!deletedService) {
  return NextResponse.json(
    {
      success: false,
      error: "الخدمة غير موجودة",
    },
    { status: 404 }
  );
}

return NextResponse.json({
  success: true,
  message: "تم حذف الخدمة بنجاح",
  service: deletedService,
  data: deletedService,
});
} catch (error) {
console.error(
"DELETE /api/owner/businesses/[id]/services/[serviceId] error:",
error
);
return NextResponse.json(
  {
    success: false,
    error:
      "حدث خطأ أثناء حذف الخدمة",
  },
  { status: 500 }
);

}
}



