import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { businesses } from "@/app/db/schema";

import { getSession } from "@/lib/auth";
import { businessSchema } from "@/lib/validations/business";

import {
  createSlug,
  emptyToNull,
  normalizeText,
} from "@/lib/utils";

import { pointFromCoordinates } from "@/lib/geo";

// =========================================================
// GET
// جلب الأنشطة المعتمدة
// =========================================================

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;

    const categoryId = params.get("categoryId");
    const subCategoryId = params.get("subCategoryId");
    const cityId = params.get("cityId");
    const areaId = params.get("areaId");

    const limitValue = Number(
      params.get("limit") ?? 20
    );

    const limit = Math.min(
      Math.max(
        Number.isInteger(limitValue)
          ? limitValue
          : 20,
        1
      ),
      100
    );

    const conditions = [
      sql`b.status = 'Approved'`,
    ];

    // =====================================================
    // CATEGORY
    // =====================================================

    if (categoryId) {
      const value = Number(categoryId);

      if (
        !Number.isInteger(value) ||
        value <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "categoryId غير صحيح",
          },
          { status: 400 }
        );
      }

      conditions.push(
        sql`b.category_id = ${value}`
      );
    }

    // =====================================================
    // SUB CATEGORY
    // =====================================================

    if (subCategoryId) {
      const value = Number(subCategoryId);

      if (
        !Number.isInteger(value) ||
        value <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "subCategoryId غير صحيح",
          },
          { status: 400 }
        );
      }

      conditions.push(
        sql`b.sub_category_id = ${value}`
      );
    }

    // =====================================================
    // CITY
    // =====================================================

    if (cityId) {
      const value = Number(cityId);

      if (
        !Number.isInteger(value) ||
        value <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "cityId غير صحيح",
          },
          { status: 400 }
        );
      }

      conditions.push(
        sql`b.city_id = ${value}`
      );
    }

    // =====================================================
    // AREA
    // =====================================================

    if (areaId) {
      const value = Number(areaId);

      if (
        !Number.isInteger(value) ||
        value <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "areaId غير صحيح",
          },
          { status: 400 }
        );
      }

      conditions.push(
        sql`b.area_id = ${value}`
      );
    }

    const whereClause = sql.join(
      conditions,
      sql` AND `
    );

    // =====================================================
    // QUERY
    // =====================================================

    const result = await db.execute(sql`
      SELECT
        b.id,
        b.owner_id,
        b.name,
        b.slug,
        b.description,
        b.address,
        b.latitude,
        b.longitude,
        b.phone,
        b.whatsapp,
        b.website,
        b.price_range,
        b.status,
        b.is_verified,
        b.created_at,
        b.updated_at,

        c.id AS category_id,
        c.name AS category_name,
        c.slug AS category_slug,

        ci.id AS city_id,
        ci.name AS city_name,

        -- =================================================
        -- COVER IMAGE
        -- الصورة الفعلية محفوظة في image_data
        -- لذلك نستخدم API لعرضها
        -- =================================================

        (
          SELECT bi.id
          FROM business_images bi
          WHERE bi.business_id = b.id
          ORDER BY
            bi.is_cover DESC,
            bi.sort_order ASC,
            bi.id ASC
          LIMIT 1
        ) AS cover_image_id,

        (
          SELECT
            CASE
              WHEN bi.id IS NOT NULL
              THEN '/api/business-images/' || bi.id::text
              ELSE NULL
            END
          FROM business_images bi
          WHERE bi.business_id = b.id
          ORDER BY
            bi.is_cover DESC,
            bi.sort_order ASC,
            bi.id ASC
          LIMIT 1
        ) AS cover_image,

        COALESCE(
          ROUND(
            AVG(
              CASE
                WHEN r.status = 'Approved'
                THEN r.rating
              END
            )::numeric,
            1
          ),
          0
        ) AS rating,

        COUNT(
          CASE
            WHEN r.status = 'Approved'
            THEN r.id
          END
        ) AS reviews_count

      FROM businesses b

      INNER JOIN categories c
        ON c.id = b.category_id

      INNER JOIN cities ci
        ON ci.id = b.city_id

      LEFT JOIN reviews r
        ON r.business_id = b.id

      WHERE ${whereClause}

      GROUP BY
        b.id,
        c.id,
        c.name,
        c.slug,
        ci.id,
        ci.name

      ORDER BY b.created_at DESC

      LIMIT ${limit}
    `);

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error(
      "Businesses GET Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "حدث خطأ أثناء جلب الأنشطة",
      },
      { status: 500 }
    );
  }
}
export async function POST(request: Request) {
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

    // =====================================================
    // ADMIN ONLY
    // =====================================================

    if (user.role !== "Admin") {
      return NextResponse.json(
        {
          success: false,
          message:
            "إضافة النشاط مباشرة متاحة للإدارة فقط. أرسل طلب إضافة نشاط.",
        },
        { status: 403 }
      );
    }

    // =====================================================
    // VALIDATION
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
    // NORMALIZE DATA
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

    const latitude =
      data.latitude ?? null;

    const longitude =
      data.longitude ?? null;

    // =====================================================
    // SLUG
    // =====================================================

    const baseSlug =
      createSlug(name) || "business";

    const slug =
      `${baseSlug}-${Date.now()
        .toString()
        .slice(-8)}`;

    // =====================================================
    // LOCATION
    // =====================================================

    const location =
      latitude !== null &&
      longitude !== null
        ? pointFromCoordinates(
            latitude,
            longitude
          )
        : null;

    // =====================================================
    // INSERT
    // =====================================================

    const inserted = await db
      .insert(businesses)
      .values({
        ownerId: user.id,

        name,
        slug,

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

        location,

        phone,
        whatsapp,
        website,
        priceRange,

        status: "Approved",

        isVerified: true,
      })
      .returning({
        id: businesses.id,
        ownerId: businesses.ownerId,
        name: businesses.name,
        slug: businesses.slug,
        status: businesses.status,
        isVerified:
          businesses.isVerified,
      });

    const business = inserted[0];

    return NextResponse.json(
      {
        success: true,
        message:
          "تم إنشاء النشاط واعتماده بنجاح",
        data: business,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Businesses POST Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "حدث خطأ أثناء إنشاء النشاط",
      },
      { status: 500 }
    );
  }
}