

import { NextResponse } from "next/server";
import { and, eq , desc} from "drizzle-orm";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

import {
  businessOwnershipRequests,
  categories,
  subCategories,
  governorates,
  cities,
  areas,
} from "@/app/db/schema";

import { businessSchema } from "@/lib/validations/business";
import {
  emptyToNull,
  normalizeText,
} from "@/lib/utils";
// =========================================================
// GET - جلب طلبات المستخدم الحالي
// =========================================================

export async function GET() {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "غير مصرح",
        },
        { status: 401 }
      );
    }

    const requests =
      await db
        .select()
        .from(businessOwnershipRequests)
        .where(
          eq(
            businessOwnershipRequests.userId,
            user.id
          )
        )
        .orderBy(
          desc(
            businessOwnershipRequests.createdAt
          )
        );

    return NextResponse.json(
      {
        success: true,

        // الاسم الأساسي الذي تستخدمه الصفحة
        requests,

        // نعيد data أيضًا لتجنب اختلاف شكل الاستجابة
        data: requests,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Owner requests GET error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "حدث خطأ أثناء تحميل الطلبات",
        requests: [],
        data: [],
      },
      { status: 500 }
    );
  }
}
export async function POST(request: Request) {
  try {
    // =====================================================
    // AUTH
    // =====================================================

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

    // =====================================================
    // BODY
    // =====================================================

    const body = await request.json();

    const parsed =
      businessSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "بيانات النشاط غير صحيحة",
          errors: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // =====================================================
    // NORMALIZE
    // =====================================================

    const name = normalizeText(data.name);

    const description =
      emptyToNull(data.description);

    const address =
      emptyToNull(data.address);

    const phone =
      emptyToNull(data.phone);

    const whatsapp =
      emptyToNull(data.whatsapp);

    const website =
      emptyToNull(data.website);

    const priceRange =
      emptyToNull(data.priceRange);

    // =====================================================
    // CHECK CATEGORY
    // =====================================================

    const category =
      await db
        .select({
          id: categories.id,
          name: categories.name,
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

    if (category.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "التصنيف غير موجود أو غير نشط",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // CHECK SUB CATEGORY
    // =====================================================

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

      if (subCategory.length === 0) {
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

    // =====================================================
    // CHECK GOVERNORATE
    // =====================================================

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

    if (governorate.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "المحافظة غير موجودة أو غير نشطة",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // CHECK CITY
    // =====================================================

    const city =
      await db
        .select({
          id: cities.id,
        })
        .from(cities)
        .where(
          and(
            eq(
              cities.id,
              data.cityId
            ),
            eq(
              cities.governorateId,
              data.governorateId
            ),
            eq(
              cities.isActive,
              true
            )
          )
        )
        .limit(1);

    if (city.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "المدينة غير صحيحة أو لا تتبع المحافظة المحددة",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // CHECK AREA
    // المنطقة اختيارية
    // =====================================================

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

      if (area.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message:
              "المنطقة غير صحيحة أو لا تتبع المدينة المحددة",
          },
          { status: 400 }
        );
      }
    }

    // =====================================================
    // CHECK PENDING DUPLICATE
    // =====================================================

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
              businessOwnershipRequests.requestType,
              "Create"
            ),
            eq(
              businessOwnershipRequests.status,
              "Pending"
            ),
            eq(
              businessOwnershipRequests.cityId,
              data.cityId
            ),
            eq(
              businessOwnershipRequests.name,
              name
            )
          )
        )
        .limit(1);

    if (pendingRequest.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "لديك بالفعل طلب معلق بنفس اسم النشاط في هذه المدينة",
        },
        { status: 409 }
      );
    }

    // =====================================================
    // LOCATION
    // =====================================================

    const latitude =
      data.latitude ?? null;

    const longitude =
      data.longitude ?? null;

    // =====================================================
    // CREATE REQUEST
    // =====================================================

    const [createdRequest] =
      await db
        .insert(
          businessOwnershipRequests
        )
        .values({
          userId: user.id,

          businessId: null,

          requestType: "Create",

          name,

          description,

          categoryId:
            data.categoryId,

          subCategoryId:
            data.subCategoryId ?? null,

          governorateId:
            data.governorateId,

          cityId:
            data.cityId,

          areaId:
            data.areaId ?? null,

          address,

          latitude:
            latitude !== null
              ? latitude.toString()
              : null,

          longitude:
            longitude !== null
              ? longitude.toString()
              : null,

          phone,

          whatsapp,

          website,

          priceRange,

          status: "Pending",

          notes: null,
        })
        .returning({
          id:
            businessOwnershipRequests.id,

          status:
            businessOwnershipRequests.status,

          requestType:
            businessOwnershipRequests.requestType,

          createdAt:
            businessOwnershipRequests.createdAt,
        });

    return NextResponse.json(
      {
        success: true,
        message:
          "تم إرسال طلب إضافة النشاط بنجاح، وسيتم مراجعته من الإدارة",

        request: createdRequest,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST /api/owner/requests Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "حدث خطأ أثناء إرسال طلب إضافة النشاط",
      },
      { status: 500 }
    );
  }
}