import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  governorates,
  cities,
  areas,
} from "@/app/db/schema";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const governorateId = searchParams.get(
      "governorateId"
    );

    const cityId = searchParams.get("cityId");

    if (cityId) {
      const parsedCityId = Number(cityId);

      if (!Number.isInteger(parsedCityId)) {
        return NextResponse.json(
          {
            success: false,
            message: "معرف المدينة غير صحيح",
          },
          { status: 400 }
        );
      }

      const rows = await db
        .select({
          id: areas.id,
          cityId: areas.cityId,
          name: areas.name,
          isActive: areas.isActive,
        })
        .from(areas)
        .where(
          and(
            eq(areas.cityId, parsedCityId),
            eq(areas.isActive, true)
          )
        )
        .orderBy(areas.name);

      return NextResponse.json({
        success: true,
        type: "areas",
        data: rows,
      });
    }

    if (governorateId) {
      const parsedGovernorateId =
        Number(governorateId);

      if (!Number.isInteger(parsedGovernorateId)) {
        return NextResponse.json(
          {
            success: false,
            message: "معرف المحافظة غير صحيح",
          },
          { status: 400 }
        );
      }

      const rows = await db
        .select({
          id: cities.id,
          governorateId: cities.governorateId,
          name: cities.name,
          isActive: cities.isActive,
        })
        .from(cities)
        .where(
          and(
            eq(
              cities.governorateId,
              parsedGovernorateId
            ),
            eq(cities.isActive, true)
          )
        )
        .orderBy(cities.name);

      return NextResponse.json({
        success: true,
        type: "cities",
        data: rows,
      });
    }

    const rows = await db
      .select({
        id: cities.id,
        governorateId: cities.governorateId,
        governorateName: governorates.name,
        name: cities.name,
        isActive: cities.isActive,
      })
      .from(cities)
      .innerJoin(
        governorates,
        eq(
          governorates.id,
          cities.governorateId
        )
      )
      .where(eq(cities.isActive, true))
      .orderBy(cities.name);

    return NextResponse.json({
      success: true,
      type: "cities",
      data: rows,
    });
  } catch (error) {
    console.error("Cities API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "حدث خطأ أثناء جلب المدن",
      },
      { status: 500 }
    );
  }
}