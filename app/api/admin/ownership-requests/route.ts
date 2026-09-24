import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import {
  businessOwnershipRequests,
  users,
  businesses,
  categories,
  subCategories,
  cities,
  areas,
} from "@/app/db/schema";

export async function GET() {
  try {
    const admin = await requireRole(["Admin"]);

    const requests = await db
      .select({
        id: businessOwnershipRequests.id,
        userId: businessOwnershipRequests.userId,
        businessId: businessOwnershipRequests.businessId,

        requestType: businessOwnershipRequests.requestType,
        status: businessOwnershipRequests.status,

        name: businessOwnershipRequests.name,
        description: businessOwnershipRequests.description,

        categoryId: businessOwnershipRequests.categoryId,
        categoryName: categories.name,

        subCategoryId: businessOwnershipRequests.subCategoryId,
        subCategoryName: subCategories.name,

        cityId: businessOwnershipRequests.cityId,
        cityName: cities.name,

        areaId: businessOwnershipRequests.areaId,
        areaName: areas.name,

        address: businessOwnershipRequests.address,
        latitude: businessOwnershipRequests.latitude,
        longitude: businessOwnershipRequests.longitude,

        phone: businessOwnershipRequests.phone,
        whatsapp: businessOwnershipRequests.whatsapp,
        website: businessOwnershipRequests.website,
        priceRange: businessOwnershipRequests.priceRange,
        notes: businessOwnershipRequests.notes,

        createdAt: businessOwnershipRequests.createdAt,
        reviewedAt: businessOwnershipRequests.reviewedAt,
        reviewedBy: businessOwnershipRequests.reviewedBy,

        userName: users.fullName,
        userEmail: users.email,
        userPhone: users.phone,

        existingBusinessName: businesses.name,
        existingBusinessOwnerId: businesses.ownerId,
      })
      .from(businessOwnershipRequests)
      .innerJoin(
        users,
        eq(users.id, businessOwnershipRequests.userId)
      )
      .leftJoin(
        businesses,
        eq(
          businesses.id,
          businessOwnershipRequests.businessId
        )
      )
      .leftJoin(
        categories,
        eq(
          categories.id,
          businessOwnershipRequests.categoryId
        )
      )
      .leftJoin(
        subCategories,
        eq(
          subCategories.id,
          businessOwnershipRequests.subCategoryId
        )
      )
      .leftJoin(
        cities,
        eq(cities.id, businessOwnershipRequests.cityId)
      )
      .leftJoin(
        areas,
        eq(areas.id, businessOwnershipRequests.areaId)
      )
      .orderBy(desc(businessOwnershipRequests.createdAt));

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        fullName: admin.fullName,
      },
      requests,
    });
  } catch (error) {
    console.error(
      "GET /api/admin/ownership-requests error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "حدث خطأ غير متوقع";

    if (message === "UNAUTHORIZED") {
      return NextResponse.json(
        {
          success: false,
          message: "يجب تسجيل الدخول",
        },
        { status: 401 }
      );
    }

    if (message === "FORBIDDEN") {
      return NextResponse.json(
        {
          success: false,
          message: "ليس لديك صلاحية للوصول إلى هذه الصفحة",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "تعذر تحميل طلبات الملكية",
      },
      { status: 500 }
    );
  }
}