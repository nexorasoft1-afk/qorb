"use client";

import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  Heart,
  LoaderCircle,
  MapPin,
  MessageCircle,
  Phone,
  Star,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

interface BusinessDetails {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  priceRange: string | null;
  categoryName: string;
  subCategoryName: string | null;
  governorateName: string;
  cityName: string;
  latitude: string | null;
  longitude: string | null;
  isVerified: boolean;

  images: {
    id: number;
    imageUrl: string;
    isCover: boolean;
    sortOrder: number;
  }[];

  services: {
    id: number;
    name: string;
    description: string | null;
    price: string | null;
    durationMinutes: number | null;
  }[];

  hours: {
    id: number;
    dayOfWeek: number;
    openTime: string | null;
    closeTime: string | null;
    isClosed: boolean;
  }[];

  reviews: {
    id: number;
    rating: number;
    comment: string | null;
    createdAt: string;
    userName: string;
  }[];

  rating: number;
  reviewsCount: number;
}

const days = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

export default function BusinessDetailsPage() {
  const params = useParams();

  const id = String(
    Array.isArray(params.id)
      ? params.id[0]
      : params.id
  );

  const [business, setBusiness] =
    useState<BusinessDetails | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [favorite, setFavorite] =
    useState(false);

  const [
    favoriteLoading,
    setFavoriteLoading,
  ] = useState(false);

  // =========================================================
  // Gallery
  // =========================================================

  const [
    activeImageIndex,
    setActiveImageIndex,
  ] = useState(0);

  const [
    lightboxOpen,
    setLightboxOpen,
  ] = useState(false);

  // =========================================================
  // Review
  // =========================================================

  const [
    selectedRating,
    setSelectedRating,
  ] = useState(0);

  const [
    reviewComment,
    setReviewComment,
  ] = useState("");

  const [
    reviewSubmitting,
    setReviewSubmitting,
  ] = useState(false);

  const [
    reviewMessage,
    setReviewMessage,
  ] = useState("");

  const [
    reviewError,
    setReviewError,
  ] = useState("");

  const [
    reviewSubmitted,
    setReviewSubmitted,
  ] = useState(false);

  // =========================================================
  // تحميل النشاط
  // =========================================================

  async function loadBusiness() {
    try {
      const response = await fetch(
        `/api/businesses/${id}`,
        {
          cache: "no-store",
        }
      );

      const result =
        await response.json();

      if (result.success) {
        setBusiness(result.data);
      }
    } catch (error) {
      console.error(
        "Business details:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBusiness();
  }, [id]);

  // =========================================================
  // المفضلة
  // =========================================================

  async function toggleFavorite() {
    if (favoriteLoading) {
      return;
    }

    setFavoriteLoading(true);

    try {
      if (favorite) {
        const response = await fetch(
          `/api/favorites?businessId=${id}`,
          {
            method: "DELETE",
          }
        );

        const result =
          await response.json();

        if (result.success) {
          setFavorite(false);
        }
      } else {
        const response = await fetch(
          "/api/favorites",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              businessId: Number(id),
            }),
          }
        );

        const result =
          await response.json();

        if (result.success) {
          setFavorite(true);
        }
      }
    } catch (error) {
      console.error(
        "Favorite:",
        error
      );
    } finally {
      setFavoriteLoading(false);
    }
  }

  // =========================================================
  // Analytics
  // =========================================================

  function logEvent(
    eventType:
      | "View"
      | "PhoneClick"
      | "WhatsAppClick"
      | "DirectionsClick"
      | "WebsiteClick"
  ) {
    fetch("/api/events", {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        businessId: Number(id),
        eventType,
      }),
    }).catch(() => {});
  }

  useEffect(() => {
    if (!id) {
      return;
    }

    logEvent("View");

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // =========================================================
  // Gallery
  // =========================================================

  const galleryImages = useMemo(() => {
    if (!business?.images?.length) {
      return [];
    }

    return [...business.images].sort(
      (a, b) => {
        if (
          a.isCover !==
          b.isCover
        ) {
          return a.isCover ? -1 : 1;
        }

        return (
          Number(a.sortOrder) -
          Number(b.sortOrder)
        );
      }
    );
  }, [business?.images]);

  const activeImage =
    galleryImages[activeImageIndex] ??
    galleryImages[0] ??
    null;

  useEffect(() => {
    setActiveImageIndex(0);
  }, [id]);

  function previousImage() {
    if (galleryImages.length <= 1) {
      return;
    }

    setActiveImageIndex(
      (current) =>
        current === 0
          ? galleryImages.length - 1
          : current - 1
    );
  }

  function nextImage() {
    if (galleryImages.length <= 1) {
      return;
    }

    setActiveImageIndex(
      (current) =>
        current ===
        galleryImages.length - 1
          ? 0
          : current + 1
    );
  }

  // =========================================================
  // Lightbox Keyboard
  // =========================================================

  useEffect(() => {
    if (!lightboxOpen) {
      return;
    }

    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (event.key === "Escape") {
        setLightboxOpen(false);
      }

      if (event.key === "ArrowRight") {
        previousImage();
      }

      if (event.key === "ArrowLeft") {
        nextImage();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    lightboxOpen,
    galleryImages.length,
  ]);

  // =========================================================
  // إضافة التقييم
  // =========================================================

  async function submitReview() {
    setReviewError("");
    setReviewMessage("");

    if (!selectedRating) {
      setReviewError(
        "من فضلك اختر عدد النجوم أولًا"
      );
      return;
    }

    if (reviewSubmitting) {
      return;
    }

    setReviewSubmitting(true);

    try {
      const response = await fetch(
        "/api/reviews",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            businessId: Number(id),
            rating: selectedRating,
            comment:
              reviewComment.trim() ||
              null,
          }),
        }
      );

      const result =
        await response.json();

      // -----------------------------------------------------
      // غير مسجل
      // -----------------------------------------------------

      if (response.status === 401) {
        setReviewError(
          "يجب تسجيل الدخول أولًا حتى تتمكن من إضافة تقييم."
        );

        return;
      }

      // -----------------------------------------------------
      // سبق له التقييم
      // -----------------------------------------------------

      if (response.status === 409) {
        setReviewError(
          "لقد قمت بتقييم هذا النشاط من قبل."
        );

        setReviewSubmitted(true);

        return;
      }

      // -----------------------------------------------------
      // خطأ
      // -----------------------------------------------------

      if (!response.ok || !result.success) {
        setReviewError(
          result.message ||
            "حدث خطأ أثناء إرسال التقييم."
        );

        return;
      }

      // -----------------------------------------------------
      // نجاح
      // -----------------------------------------------------

      setReviewMessage(
        "تم نشر تقييمك بنجاح ❤️"
      );

      setReviewSubmitted(true);

      setReviewComment("");

      // -----------------------------------------------------
      // إعادة تحميل بيانات النشاط
      // لتحديث المتوسط والتقييمات
      // -----------------------------------------------------

      try {
        const businessResponse =
          await fetch(
            `/api/businesses/${id}`,
            {
              cache: "no-store",
            }
          );

        const businessResult =
          await businessResponse.json();

        if (businessResult.success) {
          setBusiness(
            businessResult.data
          );
        }
      } catch (error) {
        console.error(
          "Refresh business after review:",
          error
        );
      }
    } catch (error) {
      console.error(
        "Submit review:",
        error
      );

      setReviewError(
        "تعذر إرسال التقييم حاليًا، حاول مرة أخرى."
      );
    } finally {
      setReviewSubmitting(false);
    }
  }

  // =========================================================
  // Loading
  // =========================================================

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          بنحمّل بيانات النشاط...
        </div>
      </div>
    );
  }

  // =========================================================
  // Not Found
  // =========================================================

  if (!business) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-black text-slate-900">
            النشاط غير موجود
          </h1>

          <Link
            href="/businesses"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white"
          >
            <ArrowRight className="h-4 w-4" />
            العودة للأماكن
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* العودة */}

        <Link
          href="/businesses"
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900"
        >
          <ArrowRight className="h-4 w-4" />
          العودة للأماكن
        </Link>

        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          {/* =====================================================
              GALLERY
          ====================================================== */}

          <div className="bg-slate-100">
            {/* الصورة الرئيسية */}

            <div className="relative h-64 overflow-hidden bg-slate-100 sm:h-80 lg:h-[28rem]">
              {activeImage?.imageUrl ? (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxOpen(true)
                    }
                    className="group absolute inset-0 z-10 block h-full w-full cursor-zoom-in"
                    aria-label="تكبير الصورة"
                  >
                    <img
                      src={
                        activeImage.imageUrl
                      }
                      alt={`${business.name} - صورة ${
                        activeImageIndex + 1
                      }`}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                    />
                  </button>

                  {/* التدرج */}

                  <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-5 sm:p-8">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-slate-800">
                        {
                          business.categoryName
                        }
                      </span>

                      {business.isVerified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-600 px-3 py-1.5 text-xs font-bold text-white">
                          <BadgeCheck className="h-4 w-4" />
                          موثق
                        </span>
                      )}
                    </div>

                    <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">
                      {business.name}
                    </h1>
                  </div>

                  {/* عداد */}

                  {galleryImages.length >
                    1 && (
                    <div className="pointer-events-none absolute left-4 top-4 z-30 rounded-full bg-black/60 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
                      {activeImageIndex +
                        1}{" "}
                      /{" "}
                      {
                        galleryImages.length
                      }
                    </div>
                  )}

                  {/* السابق */}

                  {galleryImages.length >
                    1 && (
                    <button
                      type="button"
                      onClick={
                        previousImage
                      }
                      className="absolute right-4 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70"
                      aria-label="الصورة السابقة"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  )}

                  {/* التالي */}

                  {galleryImages.length >
                    1 && (
                    <button
                      type="button"
                      onClick={nextImage}
                      className="absolute left-4 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70"
                      aria-label="الصورة التالية"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                  )}
                </>
              ) : (
                <>
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-sky-50 to-slate-100 text-7xl font-black text-sky-200">
                    قُرب
                  </div>

                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-5 sm:p-8">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-slate-800">
                        {
                          business.categoryName
                        }
                      </span>

                      {business.isVerified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-600 px-3 py-1.5 text-xs font-bold text-white">
                          <BadgeCheck className="h-4 w-4" />
                          موثق
                        </span>
                      )}
                    </div>

                    <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">
                      {business.name}
                    </h1>
                  </div>
                </>
              )}
            </div>

            {/* الصور المصغرة */}

            {galleryImages.length > 1 && (
              <div className="border-t border-slate-200 bg-white p-3 sm:p-4">
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {galleryImages.map(
                    (
                      image,
                      index
                    ) => (
                      <button
                        key={
                          image.id
                        }
                        type="button"
                        onClick={() =>
                          setActiveImageIndex(
                            index
                          )
                        }
                        className={`relative h-20 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition sm:h-24 sm:w-32 ${
                          index ===
                          activeImageIndex
                            ? "border-sky-600 ring-2 ring-sky-100"
                            : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                        aria-label={`عرض الصورة ${
                          index + 1
                        }`}
                      >
                        <img
                          src={
                            image.imageUrl
                          }
                          alt={`${business.name} - صورة ${
                            index + 1
                          }`}
                          className="h-full w-full object-cover"
                        />

                        {image.isCover && (
                          <span className="absolute bottom-1 right-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white">
                            الغلاف
                          </span>
                        )}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          {/* =====================================================
              CONTENT
          ====================================================== */}

          <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[1fr_320px]">
            <div>
              {/* التقييم العام */}

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm font-black text-amber-700">
                  <Star className="h-5 w-5 fill-current" />

                  {business.rating.toFixed(
                    1
                  )}
                </div>

                <span className="text-sm text-slate-500">
                  {business.reviewsCount}{" "}
                  تقييم
                </span>
              </div>

              {/* الوصف */}

              {business.description && (
                <p className="mt-6 text-sm leading-8 text-slate-600">
                  {
                    business.description
                  }
                </p>
              )}

              {/* =================================================
                  BUTTONS
              ================================================== */}

              <div className="mt-7 flex flex-wrap gap-2">
                {business.phone && (
                  <a
                    href={`tel:${business.phone}`}
                    onClick={() =>
                      logEvent(
                        "PhoneClick"
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white"
                  >
                    <Phone className="h-4 w-4" />
                    اتصال
                  </a>
                )}

                {business.whatsapp && (
                  <a
                    href={`https://wa.me/${business.whatsapp.replace(
                      /\D/g,
                      ""
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() =>
                      logEvent(
                        "WhatsAppClick"
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white"
                  >
                    <MessageCircle className="h-4 w-4" />
                    واتساب
                  </a>
                )}

                {business.latitude &&
                  business.longitude && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() =>
                        logEvent(
                          "DirectionsClick"
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-bold text-white"
                    >
                      <MapPin className="h-4 w-4" />
                      الاتجاهات
                    </a>
                  )}

                {business.website && (
                  <a
                    href={
                      business.website
                    }
                    target="_blank"
                    rel="noreferrer"
                    onClick={() =>
                      logEvent(
                        "WebsiteClick"
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                    الموقع
                  </a>
                )}

                <button
                  type="button"
                  onClick={
                    toggleFavorite
                  }
                  disabled={
                    favoriteLoading
                  }
                  className={`inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-bold transition ${
                    favorite
                      ? "border-rose-200 bg-rose-50 text-rose-600"
                      : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  <Heart
                    className={`h-4 w-4 ${
                      favorite
                        ? "fill-current"
                        : ""
                    }`}
                  />

                  {favorite
                    ? "في المفضلة"
                    : "المفضلة"}
                </button>
              </div>

              {/* =================================================
                  الخدمات
              ================================================== */}

              <section className="mt-10">
                <h2 className="text-xl font-black text-slate-900">
                  الخدمات
                </h2>

                {business.services
                  .length ? (
                  <div className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-200">
                    {business.services.map(
                      (service) => (
                        <div
                          key={
                            service.id
                          }
                          className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <h3 className="font-bold text-slate-800">
                              {
                                service.name
                              }
                            </h3>

                            {service.description && (
                              <p className="mt-1 text-sm text-slate-500">
                                {
                                  service.description
                                }
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-sm">
                            {service.price && (
                              <span className="font-black text-sky-700">
                                {
                                  service.price
                                }{" "}
                                ج.م
                              </span>
                            )}

                            {service.durationMinutes && (
                              <span className="text-slate-400">
                                {
                                  service.durationMinutes
                                }{" "}
                                دقيقة
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                    لا توجد خدمات مضافة
                    حاليًا.
                  </div>
                )}
              </section>

              {/* =================================================
                  تقييم النشاط
              ================================================== */}

              <section className="mt-10">
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-sky-50 via-white to-amber-50 p-5 sm:p-7">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                          <Star className="h-6 w-6 fill-current" />
                        </div>

                        <div>
                          <h2 className="text-xl font-black text-slate-900">
                            قيّم هذا النشاط
                          </h2>

                          <p className="mt-1 text-sm text-slate-500">
                            رأيك يساعد الناس
                            تعرف تجربتك مع المكان
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white px-4 py-3 text-center shadow-sm ring-1 ring-slate-100">
                      <div className="text-2xl font-black text-slate-900">
                        {business.rating.toFixed(
                          1
                        )}
                      </div>

                      <div className="mt-1 flex justify-center gap-0.5 text-amber-500">
                        {[1, 2, 3, 4, 5].map(
                          (star) => (
                            <Star
                              key={star}
                              className={`h-3.5 w-3.5 ${
                                star <=
                                Math.round(
                                  business.rating
                                )
                                  ? "fill-current"
                                  : ""
                              }`}
                            />
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  {!reviewSubmitted ? (
                    <div className="mt-6">
                      {/* النجوم */}

                      <div>
                        <label className="mb-3 block text-sm font-bold text-slate-700">
                          اختر تقييمك
                        </label>

                        <div
                          className="flex items-center gap-2"
                          dir="ltr"
                        >
                          {[1, 2, 3, 4, 5].map(
                            (star) => (
                              <button
                                key={
                                  star
                                }
                                type="button"
                                onClick={() =>
                                  setSelectedRating(
                                    star
                                  )
                                }
                                className="rounded-lg p-1 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-amber-300"
                                aria-label={`تقييم ${star} من 5`}
                              >
                                <Star
                                  className={`h-9 w-9 transition ${
                                    star <=
                                    selectedRating
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-slate-300 hover:text-amber-300"
                                  }`}
                                />
                              </button>
                            )
                          )}
                        </div>

                        {selectedRating >
                          0 && (
                          <p className="mt-2 text-xs font-bold text-amber-600">
                            {selectedRating ===
                              1 &&
                              "سيئ جدًا"}
                            {selectedRating ===
                              2 &&
                              "يحتاج لتحسين"}
                            {selectedRating ===
                              3 &&
                              "جيد"}
                            {selectedRating ===
                              4 &&
                              "جيد جدًا"}
                            {selectedRating ===
                              5 &&
                              "ممتاز"}
                          </p>
                        )}
                      </div>

                      {/* التعليق */}

                      <div className="mt-5">
                        <label
                          htmlFor="review-comment"
                          className="mb-2 block text-sm font-bold text-slate-700"
                        >
                          تعليقك
                          <span className="mr-1 font-normal text-slate-400">
                            (اختياري)
                          </span>
                        </label>

                        <textarea
                          id="review-comment"
                          value={
                            reviewComment
                          }
                          onChange={(
                            event
                          ) =>
                            setReviewComment(
                              event
                                .target
                                .value
                            )
                          }
                          maxLength={1000}
                          rows={4}
                          placeholder="احكيلنا تجربتك مع المكان..."
                          className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-50"
                        />

                        <div className="mt-1 text-left text-[11px] text-slate-400">
                          {
                            reviewComment.length
                          }{" "}
                          / 1000
                        </div>
                      </div>

                      {/* Error */}

                      {reviewError && (
                        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">
                          {reviewError}
                        </div>
                      )}

                      {/* Success */}

                      {reviewMessage && (
                        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                          {reviewMessage}
                        </div>
                      )}

                      {/* إرسال */}

                      <button
                        type="button"
                        onClick={
                          submitReview
                        }
                        disabled={
                          reviewSubmitting ||
                          selectedRating ===
                            0
                        }
                        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                      >
                        {reviewSubmitting ? (
                          <>
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                            جاري نشر التقييم...
                          </>
                        ) : (
                          <>
                            <Star className="h-4 w-4 fill-current" />
                            نشر التقييم
                          </>
                        )}
                      </button>

                      <p className="mt-3 text-xs leading-6 text-slate-400">
                        يجب تسجيل الدخول لإضافة
                        تقييم. يمكنك تقييم هذا النشاط
                        مرة واحدة فقط.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                          <BadgeCheck className="h-5 w-5" />
                        </div>

                        <div>
                          <h3 className="font-black text-emerald-800">
                            تم تسجيل تقييمك
                          </h3>

                          <p className="mt-1 text-sm leading-6 text-emerald-700">
                            شكرًا لمشاركتنا
                            تجربتك مع المكان ❤️
                          </p>

                          {reviewMessage && (
                            <p className="mt-2 text-xs font-bold text-emerald-600">
                              {reviewMessage}
                            </p>
                          )}

                          {reviewError && (
                            <p className="mt-2 text-xs font-bold text-rose-600">
                              {reviewError}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* =================================================
                  التقييمات الموجودة
              ================================================== */}

              <section className="mt-10">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-black text-slate-900">
                    آراء الزوار
                  </h2>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                    {business.reviewsCount}{" "}
                    تقييم
                  </span>
                </div>

                {business.reviews
                  .length ? (
                  <div className="mt-4 space-y-3">
                    {business.reviews.map(
                      (review) => (
                        <div
                          key={
                            review.id
                          }
                          className="rounded-2xl border border-slate-200 bg-white p-5"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="font-bold text-slate-800">
                              {
                                review.userName
                              }
                            </div>

                            <div
                              className="flex items-center gap-1"
                              dir="ltr"
                            >
                              {[1, 2, 3, 4, 5].map(
                                (
                                  star
                                ) => (
                                  <Star
                                    key={
                                      star
                                    }
                                    className={`h-4 w-4 ${
                                      star <=
                                      review.rating
                                        ? "fill-amber-400 text-amber-400"
                                        : "text-slate-200"
                                    }`}
                                  />
                                )
                              )}
                            </div>
                          </div>

                          {review.comment && (
                            <p className="mt-3 text-sm leading-7 text-slate-600">
                              {
                                review.comment
                              }
                            </p>
                          )}
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                    لا توجد تقييمات حتى الآن.
                    <br />
                    كن أول من يشارك تجربته ⭐
                  </div>
                )}
              </section>
            </div>

            {/* ===================================================
                SIDEBAR
            ==================================================== */}

            <aside className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="font-black text-slate-900">
                  معلومات المكان
                </h3>

                <div className="mt-5 space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" />

                    <div className="text-slate-600">
                      {business.address && (
                        <div>
                          {
                            business.address
                          }
                        </div>
                      )}

                      <div>
                        {
                          business.cityName
                        }
                        ،{" "}
                        {
                          business.governorateName
                        }
                      </div>
                    </div>
                  </div>

                  {business.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 shrink-0 text-sky-600" />

                      <span dir="ltr">
                        {
                          business.phone
                        }
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Clock3 className="h-5 w-5 shrink-0 text-sky-600" />

                    <span className="text-slate-600">
                      مواعيد العمل
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="font-black text-slate-900">
                  أوقات العمل
                </h3>

                <div className="mt-4 space-y-2">
                  {business.hours.map(
                    (hour) => (
                      <div
                        key={hour.id}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="font-semibold text-slate-600">
                          {
                            days[
                              hour.dayOfWeek
                            ]
                          }
                        </span>

                        <span
                          className={
                            hour.isClosed
                              ? "font-bold text-rose-500"
                              : "text-slate-500"
                          }
                        >
                          {hour.isClosed
                            ? "مغلق"
                            : `${hour.openTime ?? ""} - ${hour.closeTime ?? ""}`}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* =========================================================
          LIGHTBOX
      ========================================================== */}

      {lightboxOpen &&
        activeImage?.imageUrl && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
            onClick={() =>
              setLightboxOpen(false)
            }
          >
            {/* إغلاق */}

            <button
              type="button"
              onClick={() =>
                setLightboxOpen(false)
              }
              className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              aria-label="إغلاق"
            >
              <X className="h-6 w-6" />
            </button>

            {/* الصورة */}

            <div
              className="relative flex h-full w-full items-center justify-center"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <img
                src={
                  activeImage.imageUrl
                }
                alt={`${business.name} - صورة ${
                  activeImageIndex + 1
                }`}
                className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain"
              />

              {/* السابق */}

              {galleryImages.length >
                1 && (
                <button
                  type="button"
                  onClick={
                    previousImage
                  }
                  className="absolute right-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20 sm:right-6"
                  aria-label="الصورة السابقة"
                >
                  <ChevronRight className="h-7 w-7" />
                </button>
              )}

              {/* التالي */}

              {galleryImages.length >
                1 && (
                <button
                  type="button"
                  onClick={nextImage}
                  className="absolute left-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20 sm:left-6"
                  aria-label="الصورة التالية"
                >
                  <ChevronLeft className="h-7 w-7" />
                </button>
              )}

              {/* العداد */}

              {galleryImages.length >
                1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-2 text-xs font-bold text-white backdrop-blur">
                  {activeImageIndex +
                    1}{" "}
                  /{" "}
                  {
                    galleryImages.length
                  }
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
}