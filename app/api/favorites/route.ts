import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  favorites,
  businesses,
  categories,
  cities,
} from "@/app/db/schema";
import { getSession } from "@/lib/auth";

export async function GET() {
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

    const rows = await db
      .select({
        favoriteId:
          favorites.id,
        createdAt:
          favorites.createdAt,
        businessId:
          businesses.id,
        name:
          businesses.name,
        slug:
          businesses.slug,
        description:
          businesses.description,
        address:
          businesses.address,
        phone:
          businesses.phone,
        whatsapp:
          businesses.whatsapp,
        categoryId:
          categories.id,
        categoryName:
          categories.name,
        cityId:
          cities.id,
        cityName:
          cities.name,
      })
      .from(favorites)
      .innerJoin(
        businesses,
        eq(
          businesses.id,
          favorites.businessId
        )
      )
      .innerJoin(
        categories,
        eq(
          categories.id,
          businesses.categoryId
        )
      )
      .innerJoin(
        cities,
        eq(
          cities.id,
          businesses.cityId
        )
      )
      .where(
        and(
          eq(
            favorites.userId,
            user.id
          ),
          eq(
            businesses.status,
            "Approved"
          )
        )
      )
      .orderBy(
        favorites.createdAt
      );

    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error(
      "Favorites GET Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "حدث خطأ أثناء جلب المفضلة",
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

    const businessId =
      Number(body?.businessId);

    if (
      !Number.isInteger(
        businessId
      ) ||
      businessId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "businessId غير صحيح",
        },
        { status: 400 }
      );
    }

    const business =
      await db
        .select({
          id: businesses.id,
        })
        .from(businesses)
        .where(
          and(
            eq(
              businesses.id,
              businessId
            ),
            eq(
              businesses.status,
              "Approved"
            )
          )
        )
        .limit(1);

    if (!business[0]) {
      return NextResponse.json(
        {
          success: false,
          message:
            "النشاط غير موجود",
        },
        { status: 404 }
      );
    }

    const existing =
      await db
        .select({
          id: favorites.id,
        })
        .from(favorites)
        .where(
          and(
            eq(
              favorites.userId,
              user.id
            ),
            eq(
              favorites.businessId,
              businessId
            )
          )
        )
        .limit(1);

    if (existing[0]) {
      return NextResponse.json({
        success: true,
        message:
          "النشاط موجود بالفعل في المفضلة",
        favorite: true,
      });
    }

    await db
      .insert(favorites)
      .values({
        userId: user.id,
        businessId,
      });

    return NextResponse.json(
      {
        success: true,
        message:
          "تمت إضافة النشاط إلى المفضلة",
        favorite: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Favorites POST Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "حدث خطأ أثناء إضافة المفضلة",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest
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

    const businessId =
      Number(
        request.nextUrl.searchParams.get(
          "businessId"
        )
      );

    if (
      !Number.isInteger(
        businessId
      ) ||
      businessId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "businessId غير صحيح",
        },
        { status: 400 }
      );
    }

    await db
      .delete(favorites)
      .where(
        and(
          eq(
            favorites.userId,
            user.id
          ),
          eq(
            favorites.businessId,
            businessId
          )
        )
      );

    return NextResponse.json({
      success: true,
      message:
        "تمت إزالة النشاط من المفضلة",
      favorite: false,
    });
  } catch (error) {
    console.error(
      "Favorites DELETE Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "حدث خطأ أثناء إزالة المفضلة",
      },
      { status: 500 }
    );
  }
}