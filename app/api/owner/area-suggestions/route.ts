import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

import {
  areaSuggestions,
  cities,
} from "@/app/db/schema";

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

    const body = await request.json();

    const cityId = Number(body.cityId);

    const name =
      typeof body.name === "string"
        ? body.name.trim().replace(/\s+/g, " ")
        : "";

    const notes =
      typeof body.notes === "string"
        ? body.notes.trim()
        : null;

    if (
      !Number.isInteger(cityId) ||
      cityId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "المدينة غير صحيحة",
        },
        { status: 400 }
      );
    }

    if (name.length < 2) {
      return NextResponse.json(
        {
          success: false,
          message: "اسم المنطقة مطلوب",
        },
        { status: 400 }
      );
    }

    if (name.length > 150) {
      return NextResponse.json(
        {
          success: false,
          message: "اسم المنطقة طويل جدًا",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // التأكد من المدينة
    // =====================================================

    const city = await db
      .select({
        id: cities.id,
        name: cities.name,
      })
      .from(cities)
      .where(
        and(
          eq(cities.id, cityId),
          eq(cities.isActive, true)
        )
      )
      .limit(1);

    if (city.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "المدينة غير موجودة أو غير نشطة",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // منع تكرار الطلب المعلق
    // =====================================================

    const existingRequest =
      await db
        .select({
          id: areaSuggestions.id,
        })
        .from(areaSuggestions)
        .where(
          and(
            eq(
              areaSuggestions.userId,
              user.id
            ),
            eq(
              areaSuggestions.cityId,
              cityId
            ),
            eq(
              areaSuggestions.name,
              name
            ),
            eq(
              areaSuggestions.status,
              "Pending"
            )
          )
        )
        .limit(1);

    if (existingRequest.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "أرسلت بالفعل اقتراحًا بهذه المنطقة وينتظر المراجعة",
        },
        { status: 409 }
      );
    }

    // =====================================================
    // إنشاء الاقتراح
    // =====================================================

    const [created] = await db
      .insert(areaSuggestions)
      .values({
        userId: user.id,
        cityId,
        name,
        notes,
        status: "Pending",
      })
      .returning({
        id: areaSuggestions.id,
        name: areaSuggestions.name,
        status: areaSuggestions.status,
        createdAt:
          areaSuggestions.createdAt,
      });

    return NextResponse.json(
      {
        success: true,
        message:
          "تم إرسال اقتراح المنطقة للمراجعة",
        data: created,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST /api/owner/area-suggestions:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "حدث خطأ أثناء إرسال اقتراح المنطقة",
      },
      { status: 500 }
    );
  }
}