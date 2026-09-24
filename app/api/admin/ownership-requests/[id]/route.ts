import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { createSlug } from "@/lib/utils";
import { pointFromCoordinates } from "@/lib/geo";

import {
  businessOwnershipRequests,
  businesses,
  users,
} from "@/app/db/schema";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type ActionInput = {
  action?: "approve" | "reject";
  reason?: string;
};

async function generateUniqueSlug(
  name: string,
  requestId: number
) {
  const baseSlug =
    createSlug(name) || `business-${requestId}`;

  let slug = baseSlug;
  let counter = 2;

  while (true) {
    const existing = await db
      .select({
        id: businesses.id,
      })
      .from(businesses)
      .where(eq(businesses.slug, slug))
      .limit(1);

    if (existing.length === 0) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const admin = await requireRole(["Admin"]);

    const { id } = await context.params;
    const requestId = Number(id);

    if (!Number.isInteger(requestId) || requestId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "رقم الطلب غير صحيح",
        },
        { status: 400 }
      );
    }

    const body =
      (await request.json()) as ActionInput;

    if (
      body.action !== "approve" &&
      body.action !== "reject"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "الإجراء غير صحيح",
        },
        { status: 400 }
      );
    }

    const ownershipRequest =
      await db.query.businessOwnershipRequests.findFirst({
        where: eq(
          businessOwnershipRequests.id,
          requestId
        ),
      });

    if (!ownershipRequest) {
      return NextResponse.json(
        {
          success: false,
          message: "الطلب غير موجود",
        },
        { status: 404 }
      );
    }

    if (ownershipRequest.status !== "Pending") {
      return NextResponse.json(
        {
          success: false,
          message: "تمت مراجعة هذا الطلب من قبل",
        },
        { status: 409 }
      );
    }

    // =====================================================
    // REJECT
    // =====================================================

    if (body.action === "reject") {
      const reason =
        body.reason?.trim() || "تم رفض الطلب بواسطة الإدارة";

      const oldNotes =
        ownershipRequest.notes?.trim() || "";

      const newNotes = oldNotes
        ? `${oldNotes}\nسبب الرفض: ${reason}`
        : `سبب الرفض: ${reason}`;

      await db
        .update(businessOwnershipRequests)
        .set({
          status: "Rejected",
          reviewedAt: new Date(),
          reviewedBy: admin.id,
          notes: newNotes,
        })
        .where(
          eq(businessOwnershipRequests.id, requestId)
        );

      return NextResponse.json({
        success: true,
        message: "تم رفض الطلب",
      });
    }

    // =====================================================
    // APPROVE
    // =====================================================

    const result = await db.transaction(
      async (tx) => {
        // -----------------------------------------------
        // CREATE
        // -----------------------------------------------

        if (
          ownershipRequest.requestType === "Create"
        ) {
         if (
  !ownershipRequest.name ||
  !ownershipRequest.categoryId ||
  !ownershipRequest.governorateId ||
  !ownershipRequest.cityId
          ) {
            throw new Error(
              "بيانات الطلب غير مكتملة لإنشاء النشاط"
            );
          }

          const slug =
            await generateUniqueSlug(
              ownershipRequest.name,
              ownershipRequest.id
            );

          const [createdBusiness] =
            await tx
              .insert(businesses)
              .values({
                ownerId: ownershipRequest.userId,

                name: ownershipRequest.name,
                slug,

                description:
                  ownershipRequest.description,

                categoryId:
                  ownershipRequest.categoryId,

                subCategoryId:
                  ownershipRequest.subCategoryId,

                governorateId:
                  ownershipRequest.governorateId,

                cityId:
                  ownershipRequest.cityId,

                areaId:
                  ownershipRequest.areaId,

                address:
                  ownershipRequest.address,

                latitude:
                  ownershipRequest.latitude,

                longitude:
                  ownershipRequest.longitude,

                location:
                  ownershipRequest.latitude !== null &&
                  ownershipRequest.longitude !== null
                    ? pointFromCoordinates(
                        Number(
                          ownershipRequest.latitude
                        ),
                        Number(
                          ownershipRequest.longitude
                        )
                      )
                    : null,

                phone:
                  ownershipRequest.phone,

                whatsapp:
                  ownershipRequest.whatsapp,

                website:
                  ownershipRequest.website,

                priceRange:
                  ownershipRequest.priceRange,

                status: "Approved",

                // اعتماد الطلب لا يعني بالضرورة
                // Verification منفصلة.
                isVerified: false,
              })
              .returning({
                id: businesses.id,
                name: businesses.name,
                slug: businesses.slug,
              });

          await tx
            .update(users)
            .set({
              role: "BusinessOwner",
            })
            .where(
              eq(
                users.id,
                ownershipRequest.userId
              )
            );

          await tx
            .update(businessOwnershipRequests)
            .set({
              status: "Approved",
              reviewedAt: new Date(),
              reviewedBy: admin.id,
            })
            .where(
              eq(
                businessOwnershipRequests.id,
                requestId
              )
            );

          return {
            type: "Create" as const,
            business: createdBusiness,
          };
        }

        // -----------------------------------------------
        // CLAIM
        // -----------------------------------------------

        if (
          ownershipRequest.requestType === "Claim"
        ) {
          if (!ownershipRequest.businessId) {
            throw new Error(
              "طلب Claim لا يحتوي على نشاط"
            );
          }

          const existingBusiness =
            await tx.query.businesses.findFirst({
              where: eq(
                businesses.id,
                ownershipRequest.businessId
              ),
            });

          if (!existingBusiness) {
            throw new Error(
              "النشاط المطلوب امتلاكه غير موجود"
            );
          }

          if (
            existingBusiness.ownerId !== null &&
            existingBusiness.ownerId !==
              ownershipRequest.userId
          ) {
            throw new Error(
              "هذا النشاط مرتبط بمالك آخر بالفعل"
            );
          }

          await tx
            .update(businesses)
            .set({
              ownerId:
                ownershipRequest.userId,
              updatedAt: new Date(),
            })
            .where(
              eq(
                businesses.id,
                ownershipRequest.businessId
              )
            );

          await tx
            .update(users)
            .set({
              role: "BusinessOwner",
            })
            .where(
              eq(
                users.id,
                ownershipRequest.userId
              )
            );

          await tx
            .update(businessOwnershipRequests)
            .set({
              status: "Approved",
              reviewedAt: new Date(),
              reviewedBy: admin.id,
            })
            .where(
              eq(
                businessOwnershipRequests.id,
                requestId
              )
            );

          return {
            type: "Claim" as const,
            business: {
              id: existingBusiness.id,
              name: existingBusiness.name,
              slug: existingBusiness.slug,
            },
          };
        }

        throw new Error(
          "نوع الطلب غير مدعوم"
        );
      }
    );

    return NextResponse.json({
      success: true,
      message:
        result.type === "Create"
          ? "تم اعتماد الطلب وإنشاء النشاط"
          : "تم اعتماد طلب ملكية النشاط",

      type: result.type,
      business: result.business,
    });
  } catch (error) {
    console.error(
      "PATCH /api/admin/ownership-requests/[id] error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "حدث خطأ غير متوقع";

    if (message === "UNAUTHORIZED") {
      return NextResponse.json(
        {
          success: false,
          message: "يجب تسجيل الدخول",
        },
        { status: 401 }
      );
    }

    if (message === "FORBIDDEN") {
      return NextResponse.json(
        {
          success: false,
          message: "ليس لديك صلاحية إدارية",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 400 }
    );
  }
}