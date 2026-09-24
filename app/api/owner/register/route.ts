import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

import {
  businessOwnershipRequests,
  categories,
  cities,
  areas,
  governorates,
  subCategories,
} from "@/app/db/schema";

import { businessSchema } from "@/lib/validations/business";
import {
  emptyToNull,
  normalizeText,
} from "@/lib/utils";

export async function GET() {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "يجب تسجيل الدخول أولًا",
        },
        { status: 401 }
      );
    }

    const rows = await db
      .select({
        id: businessOwnershipRequests.id,
        requestType:
          businessOwnershipRequests.requestType,
        name:
          businessOwnershipRequests.name,
        status:
          businessOwnershipRequests.status,
        notes:
          businessOwnershipRequests.notes,
        createdAt:
          businessOwnershipRequests.createdAt,
        reviewedAt:
          businessOwnershipRequests.reviewedAt,
      })
      .from(
        businessOwnershipRequests
      )
      .where(
        eq(
          businessOwnershipRequests.userId,
          user.id
        )
      )
      .orderBy(
        businessOwnershipRequests.createdAt
      );

    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error(
      "Ownership Requests GET Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "حدث خطأ أثناء جلب طلباتك",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request
) {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "يجب تسجيل الدخول أولًا",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const parsed =
      businessSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            "بيانات النشاط غير صحيحة",
          errors:
            parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // -------------------------------------------------
    // التحقق من التصنيف
    // -------------------------------------------------

    const category =
      await db
        .select({
          id: categories.id,
        })
        .from(categories)
        .where(
          and(
            eq(
              categories.id,
              data.categoryId
            ),
            eq(
              categories.isActive,
              true
            )
          )
        )
        .limit(1);

    if (!category[0]) {
      return NextResponse.json(
        {
          success: false,
          message:
            "التصنيف غير موجود أو غير مفعل",
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------
    // التصنيف الفرعي
    // -------------------------------------------------

    if (data.subCategoryId) {
      const subCategory =
        await db
          .select({
            id: subCategories.id,
          })
          .from(subCategories)
          .where(
            and(
              eq(
                subCategories.id,
                data.subCategoryId
              ),
              eq(
                subCategories.categoryId,
                data.categoryId
              ),
              eq(
                subCategories.isActive,
                true
              )
            )
          )
          .limit(1);

      if (!subCategory[0]) {
        return NextResponse.json(
          {
            success: false,
            message:
              "التصنيف الفرعي غير صحيح",
          },
          { status: 400 }
        );
      }
    }

    // -------------------------------------------------
    // المحافظة
    // -------------------------------------------------

    const governorate =
      await db
        .select({
          id: governorates.id,
        })
        .from(governorates)
        .where(
          and(
            eq(
              governorates.id,
              data.governorateId
            ),
            eq(
              governorates.isActive,
              true
            )
          )
        )
        .limit(1);

    if (!governorate[0]) {
      return NextResponse.json(
        {
          success: false,
          message:
            "المحافظة غير موجودة أو غير مفعلة",
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------
    // المدينة
    // -------------------------------------------------

    const city =
      await db
        .select({
          id: cities.id,
          governorateId:
            cities.governorateId,
        })
        .from(cities)
        .where(
          and(
            eq(
              cities.id,
              data.cityId
            ),
            eq(
              cities.isActive,
              true
            )
          )
        )
        .limit(1);

    if (!city[0]) {
      return NextResponse.json(
        {
          success: false,
          message:
            "المدينة غير موجودة أو غير مفعلة",
        },
        { status: 400 }
      );
    }

    if (
      city[0].governorateId !==
      data.governorateId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "المدينة لا تتبع المحافظة المحددة",
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------
    // المنطقة
    // -------------------------------------------------

    if (data.areaId) {
      const area =
        await db
          .select({
            id: areas.id,
          })
          .from(areas)
          .where(
            and(
              eq(
                areas.id,
                data.areaId
              ),
              eq(
                areas.cityId,
                data.cityId
              ),
              eq(
                areas.isActive,
                true
              )
            )
          )
          .limit(1);

      if (!area[0]) {
        return NextResponse.json(
          {
            success: false,
            message:
              "المنطقة غير صحيحة",
          },
          { status: 400 }
        );
      }
    }

    // -------------------------------------------------
    // منع إرسال نفس النشاط كطلبات متكررة Pending
    // -------------------------------------------------

    const normalizedName =
      normalizeText(data.name);

    const pendingRequest =
      await db
        .select({
          id:
            businessOwnershipRequests.id,
        })
        .from(
          businessOwnershipRequests
        )
        .where(
          and(
            eq(
              businessOwnershipRequests.userId,
              user.id
            ),
            eq(
              businessOwnershipRequests.status,
              "Pending"
            ),
            eq(
              businessOwnershipRequests.name,
              normalizedName
            ),
            eq(
              businessOwnershipRequests.cityId,
              data.cityId
            )
          )
        )
        .limit(1);

    if (pendingRequest[0]) {
      return NextResponse.json(
        {
          success: false,
          message:
            "لديك بالفعل طلب قيد المراجعة لهذا النشاط",
        },
        { status: 409 }
      );
    }

    // -------------------------------------------------
    // إنشاء الطلب فقط
    // -------------------------------------------------

    const inserted =
      await db
        .insert(
          businessOwnershipRequests
        )
        .values({
          userId: user.id,

          businessId: null,

          requestType: "Create",

          name:
            normalizedName,

          description:
            emptyToNull(
              data.description
            ),

          categoryId:
            data.categoryId,

          subCategoryId:
            data.subCategoryId ??
            null,

          governorateId:
            data.governorateId,

          cityId:
            data.cityId,

          areaId:
            data.areaId ??
            null,

          address:
            emptyToNull(
              data.address
            ),

          latitude:
            data.latitude !==
              undefined &&
            data.latitude !== null
              ? data.latitude.toString()
              : null,

          longitude:
            data.longitude !==
              undefined &&
            data.longitude !== null
              ? data.longitude.toString()
              : null,

          phone:
            emptyToNull(
              data.phone
            ),

          whatsapp:
            emptyToNull(
              data.whatsapp
            ),

          website:
            emptyToNull(
              data.website
            ),

          priceRange:
            emptyToNull(
              data.priceRange
            ),

          notes: null,

          status: "Pending",
        })
        .returning({
          id:
            businessOwnershipRequests.id,

          name:
            businessOwnershipRequests.name,

          status:
            businessOwnershipRequests.status,

          createdAt:
            businessOwnershipRequests.createdAt,
        });

    return NextResponse.json(
      {
        success: true,
        message:
          "تم إرسال طلب إضافة النشاط. سيظهر النشاط بعد مراجعة الإدارة والموافقة عليه.",
        data: inserted[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Ownership Request POST Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "حدث خطأ أثناء إرسال طلب النشاط",
      },
      { status: 500 }
    );
  }
}

