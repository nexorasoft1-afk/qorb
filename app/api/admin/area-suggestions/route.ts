import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  areaSuggestions,
  cities,
  users,
} from "@/app/db/schema";

import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "غير مصرح",
        },
        { status: 401 }
      );
    }

    if (user.role !== "Admin") {
      return NextResponse.json(
        {
          success: false,
          error: "ليس لديك صلاحية الوصول",
        },
        { status: 403 }
      );
    }

    const suggestions = await db
      .select({
        id: areaSuggestions.id,

        userId: areaSuggestions.userId,
        userName: users.fullName,
        userEmail: users.email,
        userPhone: users.phone,

        cityId: areaSuggestions.cityId,
        cityName: cities.name,

        name: areaSuggestions.name,
        notes: areaSuggestions.notes,

        status: areaSuggestions.status,

        createdAt: areaSuggestions.createdAt,
        reviewedAt: areaSuggestions.reviewedAt,
        reviewedBy: areaSuggestions.reviewedBy,
      })
      .from(areaSuggestions)
      .leftJoin(
        users,
        eq(
          areaSuggestions.userId,
          users.id
        )
      )
      .leftJoin(
        cities,
        eq(
          areaSuggestions.cityId,
          cities.id
        )
      )
      .orderBy(
        desc(areaSuggestions.createdAt)
      );

    return NextResponse.json(
      {
        success: true,
        suggestions,
        data: suggestions,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Admin area suggestions GET error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "حدث خطأ أثناء تحميل اقتراحات المناطق",
        suggestions: [],
        data: [],
      },
      { status: 500 }
    );
  }
}