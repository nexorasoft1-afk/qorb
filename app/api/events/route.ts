import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  businessEvents,
  businesses,
} from "@/app/db/schema";
import { getSession } from "@/lib/auth";

const allowedEvents = [
  "View",
  "PhoneClick",
  "WhatsAppClick",
  "DirectionsClick",
  "WebsiteClick",
] as const;

type AllowedEvent =
  (typeof allowedEvents)[number];

export async function POST(
  request: Request
) {
  try {
    const body = await request.json();

    const businessId =
      Number(body?.businessId);

    const eventType =
      body?.eventType as AllowedEvent;

    if (
      !Number.isInteger(
        businessId
      ) ||
      businessId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "businessId غير صحيح",
        },
        { status: 400 }
      );
    }

    if (
      !allowedEvents.includes(
        eventType
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "نوع الحدث غير صحيح",
        },
        { status: 400 }
      );
    }

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

    const user =
      await getSession();

    await db
      .insert(businessEvents)
      .values({
        businessId,
        userId:
          user?.id ?? null,
        eventType,
      });

    return NextResponse.json({
      success: true,
      message:
        "تم تسجيل الحدث",
    });
  } catch (error) {
    console.error(
      "Business Events API Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "حدث خطأ أثناء تسجيل الحدث",
      },
      { status: 500 }
    );
  }
}