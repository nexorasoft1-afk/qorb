import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

import {
  businesses,
  categories,
  cities,
  businessImages,
} from "@/app/db/schema";

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

    if (
      user.role !== "BusinessOwner" &&
      user.role !== "Admin"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "هذا القسم مخصص لأصحاب الأنشطة",
        },
        { status: 403 }
      );
    }

    const rows = await db
      .select({
        id: businesses.id,
        name: businesses.name,
        slug: businesses.slug,
        description:
          businesses.description,

        categoryName:
          categories.name,

        cityName:
          cities.name,

        address:
          businesses.address,

        phone:
          businesses.phone,

        whatsapp:
          businesses.whatsapp,

        status:
          businesses.status,

        isVerified:
          businesses.isVerified,
       
        latitude:
          businesses.latitude,

        longitude:
          businesses.longitude,

        createdAt:
          businesses.createdAt,

        updatedAt:
          businesses.updatedAt,

        coverImage:
          businessImages.imageUrl,
      })
      .from(businesses)
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
      .leftJoin(
        businessImages,
        eq(
          businessImages.businessId,
          businesses.id
        )
      )
      .where(
        eq(
          businesses.ownerId,
          user.id
        )
      );

    const uniqueBusinesses =
      rows.reduce<
        typeof rows
      >((acc, row) => {
        const existing =
          acc.find(
            (item) =>
              item.id === row.id
          );

        if (existing) {
          if (
            !existing.coverImage &&
            row.coverImage
          ) {
            existing.coverImage =
              row.coverImage;
          }

          return acc;
        }

        acc.push({
          ...row,
        });

        return acc;
      }, []);

    return NextResponse.json({
      success: true,
      count:
        uniqueBusinesses.length,
      data: uniqueBusinesses,
    });
  } catch (error) {
    console.error(
      "Owner Businesses API Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "حدث خطأ أثناء جلب أنشطتك",
      },
      { status: 500 }
    );
  }
}

