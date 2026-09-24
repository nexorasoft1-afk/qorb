import { NextResponse } from "next/server";
import { and, eq, ilike } from "drizzle-orm";

import { db } from "@/lib/db";

import {
  areaSuggestions,
  areas,
  cities,
} from "@/app/db/schema";

import { getSession } from "@/lib/auth";

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    // =====================================================
    // Auth
    // =====================================================

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
          error: "ليس لديك صلاحية تنفيذ العملية",
        },
        { status: 403 }
      );
    }

    // =====================================================
    // Params
    // =====================================================

    const { id } = await context.params;

    const suggestionId = Number(id);

    if (
      !Number.isInteger(suggestionId) ||
      suggestionId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "رقم الاقتراح غير صحيح",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // Body
    // =====================================================

    const body = await request.json();

    const action = body?.action;

    if (
      action !== "approve" &&
      action !== "reject"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "العملية غير صحيحة",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // Get suggestion
    // =====================================================

    const suggestion = await db
      .select({
        id: areaSuggestions.id,
        userId: areaSuggestions.userId,
        cityId: areaSuggestions.cityId,
        name: areaSuggestions.name,
        notes: areaSuggestions.notes,
        status: areaSuggestions.status,
      })
      .from(areaSuggestions)
      .where(
        eq(
          areaSuggestions.id,
          suggestionId
        )
      )
      .limit(1);

    if (suggestion.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "اقتراح المنطقة غير موجود",
        },
        { status: 404 }
      );
    }

    const currentSuggestion = suggestion[0];

    // =====================================================
    // Only pending can be reviewed
    // =====================================================

    if (
      currentSuggestion.status !== "Pending"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "هذا الاقتراح تمت مراجعته من قبل",
        },
        { status: 409 }
      );
    }

    // =====================================================
    // REJECT
    // =====================================================

    if (action === "reject") {
      const reason =
        typeof body?.reason === "string"
          ? body.reason.trim()
          : "";

      let notes =
        currentSuggestion.notes || "";

      if (reason) {
        notes =
          notes.trim() +
          (notes.trim() ? "\n\n" : "") +
          `سبب الرفض: ${reason}`;
      }

      await db
        .update(areaSuggestions)
        .set({
          status: "Rejected",
          notes: notes || null,
          reviewedAt: new Date(),
          reviewedBy: user.id,
        })
        .where(
          eq(
            areaSuggestions.id,
            suggestionId
          )
        );

      return NextResponse.json({
        success: true,
        message: "تم رفض اقتراح المنطقة",
      });
    }

    // =====================================================
    // APPROVE
    // =====================================================

    const cleanName =
      currentSuggestion.name.trim();

    if (!cleanName) {
      return NextResponse.json(
        {
          success: false,
          error: "اسم المنطقة غير صالح",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // Verify city
    // =====================================================

    const city = await db
      .select({
        id: cities.id,
        name: cities.name,
      })
      .from(cities)
      .where(
        eq(
          cities.id,
          currentSuggestion.cityId
        )
      )
      .limit(1);

    if (city.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "المدينة المرتبطة بالاقتراح غير موجودة",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // Transaction
    // =====================================================

    const result = await db.transaction(
      async (tx) => {
        // -----------------------------------------------
        // Prevent duplicate area
        // -----------------------------------------------

        const existingArea = await tx
          .select({
            id: areas.id,
            name: areas.name,
          })
          .from(areas)
          .where(
            and(
              eq(
                areas.cityId,
                currentSuggestion.cityId
              ),
              ilike(
                areas.name,
                cleanName
              )
            )
          )
          .limit(1);

        if (existingArea.length > 0) {
          // المنطقة موجودة بالفعل
          // نعتمد الاقتراح فقط

          await tx
            .update(areaSuggestions)
            .set({
              status: "Approved",
              reviewedAt: new Date(),
              reviewedBy: user.id,
            })
            .where(
              eq(
                areaSuggestions.id,
                suggestionId
              )
            );

          return {
            alreadyExists: true,
            areaId: existingArea[0].id,
            areaName:
              existingArea[0].name,
          };
        }

        // -----------------------------------------------
        // Insert new area
        // -----------------------------------------------

        const insertedArea = await tx
          .insert(areas)
          .values({
            cityId:
              currentSuggestion.cityId,

            name: cleanName,

            isActive: true,
          })
          .returning({
            id: areas.id,
            name: areas.name,
          });

        if (
          insertedArea.length === 0
        ) {
          throw new Error(
            "تعذر إضافة المنطقة"
          );
        }

        // -----------------------------------------------
        // Mark suggestion approved
        // -----------------------------------------------

        await tx
          .update(areaSuggestions)
          .set({
            status: "Approved",
            reviewedAt: new Date(),
            reviewedBy: user.id,
          })
          .where(
            eq(
              areaSuggestions.id,
              suggestionId
            )
          );

        return {
          alreadyExists: false,
          areaId: insertedArea[0].id,
          areaName:
            insertedArea[0].name,
        };
      }
    );

    // =====================================================
    // Response
    // =====================================================

    if (result.alreadyExists) {
      return NextResponse.json({
        success: true,
        message:
          "تم اعتماد الاقتراح، والمنطقة موجودة بالفعل.",
        areaId: result.areaId,
        areaName: result.areaName,
      });
    }

    return NextResponse.json({
      success: true,
      message:
        "تم اعتماد المنطقة وإضافتها بنجاح.",
      areaId: result.areaId,
      areaName: result.areaName,
    });
  } catch (error) {
    console.error(
      "Admin area suggestion PATCH error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "حدث خطأ أثناء مراجعة اقتراح المنطقة",
      },
      { status: 500 }
    );
  }
}