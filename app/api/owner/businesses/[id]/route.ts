import { NextRequest, NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

import {
  businesses,
  categories,
  subCategories,
  governorates,
  cities,
  areas,
} from "@/app/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// =========================================================
// Helpers
// =========================================================

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function jsonError(
  message: string,
  status = 400
) {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status }
  );
}

function normalizeText(
  value: unknown
): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const text = String(value).trim();

  return text.length > 0 ? text : null;
}

function parseNullableNumber(
  value: unknown
): number | null {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return null;
  }

  return numberValue;
}

function parseBusinessId(
  value: string
): number | null {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

async function getCurrentUser() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const sessionAny = session as any;

  const user =
    sessionAny.user ??
    sessionAny;

  if (!user) {
    return null;
  }

  const userId = Number(
    user.id ??
      user.userId ??
      user.userID ??
      user.UserID
  );

  if (!Number.isInteger(userId) || userId <= 0) {
    return null;
  }

  return {
    ...user,
    id: userId,
    role:
      user.role ??
      user.Role ??
      null,
  };
}

async function getOwnedBusiness(
  businessId: number,
  userId: number
) {
  const result = await db
    .select({
      business: businesses,
    })
    .from(businesses)
    .where(
      and(
        eq(businesses.id, businessId),
        eq(businesses.ownerId, userId)
      )
    )
    .limit(1);

  return result[0]?.business ?? null;
}

// =========================================================
// GET
// =========================================================

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return jsonError(
        "يجب تسجيل الدخول أولاً",
        401
      );
    }

    if (
      user.role &&
      user.role !== "BusinessOwner" &&
      user.role !== "Admin"
    ) {
      return jsonError(
        "غير مصرح لك بالوصول",
        403
      );
    }

    const { id } = await context.params;

    const businessId = parseBusinessId(id);

    if (!businessId) {
      return jsonError(
        "رقم النشاط غير صحيح",
        400
      );
    }

    const baseBusiness =
      user.role === "Admin"
        ? await db
            .select()
            .from(businesses)
            .where(eq(businesses.id, businessId))
            .limit(1)
            .then((rows) => rows[0] ?? null)
        : await getOwnedBusiness(
            businessId,
            user.id
          );

    if (!baseBusiness) {
      return jsonError(
        "النشاط غير موجود أو غير تابع لك",
        404
      );
    }

    const result = await db
      .select({
        business: businesses,

        category: {
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          icon: categories.icon,
        },

        subCategory: {
          id: subCategories.id,
          name: subCategories.name,
          slug: subCategories.slug,
        },

        governorate: {
          id: governorates.id,
          name: governorates.name,
        },

        city: {
          id: cities.id,
          name: cities.name,
          governorateId: cities.governorateId,
        },

        area: {
          id: areas.id,
          name: areas.name,
          cityId: areas.cityId,
        },
      })
      .from(businesses)
      .leftJoin(
        categories,
        eq(
          businesses.categoryId,
          categories.id
        )
      )
      .leftJoin(
        subCategories,
        eq(
          businesses.subCategoryId,
          subCategories.id
        )
      )
      .leftJoin(
        governorates,
        eq(
          businesses.governorateId,
          governorates.id
        )
      )
      .leftJoin(
        cities,
        eq(
          businesses.cityId,
          cities.id
        )
      )
      .leftJoin(
        areas,
        eq(
          businesses.areaId,
          areas.id
        )
      )
      .where(
        eq(
          businesses.id,
          businessId
        )
      )
      .limit(1);

    if (!result[0]) {
      return jsonError(
        "تعذر تحميل بيانات النشاط",
        404
      );
    }

    const row = result[0];

    const business = {
      ...row.business,

      category: row.category ?? null,

      subCategory:
        row.subCategory ?? null,

      governorate:
        row.governorate ?? null,

      city:
        row.city ?? null,

      area:
        row.area ?? null,
    };

    return NextResponse.json({
      success: true,

      business,

      // توافق إضافي مع أي كود قديم
      data: business,
    });
  } catch (error) {
    console.error(
      "[OWNER BUSINESS GET ERROR]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "حدث خطأ أثناء تحميل بيانات النشاط",
      },
      { status: 500 }
    );
  }
}

// =========================================================
// PATCH
// =========================================================

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return jsonError(
        "يجب تسجيل الدخول أولاً",
        401
      );
    }

    if (
      user.role !== "BusinessOwner" &&
      user.role !== "Admin"
    ) {
      return jsonError(
        "غير مصرح لك بتعديل النشاط",
        403
      );
    }

    const { id } = await context.params;

    const businessId = parseBusinessId(id);

    if (!businessId) {
      return jsonError(
        "رقم النشاط غير صحيح",
        400
      );
    }

    const existing =
      user.role === "Admin"
        ? await db
            .select()
            .from(businesses)
            .where(
              eq(
                businesses.id,
                businessId
              )
            )
            .limit(1)
            .then(
              (rows) =>
                rows[0] ?? null
            )
        : await getOwnedBusiness(
            businessId,
            user.id
          );

    if (!existing) {
      return jsonError(
        "النشاط غير موجود أو غير تابع لك",
        404
      );
    }

    const body = await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return jsonError(
        "بيانات الطلب غير صحيحة",
        400
      );
    }

    // =====================================================
    // Basic fields
    // =====================================================

    const name =
      body.name !== undefined
        ? normalizeText(body.name)
        : existing.name;

    if (!name) {
      return jsonError(
        "اسم النشاط مطلوب"
      );
    }

    if (name.length > 200) {
      return jsonError(
        "اسم النشاط طويل جدًا"
      );
    }

    const description =
      body.description !== undefined
        ? normalizeText(
            body.description
          )
        : existing.description;

    const address =
      body.address !== undefined
        ? normalizeText(body.address)
        : existing.address;

    const phone =
      body.phone !== undefined
        ? normalizeText(body.phone)
        : existing.phone;

    const whatsapp =
      body.whatsapp !== undefined
        ? normalizeText(
            body.whatsapp
          )
        : existing.whatsapp;

    const website =
      body.website !== undefined
        ? normalizeText(
            body.website
          )
        : existing.website;

    const priceRange =
      body.priceRange !== undefined
        ? normalizeText(
            body.priceRange
          )
        : existing.priceRange;

    // =====================================================
    // IDs
    // =====================================================

    const categoryId =
      body.categoryId !== undefined
        ? Number(body.categoryId)
        : existing.categoryId;

    if (
      !Number.isInteger(categoryId) ||
      categoryId <= 0
    ) {
      return jsonError(
        "يجب اختيار التصنيف الرئيسي"
      );
    }

    const subCategoryId =
      body.subCategoryId !== undefined
        ? body.subCategoryId === null ||
          body.subCategoryId === ""
          ? null
          : Number(body.subCategoryId)
        : existing.subCategoryId;

    if (
      subCategoryId !== null &&
      (!Number.isInteger(
        subCategoryId
      ) ||
        subCategoryId <= 0)
    ) {
      return jsonError(
        "التصنيف الفرعي غير صحيح"
      );
    }

    const governorateId =
      body.governorateId !== undefined
        ? Number(
            body.governorateId
          )
        : existing.governorateId;

    if (
      !Number.isInteger(
        governorateId
      ) ||
      governorateId <= 0
    ) {
      return jsonError(
        "يجب اختيار المحافظة"
      );
    }

    const cityId =
      body.cityId !== undefined
        ? Number(body.cityId)
        : existing.cityId;

    if (
      !Number.isInteger(cityId) ||
      cityId <= 0
    ) {
      return jsonError(
        "يجب اختيار المدينة"
      );
    }

    const areaId =
      body.areaId !== undefined
        ? body.areaId === null ||
          body.areaId === ""
          ? null
          : Number(body.areaId)
        : existing.areaId;

    if (
      areaId !== null &&
      (!Number.isInteger(areaId) ||
        areaId <= 0)
    ) {
      return jsonError(
        "المنطقة غير صحيحة"
      );
    }

    // =====================================================
    // Coordinates
    // =====================================================

    const latitudeRaw =
      body.latitude !== undefined
        ? body.latitude
        : existing.latitude;

    const longitudeRaw =
      body.longitude !== undefined
        ? body.longitude
        : existing.longitude;

    const latitude =
      parseNullableNumber(
        latitudeRaw
      );

    const longitude =
      parseNullableNumber(
        longitudeRaw
      );

    if (
      latitude !== null &&
      (latitude < -90 ||
        latitude > 90)
    ) {
      return jsonError(
        "خط العرض غير صحيح"
      );
    }

    if (
      longitude !== null &&
      (longitude < -180 ||
        longitude > 180)
    ) {
      return jsonError(
        "خط الطول غير صحيح"
      );
    }

    if (
      (latitude === null) !==
      (longitude === null)
    ) {
      return jsonError(
        "يجب إدخال خط العرض وخط الطول معًا"
      );
    }

    // =====================================================
    // Validate Category
    // =====================================================

    const categoryRows =
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
              categoryId
            ),
            eq(
              categories.isActive,
              true
            )
          )
        )
        .limit(1);

    if (!categoryRows[0]) {
      return jsonError(
        "التصنيف الرئيسي غير موجود أو غير مفعل"
      );
    }

    // =====================================================
    // Validate Sub Category
    // =====================================================

    if (subCategoryId !== null) {
      const subCategoryRows =
        await db
          .select({
            id: subCategories.id,
            name: subCategories.name,
          })
          .from(
            subCategories
          )
          .where(
            and(
              eq(
                subCategories.id,
                subCategoryId
              ),
              eq(
                subCategories.categoryId,
                categoryId
              ),
              eq(
                subCategories.isActive,
                true
              )
            )
          )
          .limit(1);

      if (!subCategoryRows[0]) {
        return jsonError(
          "التصنيف الفرعي لا يتبع التصنيف الرئيسي المحدد"
        );
      }
    }

    // =====================================================
    // Validate Governorate
    // =====================================================

    const governorateRows =
      await db
        .select({
          id: governorates.id,
          name: governorates.name,
        })
        .from(governorates)
        .where(
          and(
            eq(
              governorates.id,
              governorateId
            ),
            eq(
              governorates.isActive,
              true
            )
          )
        )
        .limit(1);

    if (!governorateRows[0]) {
      return jsonError(
        "المحافظة غير موجودة أو غير مفعلة"
      );
    }

    // =====================================================
    // Validate City
    // =====================================================

    const cityRows =
      await db
        .select({
          id: cities.id,
          name: cities.name,
          governorateId:
            cities.governorateId,
        })
        .from(cities)
        .where(
          and(
            eq(
              cities.id,
              cityId
            ),
            eq(
              cities.governorateId,
              governorateId
            ),
            eq(
              cities.isActive,
              true
            )
          )
        )
        .limit(1);

    if (!cityRows[0]) {
      return jsonError(
        "المدينة لا تتبع المحافظة المحددة أو غير مفعلة"
      );
    }

    // =====================================================
    // Validate Area
    // =====================================================

    if (areaId !== null) {
      const areaRows =
        await db
          .select({
            id: areas.id,
            name: areas.name,
            cityId: areas.cityId,
          })
          .from(areas)
          .where(
            and(
              eq(
                areas.id,
                areaId
              ),
              eq(
                areas.cityId,
                cityId
              ),
              eq(
                areas.isActive,
                true
              )
            )
          )
          .limit(1);

      if (!areaRows[0]) {
        return jsonError(
          "المنطقة لا تتبع المدينة المحددة أو غير مفعلة"
        );
      }
    }

    // =====================================================
    // Prepare Update
    // =====================================================

    const updateData: any = {
      name,
      description,
      categoryId,
      subCategoryId,
      governorateId,
      cityId,
      areaId,
      address,
      latitude:
        latitude === null
          ? null
          : String(latitude),
      longitude:
        longitude === null
          ? null
          : String(longitude),
      phone,
      whatsapp,
      website,
      priceRange,
      updatedAt: new Date(),
    };

    // =====================================================
    // PostGIS Location
    // =====================================================

    if (
      latitude !== null &&
      longitude !== null
    ) {
      updateData.location =
        sqlLocation(
          longitude,
          latitude
        );
    } else {
      updateData.location = null;
    }

    // =====================================================
    // Update
    // =====================================================

    await db
      .update(businesses)
      .set(updateData)
      .where(
        eq(
          businesses.id,
          businessId
        )
      );

    // =====================================================
    // Return Updated Business
    // =====================================================

    const updated =
      await db
        .select({
          business: businesses,

          category: {
            id: categories.id,
            name: categories.name,
            slug: categories.slug,
            icon: categories.icon,
          },

          subCategory: {
            id: subCategories.id,
            name: subCategories.name,
            slug: subCategories.slug,
          },

          governorate: {
            id: governorates.id,
            name: governorates.name,
          },

          city: {
            id: cities.id,
            name: cities.name,
            governorateId:
              cities.governorateId,
          },

          area: {
            id: areas.id,
            name: areas.name,
            cityId: areas.cityId,
          },
        })
        .from(businesses)
        .leftJoin(
          categories,
          eq(
            businesses.categoryId,
            categories.id
          )
        )
        .leftJoin(
          subCategories,
          eq(
            businesses.subCategoryId,
            subCategories.id
          )
        )
        .leftJoin(
          governorates,
          eq(
            businesses.governorateId,
            governorates.id
          )
        )
        .leftJoin(
          cities,
          eq(
            businesses.cityId,
            cities.id
          )
        )
        .leftJoin(
          areas,
          eq(
            businesses.areaId,
            areas.id
          )
        )
        .where(
          eq(
            businesses.id,
            businessId
          )
        )
        .limit(1);

    if (!updated[0]) {
      return jsonError(
        "تم الحفظ ولكن تعذر تحميل البيانات الجديدة",
        500
      );
    }

    const row = updated[0];

    const business = {
      ...row.business,
      category:
        row.category ?? null,
      subCategory:
        row.subCategory ?? null,
      governorate:
        row.governorate ?? null,
      city:
        row.city ?? null,
      area:
        row.area ?? null,
    };

    return NextResponse.json({
      success: true,
      message:
        "تم تحديث بيانات النشاط بنجاح",
      business,
      data: business,
    });
  } catch (error: any) {
    console.error(
      "[OWNER BUSINESS PATCH ERROR]",
      error
    );

    // أخطاء PostgreSQL/Drizzle المعروفة
    if (
      error?.code === "23505"
    ) {
      return jsonError(
        "توجد بيانات مكررة بالفعل",
        409
      );
    }

    if (
      error?.code === "23503"
    ) {
      return jsonError(
        "أحد البيانات المرتبطة بالنشاط غير صحيح",
        400
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "حدث خطأ أثناء حفظ بيانات النشاط",
      },
      { status: 500 }
    );
  }
}

// =========================================================
// PostGIS helper
// =========================================================
//
// نستخدم SQL expression حتى يتم تخزين النقطة بالشكل:
// POINT(longitude latitude)
// مع SRID 4326.
//

function sqlLocation(
  longitude: number,
  latitude: number
) {
  return sql`
    ST_SetSRID(
      ST_MakePoint(
        ${longitude},
        ${latitude}
      ),
      4326
    )
  `;
}