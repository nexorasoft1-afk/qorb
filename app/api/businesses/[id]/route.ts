import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  businesses,
  businessImages,
  businessServices,
  businessHours,
  categories,
  subCategories,
  cities,
  governorates,
  reviews,
  users,
} from "@/app/db/schema";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const businessId = Number(id);

    if (
      !Number.isInteger(businessId) ||
      businessId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "معرف النشاط غير صحيح",
        },
        { status: 400 }
      );
    }

    const rows = await db
      .select({
        id: businesses.id,
        ownerId: businesses.ownerId,
        name: businesses.name,
        slug: businesses.slug,
        description: businesses.description,

        categoryId: businesses.categoryId,
        categoryName: categories.name,
        categorySlug: categories.slug,

        subCategoryId: businesses.subCategoryId,
        subCategoryName: subCategories.name,

        governorateId: businesses.governorateId,
        governorateName: governorates.name,

        cityId: businesses.cityId,
        cityName: cities.name,

        areaId: businesses.areaId,
        address: businesses.address,

        latitude: businesses.latitude,
        longitude: businesses.longitude,

        phone: businesses.phone,
        whatsapp: businesses.whatsapp,
        website: businesses.website,
        priceRange: businesses.priceRange,

        status: businesses.status,
        isVerified: businesses.isVerified,

        createdAt: businesses.createdAt,
        updatedAt: businesses.updatedAt,
      })
      .from(businesses)
      .innerJoin(
        categories,
        eq(
          categories.id,
          businesses.categoryId
        )
      )
      .leftJoin(
        subCategories,
        eq(
          subCategories.id,
          businesses.subCategoryId
        )
      )
      .innerJoin(
        governorates,
        eq(
          governorates.id,
          businesses.governorateId
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

    const business = rows[0];

    if (!business) {
      return NextResponse.json(
        {
          success: false,
          message: "النشاط غير موجود",
        },
        { status: 404 }
      );
    }

    const [
      images,
      services,
      hours,
      reviewRows,
    ] = await Promise.all([
      // =====================================================
      // الصور
      // =====================================================
      db
        .select({
          id: businessImages.id,

          // نحتفظ بالقيمة الأصلية إن وجدت
          imageUrl:
            businessImages.imageUrl,

          isCover:
            businessImages.isCover,

          sortOrder:
            businessImages.sortOrder,
        })
        .from(businessImages)
        .where(
          eq(
            businessImages.businessId,
            businessId
          )
        )
        .orderBy(
          businessImages.sortOrder
        )
        .then((rows) =>
          rows.map((image) => ({
            ...image,

            // لو عندنا imageUrl استخدمه
            // وإلا استخدم API الصور من قاعدة البيانات
            imageUrl:
              image.imageUrl ||
              `/api/business-images/${image.id}`,
          }))
        ),

      // =====================================================
      // الخدمات
      // =====================================================
      db
        .select({
          id: businessServices.id,

          name:
            businessServices.name,

          description:
            businessServices.description,

          price:
            businessServices.price,

          durationMinutes:
            businessServices.durationMinutes,

          sortOrder:
            businessServices.sortOrder,
        })
        .from(businessServices)
        .where(
          and(
            eq(
              businessServices.businessId,
              businessId
            ),
            eq(
              businessServices.isActive,
              true
            )
          )
        )
        .orderBy(
          businessServices.sortOrder
        ),

      // =====================================================
      // مواعيد العمل
      // =====================================================
      db
        .select({
          id: businessHours.id,

          dayOfWeek:
            businessHours.dayOfWeek,

          openTime:
            businessHours.openTime,

          closeTime:
            businessHours.closeTime,

          isClosed:
            businessHours.isClosed,
        })
        .from(businessHours)
        .where(
          eq(
            businessHours.businessId,
            businessId
          )
        )
        .orderBy(
          businessHours.dayOfWeek
        ),

      // =====================================================
      // التقييمات
      // =====================================================
      db
        .select({
          id: reviews.id,

          rating:
            reviews.rating,

          comment:
            reviews.comment,

          createdAt:
            reviews.createdAt,

          userName:
            users.fullName,
        })
        .from(reviews)
        .innerJoin(
          users,
          eq(
            users.id,
            reviews.userId
          )
        )
        .where(
          and(
            eq(
              reviews.businessId,
              businessId
            ),
            eq(
              reviews.status,
              "Approved"
            )
          )
        )
        .orderBy(
          reviews.createdAt
        ),
    ]);

    // =====================================================
    // حساب التقييم
    // =====================================================
    const rating =
      reviewRows.length > 0
        ? Number(
            (
              reviewRows.reduce(
                (sum, review) =>
                  sum + review.rating,
                0
              ) /
                reviewRows.length
            ).toFixed(1)
          )
        : 0;

    // =====================================================
    // النتيجة
    // =====================================================
    return NextResponse.json({
      success: true,

      data: {
        ...business,

        images,

        services,

        hours,

        reviews: reviewRows,

        rating,

        reviewsCount:
          reviewRows.length,
      },
    });
  } catch (error) {
    console.error(
      "Business Details API Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "حدث خطأ أثناء جلب بيانات النشاط",
      },
      { status: 500 }
    );
  }
}