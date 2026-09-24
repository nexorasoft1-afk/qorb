import { NextRequest, NextResponse } from "next/server";
import { and, asc, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  businesses,
  businessImages,
} from "@/app/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// =========================================================
// Constants
// =========================================================

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8 MB

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

// =========================================================
// Helpers
// =========================================================

function getSessionUserId(
  session: any
): number | null {
  const rawId =
    session?.user?.id ??
    session?.user?.userId ??
    session?.id ??
    session?.userId ??
    session?.UserID ??
    session?.user?.UserID;

  const id = Number(rawId);

  return Number.isInteger(id) && id > 0
    ? id
    : null;
}

function getSessionRole(
  session: any
): string | null {
  return (
    session?.user?.role ??
    session?.user?.Role ??
    session?.role ??
    session?.Role ??
    null
  );
}

function parsePositiveInteger(
  value: string
): number | null {
  const parsed = Number(value);

  return Number.isInteger(parsed) &&
    parsed > 0
    ? parsed
    : null;
}

function cleanFileName(
  fileName: string
): string {
  const normalized =
    fileName
      .replace(/[\/\\]/g, "_")
      .replace(/[^\w\u0600-\u06FF.\- ()]/g, "_")
      .trim();

  return (
    normalized.slice(0, 180) ||
    `image-${Date.now()}`
  );
}

// =========================================================
// Authorization
// =========================================================

async function authorizeBusiness(
  businessId: number
) {
  const session = await getSession();

  if (!session) {
    return {
      error: "يجب تسجيل الدخول أولًا",
      status: 401,
    };
  }

  const userId =
    getSessionUserId(session);

  const role =
    getSessionRole(session);

  if (!userId) {
    return {
      error: "جلسة المستخدم غير صالحة",
      status: 401,
    };
  }

  if (
    role !== "BusinessOwner" &&
    role !== "Admin"
  ) {
    return {
      error:
        "ليس لديك صلاحية إدارة صور هذا النشاط",
      status: 403,
    };
  }

  const [business] = await db
    .select({
      id: businesses.id,
      ownerId: businesses.ownerId,
      name: businesses.name,
      status: businesses.status,
    })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!business) {
    return {
      error: "النشاط التجاري غير موجود",
      status: 404,
    };
  }

  if (
    role !== "Admin" &&
    Number(business.ownerId) !== userId
  ) {
    return {
      error:
        "ليس لديك صلاحية إدارة صور هذا النشاط",
      status: 403,
    };
  }

  return {
    session,
    userId,
    role,
    business,
  };
}

// =========================================================
// GET
// =========================================================

export async function GET(
  _request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;

    const businessId =
      parsePositiveInteger(id);

    if (!businessId) {
      return NextResponse.json(
        {
          success: false,
          error: "معرف النشاط غير صالح",
        },
        { status: 400 }
      );
    }

    const access =
      await authorizeBusiness(businessId);

    if ("error" in access) {
      return NextResponse.json(
        {
          success: false,
          error: access.error,
        },
        { status: access.status }
      );
    }

    const images = await db
      .select({
        id: businessImages.id,
        businessId:
          businessImages.businessId,
        imageUrl:
          businessImages.imageUrl,
        mimeType:
          businessImages.mimeType,
        fileName:
          businessImages.fileName,
        fileSize:
          businessImages.fileSize,
        isCover:
          businessImages.isCover,
        sortOrder:
          businessImages.sortOrder,
        createdAt:
          businessImages.createdAt,
      })
      .from(businessImages)
      .where(
        eq(
          businessImages.businessId,
          businessId
        )
      )
      .orderBy(
        desc(businessImages.isCover),
        asc(businessImages.sortOrder),
        asc(businessImages.id)
      );

    const mappedImages = images.map(
      (image) => ({
        ...image,
        url:
          image.imageUrl ||
          `/api/business-images/${image.id}`,
      })
    );

    return NextResponse.json({
      success: true,
      business: access.business,
      images: mappedImages,
      data: mappedImages,
    });
  } catch (error) {
    console.error(
      "GET /api/owner/businesses/[id]/images error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "حدث خطأ أثناء جلب صور النشاط",
      },
      { status: 500 }
    );
  }
}

// =========================================================
// POST
// =========================================================

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;

    const businessId =
      parsePositiveInteger(id);

    if (!businessId) {
      return NextResponse.json(
        {
          success: false,
          error: "معرف النشاط غير صالح",
        },
        { status: 400 }
      );
    }

    const access =
      await authorizeBusiness(businessId);

    if ("error" in access) {
      return NextResponse.json(
        {
          success: false,
          error: access.error,
        },
        { status: access.status }
      );
    }

    const formData =
      await request.formData();

    const fileEntry =
      formData.get("file");

    if (!(fileEntry instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "يرجى اختيار صورة لرفعها",
        },
        { status: 400 }
      );
    }

    if (!fileEntry.size) {
      return NextResponse.json(
        {
          success: false,
          error: "الصورة فارغة",
        },
        { status: 400 }
      );
    }

    if (fileEntry.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error:
            "حجم الصورة يجب ألا يزيد عن 8 ميجابايت",
        },
        { status: 400 }
      );
    }

    if (
      !ALLOWED_MIME_TYPES.has(
        fileEntry.type
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "نوع الصورة غير مدعوم. المسموح: JPG و PNG و WEBP و GIF",
        },
        { status: 400 }
      );
    }

    const requestedCoverRaw =
      formData.get("isCover");

    const requestedSortRaw =
      formData.get("sortOrder");

    const isCover =
      requestedCoverRaw === "true" ||
      requestedCoverRaw === "1";

    let sortOrder = 0;

    if (
      requestedSortRaw !== null &&
      requestedSortRaw !== ""
    ) {
      const parsedSort = Number(
        requestedSortRaw
      );

      if (
        !Number.isInteger(parsedSort) ||
        parsedSort < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "ترتيب الصورة غير صالح",
          },
          { status: 400 }
        );
      }

      sortOrder = parsedSort;
    } else {
      const [lastImage] =
        await db
          .select({
            sortOrder:
              businessImages.sortOrder,
          })
          .from(businessImages)
          .where(
            eq(
              businessImages.businessId,
              businessId
            )
          )
          .orderBy(
            desc(
              businessImages.sortOrder
            ),
            desc(businessImages.id)
          )
          .limit(1);

      sortOrder =
        Number(
          lastImage?.sortOrder ?? -1
        ) + 1;
    }

    const buffer = Buffer.from(
      await fileEntry.arrayBuffer()
    );

    const fileName =
      cleanFileName(
        fileEntry.name
      );

    const createdImage =
      await db.transaction(
        async (tx) => {
          const [existingCount] =
            await tx
              .select({
                id: businessImages.id,
              })
              .from(businessImages)
              .where(
                eq(
                  businessImages.businessId,
                  businessId
                )
              )
              .limit(1);

          const shouldBeCover =
            isCover ||
            !existingCount;

          if (shouldBeCover) {
            await tx
              .update(businessImages)
              .set({
                isCover: false,
              })
              .where(
                eq(
                  businessImages.businessId,
                  businessId
                )
              );
          }

          const [inserted] =
            await tx
              .insert(businessImages)
              .values({
                businessId,
                imageUrl: null,
                imageData: buffer,
                mimeType:
                  fileEntry.type,
                fileName,
                fileSize:
                  fileEntry.size,
                isCover:
                  shouldBeCover,
                sortOrder,
              })
              .returning({
                id: businessImages.id,
                businessId:
                  businessImages.businessId,
                imageUrl:
                  businessImages.imageUrl,
                mimeType:
                  businessImages.mimeType,
                fileName:
                  businessImages.fileName,
                fileSize:
                  businessImages.fileSize,
                isCover:
                  businessImages.isCover,
                sortOrder:
                  businessImages.sortOrder,
                createdAt:
                  businessImages.createdAt,
              });

          return inserted;
        }
      );

    if (!createdImage) {
      return NextResponse.json(
        {
          success: false,
          error:
            "تعذر حفظ الصورة",
        },
        { status: 500 }
      );
    }

    const result = {
      ...createdImage,
      url: `/api/business-images/${createdImage.id}`,
    };

    return NextResponse.json(
      {
        success: true,
        message:
          "تم رفع الصورة وحفظها داخل قاعدة البيانات بنجاح",
        image: result,
        data: result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST /api/owner/businesses/[id]/images error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "حدث خطأ أثناء رفع الصورة",
      },
      { status: 500 }
    );
  }
}
