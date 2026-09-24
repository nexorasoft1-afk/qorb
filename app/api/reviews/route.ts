import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { reviews, businesses } from "@/app/db/schema";
import { getSession } from "@/lib/auth";
import { reviewSchema } from "@/lib/validations/review";

// =========================================================
// GET
// جلب التقييمات المعتمدة لنشاط معين
// =========================================================

export async function GET(
  request: NextRequest
) {
  try {
    const businessIdParam =
      request.nextUrl.searchParams.get(
        "businessId"
      );

    if (!businessIdParam) {
      return NextResponse.json(
        {
          success: false,
          message: "businessId مطلوب",
        },
        { status: 400 }
      );
    }

    const businessId =
      Number(businessIdParam);

    if (
      !Number.isInteger(businessId) ||
      businessId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "businessId غير صحيح",
        },
        { status: 400 }
      );
    }

    const rows = await db
      .select({
        id: reviews.id,
        businessId: reviews.businessId,
        userId: reviews.userId,
        rating: reviews.rating,
        comment: reviews.comment,
        status: reviews.status,
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt,
      })
      .from(reviews)
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
      .orderBy(reviews.createdAt);

    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error(
      "Reviews GET Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "حدث خطأ أثناء جلب التقييمات",
      },
      { status: 500 }
    );
  }
}

// =========================================================
// POST
// إضافة تقييم جديد
//
// التقييم يتم اعتماده ونشره مباشرة.
// لا توجد مراجعة يدوية من الإدارة.
// =========================================================

export async function POST(
  request: Request
) {
  try {
    // -----------------------------------------------------
    // التحقق من تسجيل الدخول
    // -----------------------------------------------------

    const user = await getSession();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "يجب تسجيل الدخول أولًا لإضافة تقييم",
        },
        { status: 401 }
      );
    }

    // -----------------------------------------------------
    // قراءة البيانات
    // -----------------------------------------------------

    const body =
      await request.json();

    const parsed =
      reviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            "بيانات التقييم غير صحيحة",
          errors:
            parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const {
      businessId,
      rating,
      comment,
    } = parsed.data;

    // -----------------------------------------------------
    // التأكد أن النشاط موجود ومعتمد
    // -----------------------------------------------------

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

    // -----------------------------------------------------
    // منع المستخدم من تقييم نفس النشاط أكثر من مرة
    // -----------------------------------------------------

    const existing =
      await db
        .select({
          id: reviews.id,
        })
        .from(reviews)
        .where(
          and(
            eq(
              reviews.businessId,
              businessId
            ),
            eq(
              reviews.userId,
              user.id
            )
          )
        )
        .limit(1);

    if (existing[0]) {
      return NextResponse.json(
        {
          success: false,
          message:
            "لقد قمت بتقييم هذا النشاط من قبل",
        },
        { status: 409 }
      );
    }

    // -----------------------------------------------------
    // إضافة التقييم
    //
    // مهم:
    // Approved مباشرة بدون Pending
    // -----------------------------------------------------

    const inserted =
      await db
        .insert(reviews)
        .values({
          businessId,
          userId: user.id,
          rating,
          comment:
            comment?.trim() || null,

          // نشر مباشر
          status: "Approved",
        })
        .returning({
          id: reviews.id,
          businessId:
            reviews.businessId,
          userId:
            reviews.userId,
          rating:
            reviews.rating,
          comment:
            reviews.comment,
          status:
            reviews.status,
          createdAt:
            reviews.createdAt,
        });

    return NextResponse.json(
      {
        success: true,
        message:
          "تم نشر تقييمك بنجاح",
        data: inserted[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Reviews POST Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "حدث خطأ أثناء إضافة التقييم",
      },
      { status: 500 }
    );
  }
}