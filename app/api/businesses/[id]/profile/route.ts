import { NextRequest, NextResponse } from "next/server";
import {
  and,
  asc,
  desc,
  eq,
  gt,
  lte,
} from "drizzle-orm";

import { db } from "@/lib/db";
import {
  areas,
  businessHours,
  businessImages,
  businessPublicEvents,
  businessServices,
  businesses,
  cities,
  categories,
  offers,
  subCategories,
} from "@/app/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseId(value: string): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function GET(
  _request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;
    const businessId = parseId(id);

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: "معرف النشاط غير صالح" },
        { status: 400 }
      );
    }

    const [business] = await db
      .select({
        id: businesses.id,
        name: businesses.name,
        slug: businesses.slug,
        description: businesses.description,
        categoryId: businesses.categoryId,
        categoryName: categories.name,
        categorySlug: categories.slug,
        subCategoryId: businesses.subCategoryId,
        subCategoryName: subCategories.name,
        governorateId: businesses.governorateId,
        cityId: businesses.cityId,
        cityName: cities.name,
        areaId: businesses.areaId,
        areaName: areas.name,
        address: businesses.address,
        latitude: businesses.latitude,
        longitude: businesses.longitude,
        phone: businesses.phone,
        whatsapp: businesses.whatsapp,
        website: businesses.website,
        priceRange: businesses.priceRange,
        status: businesses.status,
        isVerified: businesses.isVerified,
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
      .where(eq(businesses.id, businessId))
      .limit(1);

    if (!business) {
      return NextResponse.json(
        { success: false, error: "النشاط غير موجود" },
        { status: 404 }
      );
    }

    if (business.status !== "Approved") {
      return NextResponse.json(
        {
          success: false,
          error: "هذا النشاط غير متاح حاليًا",
        },
        { status: 404 }
      );
    }

    const now = new Date();

    const [
      images,
      services,
      hours,
      activeOffers,
      events,
    ] = await Promise.all([
      db
        .select({
          id: businessImages.id,
          imageUrl: businessImages.imageUrl,
          isCover: businessImages.isCover,
          sortOrder: businessImages.sortOrder,
          fileName: businessImages.fileName,
        })
        .from(businessImages)
        .where(
          eq(
            businessImages.businessId,
            businessId
          )
        )
        .orderBy(
          desc(businessImages.isCover),
          asc(businessImages.sortOrder),
          asc(businessImages.id)
        )
        .then((rows) =>
          rows.map((row) => ({
            ...row,
            url:
              row.imageUrl ||
              `/api/business-images/${row.id}`,
          }))
        ),

      db
        .select({
          id: businessServices.id,
          name: businessServices.name,
          description: businessServices.description,
          price: businessServices.price,
          durationMinutes:
            businessServices.durationMinutes,
          sortOrder: businessServices.sortOrder,
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
          asc(
            businessServices.sortOrder
          ),
          asc(businessServices.id)
        ),

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
          asc(
            businessHours.dayOfWeek
          )
        ),

      db
        .select({
          id: offers.id,
          title: offers.title,
          description: offers.description,
          discountType:
            offers.discountType,
          discountValue:
            offers.discountValue,
          startDate:
            offers.startDate,
          endDate:
            offers.endDate,
        })
        .from(offers)
        .where(
          and(
            eq(offers.businessId, businessId),
            eq(offers.isActive, true),
            lte(offers.startDate, now),
            gt(offers.endDate, now)
          )
        )
        .orderBy(
          asc(offers.endDate),
          asc(offers.id)
        ),

      db
        .select({
          id: businessPublicEvents.id,
          title: businessPublicEvents.title,
          description:
            businessPublicEvents.description,
          startAt:
            businessPublicEvents.startAt,
          endAt:
            businessPublicEvents.endAt,
        })
        .from(businessPublicEvents)
        .where(
          and(
            eq(
              businessPublicEvents.businessId,
              businessId
            ),
            eq(
              businessPublicEvents.isActive,
              true
            ),
            gt(
              businessPublicEvents.endAt,
              now
            )
          )
        )
        .orderBy(
          asc(
            businessPublicEvents.startAt
          ),
          asc(businessPublicEvents.id)
        ),
    ]);

    return NextResponse.json({
      success: true,
      business,
      images,
      services,
      hours,
      offers: activeOffers,
      events,
      data: {
        business,
        images,
        services,
        hours,
        offers: activeOffers,
        events,
      },
    });
  } catch (error) {
    console.error("GET public business profile error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "حدث خطأ أثناء تحميل بيانات النشاط",
      },
      { status: 500 }
    );
  }
}
