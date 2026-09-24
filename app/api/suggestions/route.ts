import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  businessSuggestions,
  categories,
  cities,
  areas,
} from "@/app/db/schema";

import { getSession } from "@/lib/auth";
import {
  suggestionSchema,
} from "@/lib/validations/suggestion";

import {
  emptyToNull,
  normalizeText,
} from "@/lib/utils";

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

    const rows =
      await db
        .select({
          id:
            businessSuggestions.id,
          name:
            businessSuggestions.name,
          categoryId:
            businessSuggestions.categoryId,
          categoryName:
            categories.name,
          cityId:
            businessSuggestions.cityId,
          cityName:
            cities.name,
          areaId:
            businessSuggestions.areaId,
          areaName:
            areas.name,
          address:
            businessSuggestions.address,
          latitude:
            businessSuggestions.latitude,
          longitude:
            businessSuggestions.longitude,
          phone:
            businessSuggestions.phone,
          notes:
            businessSuggestions.notes,
          status:
            businessSuggestions.status,
          createdAt:
            businessSuggestions.createdAt,
          reviewedAt:
            businessSuggestions.reviewedAt,
        })
        .from(
          businessSuggestions
        )
        .leftJoin(
          categories,
          eq(
            categories.id,
            businessSuggestions.categoryId
          )
        )
        .leftJoin(
          cities,
          eq(
            cities.id,
            businessSuggestions.cityId
          )
        )
        .leftJoin(
          areas,
          eq(
            areas.id,
            businessSuggestions.areaId
          )
        );

    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error(
      "Suggestions GET Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "حدث خطأ أثناء جلب الاقتراحات",
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

    const parsed =
      suggestionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            "بيانات الاقتراح غير صحيحة",
          errors:
            parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const inserted =
      await db
        .insert(
          businessSuggestions
        )
        .values({
          suggestedByUserId:
            user.id,

          name:
            normalizeText(
              data.name
            ),

          categoryId:
            data.categoryId ??
            null,

          cityId:
            data.cityId ??
            null,

          areaId:
            data.areaId ??
            null,

          address:
            emptyToNull(
              data.address
            ),

          latitude:
            data.latitude !==
            undefined &&
            data.latitude !== null
              ? data.latitude.toString()
              : null,

          longitude:
            data.longitude !==
            undefined &&
            data.longitude !== null
              ? data.longitude.toString()
              : null,

          phone:
            emptyToNull(
              data.phone
            ),

          notes:
            emptyToNull(
              data.notes
            ),

          status: "Pending",
        })
        .returning({
          id:
            businessSuggestions.id,
          name:
            businessSuggestions.name,
          status:
            businessSuggestions.status,
          createdAt:
            businessSuggestions.createdAt,
        });

    return NextResponse.json(
      {
        success: true,
        message:
          "تم إرسال اقتراح النشاط للمراجعة",
        data: inserted[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Suggestions POST Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "حدث خطأ أثناء إرسال الاقتراح",
      },
      { status: 500 }
    );
  }
}