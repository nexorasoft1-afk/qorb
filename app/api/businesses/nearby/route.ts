import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";

import { db } from "@/lib/db";

export async function GET(
  request: NextRequest
) {
  try {
    const params =
      request.nextUrl.searchParams;

    const latitude = Number(
      params.get("lat")
    );

    const longitude = Number(
      params.get("lng")
    );

    const radius = Number(
      params.get("radius") ?? 5000
    );

    const categoryIdParam =
      params.get("categoryId");

    const cityIdParam =
      params.get("cityId");

    const limitParam = Number(
      params.get("limit") ?? 20
    );

    // =====================================================
    // Validate latitude
    // =====================================================

    if (
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "خط العرض lat غير صحيح",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // Validate longitude
    // =====================================================

    if (
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "خط الطول lng غير صحيح",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // Validate radius
    // =====================================================

    if (
      !Number.isFinite(radius) ||
      radius <= 0 ||
      radius > 100000
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "نطاق البحث يجب أن يكون بين 1 و100000 متر",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // Normalize limit
    // =====================================================

    const limit = Math.min(
      Math.max(
        Number.isInteger(limitParam)
          ? limitParam
          : 20,
        1
      ),
      100
    );

    // =====================================================
    // Category filter
    // =====================================================

    let categoryId: number | null =
      null;

    if (categoryIdParam) {
      categoryId =
        Number(categoryIdParam);

      if (
        !Number.isInteger(categoryId) ||
        categoryId <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "categoryId غير صحيح",
          },
          { status: 400 }
        );
      }
    }

    // =====================================================
    // City filter
    // =====================================================

    let cityId: number | null = null;

    if (cityIdParam) {
      cityId = Number(cityIdParam);

      if (
        !Number.isInteger(cityId) ||
        cityId <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "cityId غير صحيح",
          },
          { status: 400 }
        );
      }
    }

    // =====================================================
    // Filters
    // =====================================================

    const filters = [
      // businesses عندنا لا يحتوي على is_active
      sql`b.status = 'Approved'`,

      sql`b.location IS NOT NULL`,

      sql`
        extensions.ST_DWithin(
          b.location::geography,
          extensions.ST_SetSRID(
            extensions.ST_MakePoint(
              ${longitude},
              ${latitude}
            ),
            4326
          )::geography,
          ${radius}
        )
      `,
    ];

    // =====================================================
    // Category filter
    // =====================================================

    if (categoryId !== null) {
      filters.push(
        sql`b.category_id = ${categoryId}`
      );
    }

    // =====================================================
    // City filter
    // =====================================================

    if (cityId !== null) {
      filters.push(
        sql`b.city_id = ${cityId}`
      );
    }

    // =====================================================
    // Build WHERE
    // =====================================================

    const whereClause = sql.join(
      filters,
      sql` AND `
    );

    // =====================================================
    // Query
    // =====================================================

    const result = await db.execute(sql`
      SELECT
        b.id,
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
        b.is_verified,

        c.id AS category_id,
        c.name AS category_name,
        c.slug AS category_slug,

        ci.id AS city_id,
        ci.name AS city_name,

        extensions.ST_Distance(
          b.location::geography,
          extensions.ST_SetSRID(
            extensions.ST_MakePoint(
              ${longitude},
              ${latitude}
            ),
            4326
          )::geography
        ) AS distance_meters,

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
        ) AS reviews_count,

        (
          SELECT bi.image_url
          FROM business_images bi
          WHERE bi.business_id = b.id
          ORDER BY
            bi.is_cover DESC,
            bi.sort_order ASC,
            bi.id ASC
          LIMIT 1
        ) AS cover_image

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

      ORDER BY distance_meters ASC

      LIMIT ${limit}
    `);

    // =====================================================
    // Response
    // =====================================================

    return NextResponse.json({
      success: true,

      location: {
        latitude,
        longitude,
      },

      radius,

      count: result.rows.length,

      data: result.rows,
    });
  } catch (error) {
    console.error(
      "Nearby Businesses Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "حدث خطأ أثناء البحث عن الأماكن القريبة",
      },
      { status: 500 }
    );
  }
}