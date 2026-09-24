import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";

import { db } from "@/lib/db";

export async function GET(
  request: NextRequest
) {
  try {
    const params =
      request.nextUrl.searchParams;

    const q =
      params.get("q")?.trim() ?? "";

    const categoryIdParam =
      params.get("categoryId");

    const cityIdParam =
      params.get("cityId");

    const limitParam = Number(
      params.get("limit") ?? 30
    );

    if (q.length < 2) {
      return NextResponse.json(
        {
          success: false,
          message:
            "اكتب كلمتين على الأقل للبحث",
        },
        { status: 400 }
      );
    }

    const limit = Math.min(
      Math.max(
        Number.isInteger(limitParam)
          ? limitParam
          : 30,
        1
      ),
      100
    );

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

    const searchPattern =
      `%${q}%`;

    const filters = [
      sql`b.is_active = true`,
      sql`b.status = 'Approved'`,
      sql`
        (
          b.name ILIKE ${searchPattern}
          OR COALESCE(b.description, '') ILIKE ${searchPattern}
          OR COALESCE(b.address, '') ILIKE ${searchPattern}
          OR c.name ILIKE ${searchPattern}
          OR sc.name ILIKE ${searchPattern}
        )
      `,
    ];

    if (categoryId !== null) {
      filters.push(
        sql`b.category_id = ${categoryId}`
      );
    }

    if (cityId !== null) {
      filters.push(
        sql`b.city_id = ${cityId}`
      );
    }

    const whereClause = sql.join(
      filters,
      sql` AND `
    );

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

        sc.id AS subcategory_id,
        sc.name AS subcategory_name,

        ci.id AS city_id,
        ci.name AS city_name,

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
        ) AS cover_image

      FROM businesses b

      INNER JOIN categories c
        ON c.id = b.category_id

      LEFT JOIN sub_categories sc
        ON sc.id = b.sub_category_id

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
        sc.id,
        sc.name,
        ci.id,
        ci.name

      ORDER BY
        CASE
          WHEN b.name ILIKE ${q}
            THEN 0
          WHEN b.name ILIKE ${`${q}%`}
            THEN 1
          ELSE 2
        END,
        b.is_verified DESC,
        rating DESC,
        b.name ASC

      LIMIT ${limit}
    `);

    return NextResponse.json({
      success: true,
      query: q,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error(
      "Business Search Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "حدث خطأ أثناء البحث",
      },
      { status: 500 }
    );
  }
}

