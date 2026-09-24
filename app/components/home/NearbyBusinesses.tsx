"use client";

import {
  LocateFixed,
  LoaderCircle,
  MapPinOff,
} from "lucide-react";

import { useEffect, useState } from "react";

import BusinessCard, {
  type BusinessCardData,
} from "@/app/components/business/BusinessCard";

interface NearbyApiBusiness
  extends Record<string, any> {
  id: number;
}

interface PublicImage {
  id: number;
  url: string;
  isCover: boolean;
  sortOrder: number;
  fileName?: string | null;
}

interface PublicProfileResponse {
  success?: boolean;
  error?: string;
  business?: Record<string, any> | null;
  images?: PublicImage[];
}

// =========================================================
// Helpers
// =========================================================

async function enrichBusinessesWithCoverImages(
  businesses: NearbyApiBusiness[]
): Promise<BusinessCardData[]> {
  return Promise.all(
    businesses.map(async (business) => {
      let coverUrl: string | null = null;
      let coverImage: PublicImage | null = null;

      try {
        const response = await fetch(
          `/api/businesses/${business.id}/profile`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (response.ok) {
          const data: PublicProfileResponse =
            await response.json();

          const images = Array.isArray(data.images)
            ? data.images
            : [];

          coverImage =
            images.find(
              (image) => image.isCover
            ) ||
            images
              .slice()
              .sort(
                (a, b) =>
                  Number(a.sortOrder) -
                    Number(b.sortOrder) ||
                  Number(a.id) -
                    Number(b.id)
              )[0] ||
            null;

          coverUrl =
            coverImage?.url || null;

          console.log(
            "[Nearby] Selected cover image:",
            {
              businessId: business.id,
              coverImage,
              coverUrl,
            }
          );
        }
      } catch (error) {
        console.error(
          `[Nearby] Failed to load cover image for business ${business.id}:`,
          error
        );
      }

      // =====================================================
      // Normalize fields for BusinessCard
      // =====================================================

      const name =
        business.name ??
        business.businessName ??
        business.title ??
        `نشاط ${business.id}`;

      const slug =
        business.slug ??
        business.businessSlug ??
        String(business.id);

      const finalCoverImage =
        coverUrl ||
        business.cover_image ||
        business.coverImageUrl ||
        business.imageUrl ||
        business.image ||
        null;

      const finalImageUrl =
        coverUrl ||
        business.imageUrl ||
        business.coverImageUrl ||
        business.image ||
        null;

      const finalCoverImageUrl =
        coverUrl ||
        business.coverImageUrl ||
        business.imageUrl ||
        business.image ||
        null;

      const finalImage =
        coverUrl ||
        business.image ||
        business.imageUrl ||
        business.coverImageUrl ||
        null;

      return {
        ...business,

        id: business.id,

        name,
        slug,

        // ===================================================
        // الصورة الأساسية التي يستخدمها BusinessCard
        // ===================================================

        cover_image: finalCoverImage,

        // ===================================================
        // الحقول القديمة - نحتفظ بها للتوافق
        // ===================================================

        imageUrl: finalImageUrl,

        coverImageUrl: finalCoverImageUrl,

        image: finalImage,

        images: coverImage
          ? [
              {
                id: coverImage.id,
                url: coverImage.url,
                isCover: true,
                sortOrder:
                  coverImage.sortOrder ?? 0,
                fileName:
                  coverImage.fileName ?? null,
              },
            ]
          : [],
      } as unknown as BusinessCardData;
    })
  );
}

// =========================================================
// Component
// =========================================================

export default function NearbyBusinesses() {
  const [businesses, setBusinesses] =
    useState<BusinessCardData[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [locationDenied, setLocationDenied] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationDenied(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLocationDenied(false);
    setErrorMessage("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat =
            position.coords.latitude;

          const lng =
            position.coords.longitude;

          const params =
            new URLSearchParams({
              lat: String(lat),
              lng: String(lng),
              radius: "10000",
              limit: "6",
            });

          const url =
            `/api/businesses/nearby?${params.toString()}`;

          console.log(
            "[Nearby] Request:",
            {
              lat,
              lng,
              radius: 10000,
              limit: 6,
              url,
            }
          );

          const response = await fetch(url, {
            method: "GET",
            cache: "no-store",
          });

          // ============================================
          // اقرأ الرد مهما كانت حالته
          // ============================================

          const responseText =
            await response.text();

          let result: any = null;

          try {
            result = responseText
              ? JSON.parse(responseText)
              : null;
          } catch {
            console.error(
              "[Nearby] Invalid JSON response:",
              responseText
            );
          }

          console.log(
            "[Nearby] Response:",
            {
              status: response.status,
              statusText:
                response.statusText,
              data: result,
              raw: responseText,
            }
          );

          // ============================================
          // API Error
          // ============================================

          if (!response.ok) {
            const apiError =
              result?.error ||
              result?.message ||
              responseText ||
              `HTTP ${response.status}`;

            throw new Error(
              `Nearby API ${response.status}: ${apiError}`
            );
          }

          // ============================================
          // Validate response
          // ============================================

          if (!result) {
            throw new Error(
              "الـ API أعادت استجابة فارغة"
            );
          }

          if (
            result.success === false
          ) {
            throw new Error(
              result.error ||
                result.message ||
                "فشل تحميل الأماكن القريبة"
            );
          }

          if (
            !Array.isArray(result.data)
          ) {
            setBusinesses([]);
            return;
          }

          const nearbyBusinesses =
            result.data as NearbyApiBusiness[];

          // ============================================
          // إزالة التكرار
          // ============================================

          const uniqueBusinesses =
            nearbyBusinesses.filter(
              (business, index, self) =>
                index ===
                self.findIndex(
                  (item) =>
                    item.id ===
                    business.id
                )
            );

          // ============================================
          // جلب صورة الغلاف الحقيقية
          // ============================================

          const enrichedBusinesses =
            await enrichBusinessesWithCoverImages(
              uniqueBusinesses
            );

          // ============================================
          // تأكد من الصورة النهائية
          // ============================================

          console.log(
            "[Nearby] FINAL IMAGE DATA:",
            enrichedBusinesses.map(
              (business) => ({
                id: business.id,
                name: business.name,
                cover_image:
                  business.cover_image,
                imageUrl:
                  (business as any)
                    .imageUrl,
                coverImageUrl:
                  (business as any)
                    .coverImageUrl,
                image:
                  (business as any)
                    .image,
              })
            )
          );

          setBusinesses(
            enrichedBusinesses
          );
        } catch (error) {
          console.error(
            "[Nearby businesses] Error:",
            error
          );

          setBusinesses([]);

          setErrorMessage(
            error instanceof Error
              ? error.message
              : "حدث خطأ أثناء تحميل الأماكن القريبة"
          );
        } finally {
          setLoading(false);
        }
      },

      (error) => {
        console.error(
          "[Nearby] Geolocation error:",
          error
        );

        setLoading(false);

        if (
          error.code ===
          error.PERMISSION_DENIED
        ) {
          setLocationDenied(true);
          return;
        }

        if (
          error.code ===
          error.POSITION_UNAVAILABLE
        ) {
          setErrorMessage(
            "تعذر تحديد موقعك الحالي."
          );
          return;
        }

        if (
          error.code ===
          error.TIMEOUT
        ) {
          setErrorMessage(
            "انتهى وقت تحديد الموقع."
          );
          return;
        }

        setErrorMessage(
          "تعذر الحصول على موقعك."
        );
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, []);

  // =====================================================
  // Loading
  // =====================================================

  if (loading) {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-3xl border border-slate-200 bg-white">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
          <LoaderCircle className="h-5 w-5 animate-spin" />

          بنحدد الأماكن القريبة منك...
        </div>
      </div>
    );
  }

  // =====================================================
  // Location denied
  // =====================================================

  if (locationDenied) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <MapPinOff className="mx-auto h-8 w-8 text-slate-400" />

        <h3 className="mt-3 font-bold text-slate-800">
          فعّل الموقع علشان نعرض الأماكن القريبة
        </h3>

        <p className="mt-2 text-sm text-slate-500">
          أو استخدم البحث يدويًا في الوقت الحالي.
        </p>
      </div>
    );
  }

  // =====================================================
  // API Error
  // =====================================================

  if (errorMessage) {
    return (
      <div className="rounded-3xl border border-red-200 bg-white p-8 text-center">
        <MapPinOff className="mx-auto h-8 w-8 text-red-500" />

        <h3 className="mt-3 font-bold text-slate-800">
          تعذر تحميل الأماكن القريبة
        </h3>

        <p className="mt-2 wrap-break-word text-sm text-red-600">
          {errorMessage}
        </p>

        <p className="mt-3 text-xs text-slate-400">
          تفاصيل الخطأ موجودة في Console بالمتصفح.
        </p>
      </div>
    );
  }

  // =====================================================
  // Empty
  // =====================================================

  if (!businesses.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <LocateFixed className="mx-auto h-8 w-8 text-sky-500" />

        <h3 className="mt-3 font-bold text-slate-800">
          لسه مفيش أماكن قريبة مسجلة
        </h3>

        <p className="mt-2 text-sm text-slate-500">
          لما نضيف الأنشطة، هتظهر هنا تلقائيًا حسب موقعك.
        </p>
      </div>
    );
  }

  // =====================================================
  // Businesses
  // =====================================================

  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {businesses.map(
        (business, index) => (
          <BusinessCard
            key={`${business.id}-${index}`}
            business={business}
          />
        )
      )}
    </div>
  );
}