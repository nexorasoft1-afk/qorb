import { NextRequest, NextResponse } from "next/server";

import { eq } from "drizzle-orm";

import { db } from "@/lib/db";

import { businessImages } from "@/app/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parsePositiveInteger(
  value: string
): number | null {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0
    ? parsed
    : null;
}

export async function GET(
  _request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;

    const imageId = parsePositiveInteger(id);

    if (!imageId) {
      return new NextResponse("معرف الصورة غير صالح", {
        status: 400,
      });
    }

    const [image] = await db
      .select({
        id: businessImages.id,
        imageData: businessImages.imageData,
        imageUrl: businessImages.imageUrl,
        mimeType: businessImages.mimeType,
      })
      .from(businessImages)
      .where(eq(businessImages.id, imageId))
      .limit(1);

    if (!image) {
      return new NextResponse("الصورة غير موجودة", {
        status: 404,
      });
    }

    // =====================================================
    // الصور القديمة التي لديها URL خارجي
    // =====================================================

    if (!image.imageData && image.imageUrl) {
      return NextResponse.redirect(
        new URL(
          image.imageUrl,
          _request.url
        )
      );
    }

    // =====================================================
    // الصورة محفوظة داخل قاعدة البيانات
    // =====================================================

    if (!image.imageData) {
      return new NextResponse("بيانات الصورة غير موجودة", {
        status: 404,
      });
    }

    const mimeType =
      image.mimeType || "application/octet-stream";

    return new NextResponse(
      image.imageData as BodyInit,
      {
        status: 200,
        headers: {
          "Content-Type": mimeType,
          "Content-Length": String(
            image.imageData.length
          ),
          "Cache-Control":
            "public, max-age=86400, stale-while-revalidate=604800",
        },
      }
    );
  } catch (error) {
    console.error(
      "GET /api/business-images/[id] error:",
      error
    );

    return new NextResponse(
      "حدث خطأ أثناء تحميل الصورة",
      {
        status: 500,
      }
    );
  }
}

