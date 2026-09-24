import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  businesses,
  businessEvents,
} from "@/app/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EVENT_TYPES = new Set([
  "View",
  "PhoneClick",
  "WhatsAppClick",
  "DirectionsClick",
  "WebsiteClick",
]);

function parseId(value: string): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function sessionUserId(session: any): number | null {
  const raw =
    session?.user?.id ??
    session?.user?.userId ??
    session?.id ??
    session?.userId ??
    session?.UserID ??
    session?.user?.UserID;

  const n = Number(raw);

  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
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
        status: businesses.status,
      })
      .from(businesses)
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
        { success: false, error: "النشاط غير متاح" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    const eventType = body?.eventType;

    if (
      typeof eventType !== "string" ||
      !EVENT_TYPES.has(eventType)
    ) {
      return NextResponse.json(
        { success: false, error: "نوع الحدث غير صالح" },
        { status: 400 }
      );
    }

    let userId: number | null = null;

    try {
      const session = await getSession();
      userId = sessionUserId(session);
    } catch {
      userId = null;
    }

    await db.insert(businessEvents).values({
      businessId,
      userId,
      eventType: eventType as
        | "View"
        | "PhoneClick"
        | "WhatsAppClick"
        | "DirectionsClick"
        | "WebsiteClick",
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("POST business event error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "تعذر تسجيل الحدث",
      },
      { status: 500 }
    );
  }
}
