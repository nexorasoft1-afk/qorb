import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  categories,
  subCategories,
} from "@/app/db/schema";

export async function GET() {
  try {
    const rows = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        icon: categories.icon,
        image: categories.image,
        sortOrder: categories.sortOrder,
        isActive: categories.isActive,
      })
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(categories.sortOrder);

    const result = [];

    for (const category of rows) {
      const children = await db
        .select({
          id: subCategories.id,
          name: subCategories.name,
          slug: subCategories.slug,
          sortOrder: subCategories.sortOrder,
        })
        .from(subCategories)
        .where(
          eq(
            subCategories.categoryId,
            category.id
          )
        )
        .orderBy(subCategories.sortOrder);

      result.push({
        ...category,
        subCategories: children,
      });
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Categories API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "حدث خطأ أثناء جلب التصنيفات",
      },
      { status: 500 }
    );
  }
}