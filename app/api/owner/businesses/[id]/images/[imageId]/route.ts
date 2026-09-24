import { NextRequest, NextResponse } from "next/server";
import {
  and,
  asc,
  eq,
} from "drizzle-orm";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  businesses,
  businessImages,
} from "@/app/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    .where(
      eq(
        businesses.id,
        businessId
      )
    )
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
// PATCH
// =========================================================

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
      imageId: string;
    }>;
  }
) {
  try {
    const { id, imageId } =
      await context.params;

    const businessId =
      parsePositiveInteger(id);

    const imageIdNumber =
      parsePositiveInteger(imageId);

    if (!businessId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "معرف النشاط غير صالح",
        },
        { status: 400 }
      );
    }

    if (!imageIdNumber) {
      return NextResponse.json(
        {
          success: false,
          error:
            "معرف الصورة غير صالح",
        },
        { status: 400 }
      );
    }

    const access =
      await authorizeBusiness(
        businessId
      );

    if ("error" in access) {
      return NextResponse.json(
        {
          success: false,
          error: access.error,
        },
        { status: access.status }
      );
    }

    const [existingImage] =
      await db
        .select({
          id: businessImages.id,
          businessId:
            businessImages.businessId,
          isCover:
            businessImages.isCover,
          sortOrder:
            businessImages.sortOrder,
        })
        .from(businessImages)
        .where(
          and(
            eq(
              businessImages.id,
              imageIdNumber
            ),
            eq(
              businessImages.businessId,
              businessId
            )
          )
        )
        .limit(1);

    if (!existingImage) {
      return NextResponse.json(
        {
          success: false,
          error: "الصورة غير موجودة",
        },
        { status: 404 }
      );
    }

    let body: any;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error:
            "بيانات الطلب غير صالحة",
        },
        { status: 400 }
      );
    }

    const hasIsCover =
      body?.isCover !== undefined;

    const hasSortOrder =
      body?.sortOrder !== undefined;

    if (!hasIsCover && !hasSortOrder) {
      return NextResponse.json(
        {
          success: false,
          error:
            "لم يتم إرسال أي بيانات للتعديل",
        },
        { status: 400 }
      );
    }

    if (
      hasIsCover &&
      typeof body.isCover !==
        "boolean"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "قيمة الغلاف غير صالحة",
        },
        { status: 400 }
      );
    }

    let sortOrder:
      | number
      | undefined;

    if (hasSortOrder) {
      const parsedSort =
        Number(body.sortOrder);

      if (
        !Number.isInteger(
          parsedSort
        ) ||
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
    }

    const updatedImage =
      await db.transaction(
        async (tx) => {
          if (
            hasIsCover &&
            body.isCover === true
          ) {
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

          const updateData: any = {};

          if (hasIsCover) {
            updateData.isCover =
              body.isCover;
          }

          if (sortOrder !== undefined) {
            updateData.sortOrder =
              sortOrder;
          }

          const [updated] =
            await tx
              .update(
                businessImages
              )
              .set(updateData)
              .where(
                and(
                  eq(
                    businessImages.id,
                    imageIdNumber
                  ),
                  eq(
                    businessImages.businessId,
                    businessId
                  )
                )
              )
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

          return updated;
        }
      );

    if (!updatedImage) {
      return NextResponse.json(
        {
          success: false,
          error:
            "تعذر تحديث الصورة",
        },
        { status: 404 }
      );
    }

    const result = {
      ...updatedImage,
      url:
        updatedImage.imageUrl ||
        `/api/business-images/${updatedImage.id}`,
    };

    return NextResponse.json({
      success: true,
      message:
        "تم تحديث الصورة بنجاح",
      image: result,
      data: result,
    });
  } catch (error) {
    console.error(
      "PATCH image error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "حدث خطأ أثناء تحديث الصورة",
      },
      { status: 500 }
    );
  }
}

// =========================================================
// DELETE
// =========================================================

export async function DELETE(
  _request: NextRequest,
  context: {
    params: Promise<{
      id: string;
      imageId: string;
    }>;
  }
) {
  try {
    const { id, imageId } =
      await context.params;

    const businessId =
      parsePositiveInteger(id);

    const imageIdNumber =
      parsePositiveInteger(imageId);

    if (!businessId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "معرف النشاط غير صالح",
        },
        { status: 400 }
      );
    }

    if (!imageIdNumber) {
      return NextResponse.json(
        {
          success: false,
          error:
            "معرف الصورة غير صالح",
        },
        { status: 400 }
      );
    }

    const access =
      await authorizeBusiness(
        businessId
      );

    if ("error" in access) {
      return NextResponse.json(
        {
          success: false,
          error: access.error,
        },
        { status: access.status }
      );
    }

    const [deletedImage] =
      await db
        .delete(businessImages)
        .where(
          and(
            eq(
              businessImages.id,
              imageIdNumber
            ),
            eq(
              businessImages.businessId,
              businessId
            )
          )
        )
        .returning({
          id: businessImages.id,
          businessId:
            businessImages.businessId,
          isCover:
            businessImages.isCover,
          fileName:
            businessImages.fileName,
        });

    if (!deletedImage) {
      return NextResponse.json(
        {
          success: false,
          error:
            "الصورة غير موجودة",
        },
        { status: 404 }
      );
    }

    // إذا حذفنا الغلاف، نجعل أول صورة متبقية غلافًا.
    if (deletedImage.isCover) {
      const [nextImage] =
        await db
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
          .orderBy(
            asc(
              businessImages.sortOrder
            ),
            asc(businessImages.id)
          )
          .limit(1);

      if (nextImage) {
        await db
          .update(businessImages)
          .set({
            isCover: true,
          })
          .where(
            eq(
              businessImages.id,
              nextImage.id
            )
          );
      }
    }

    return NextResponse.json({
      success: true,
      message:
        "تم حذف الصورة بنجاح",
      image: deletedImage,
      data: deletedImage,
    });
  } catch (error) {
    console.error(
      "DELETE image error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "حدث خطأ أثناء حذف الصورة",
      },
      { status: 500 }
    );
  }
}

