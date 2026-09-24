"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Globe,
  Images,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  Tag,
  Wrench,
} from "lucide-react";

interface Props {
  businessId: number | string;
}

interface ImageItem {
  id: number;
  url: string;
  isCover: boolean;
  fileName?: string | null;
  sortOrder: number;
}

interface ServiceItem {
  id: number;
  name: string;
  description: string | null;
  price: string | number | null;
  durationMinutes: number | null;
}

interface HourItem {
  id?: number | null;
  dayOfWeek: number;
  dayName?: string;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
}

interface OfferItem {
  id: number;
  title: string;
  description: string | null;
  discountType: "Percentage" | "Fixed";
  discountValue: string | number;
  startDate: string;
  endDate: string;
}

interface EventItem {
  id: number;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
}

interface BusinessPayload {
  id: number;
  name: string;
  address: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  priceRange: string | null;
  isVerified: boolean;
}

function priceLabel(value: string | number | null) {
  if (value === null || value === undefined || value === "") {
    return "السعر عند الطلب";
  }

  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);

  return `${new Intl.NumberFormat("ar-EG", {
    maximumFractionDigits: 2,
  }).format(n)} جنيه`;
}

function durationLabel(value: number | null) {
  if (!value) return null;
  if (value < 60) return `${value} دقيقة`;

  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  if (minutes === 0) {
    return hours === 1 ? "ساعة" : `${hours} ساعات`;
  }

  return `${hours} ساعة و${minutes} دقيقة`;
}

function dateLabel(value: string) {
  try {
    return new Intl.DateTimeFormat("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "");
}

export default function BusinessPublicSections({
  businessId,
}: Props) {
  const [business, setBusiness] =
    useState<BusinessPayload | null>(null);
  const [images, setImages] =
    useState<ImageItem[]>([]);
  const [services, setServices] =
    useState<ServiceItem[]>([]);
  const [hours, setHours] =
    useState<HourItem[]>([]);
  const [offers, setOffers] =
    useState<OfferItem[]>([]);
  const [events, setEvents] =
    useState<EventItem[]>([]);
  const [loading, setLoading] =
    useState(true);

  const trackedView =
    useRef(false);

  const track = useCallback(
    async (
      eventType:
        | "View"
        | "PhoneClick"
        | "WhatsAppClick"
        | "DirectionsClick"
        | "WebsiteClick"
    ) => {
      try {
        await fetch(
          `/api/businesses/${businessId}/event`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              eventType,
            }),
            keepalive: true,
          }
        );
      } catch {
        // التحليلات لا يجب أن تمنع استخدام الصفحة.
      }
    },
    [businessId]
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      try {
        const res = await fetch(
          `/api/businesses/${businessId}/profile`,
          { cache: "no-store" }
        );

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(
            data.error ||
              "تعذر تحميل بيانات النشاط"
          );
        }

        if (cancelled) return;

        setBusiness(data.business || null);
        setImages(
          Array.isArray(data.images)
            ? data.images
            : []
        );
        setServices(
          Array.isArray(data.services)
            ? data.services
            : []
        );
        setHours(
          Array.isArray(data.hours)
            ? data.hours
            : []
        );
        setOffers(
          Array.isArray(data.offers)
            ? data.offers
            : []
        );
        setEvents(
          Array.isArray(data.events)
            ? data.events
            : []
        );

        if (!trackedView.current) {
          trackedView.current = true;
          void track("View");
        }
      } catch {
        if (!cancelled) {
          setBusiness(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [businessId, track]);

  const handlePhone = () => {
    if (!business?.phone) return;
    void track("PhoneClick");
  };

  const handleWhatsApp = () => {
    if (!business?.whatsapp) return;
    void track("WhatsAppClick");
  };

  const handleDirections = () => {
    if (
      business?.latitude === null ||
      business?.latitude === undefined ||
      business?.longitude === null ||
      business?.longitude === undefined
    ) {
      return;
    }

    void track("DirectionsClick");
  };

  const handleWebsite = () => {
    if (!business?.website) return;
    void track("WebsiteClick");
  };

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white py-20">
          <Loader2 className="h-9 w-9 animate-spin text-sky-600" />
        </div>
      </section>
    );
  }

  if (!business) {
    return null;
  }

  const cover =
    images.find((image) => image.isCover) ||
    images[0] ||
    null;

  return (
    <div
      dir="rtl"
      className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8"
    >
      {/* Gallery */}

      {images.length > 0 && (
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                <Images className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  صور النشاط
                </h2>
                <p className="text-sm text-slate-500">
                  {images.length} صورة
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="overflow-hidden rounded-2xl bg-slate-100 sm:col-span-2 sm:row-span-2">
              {cover && (
                <img
                  src={cover.url}
                  alt={business.name}
                  className="h-full min-h-[320px] w-full object-cover"
                />
              )}
            </div>

            {images
              .filter(
                (image) =>
                  image.id !== cover?.id
              )
              .slice(0, 6)
              .map((image) => (
                <div
                  key={image.id}
                  className="aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100"
                >
                  <img
                    src={image.url}
                    alt={
                      image.fileName ||
                      business.name
                    }
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Services */}

      {services.length > 0 && (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                الخدمات
              </h2>
              <p className="text-sm text-slate-500">
                الخدمات المتاحة لدى النشاط
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {services.map((service) => (
              <article
                key={service.id}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      {service.name}
                    </h3>

                    {service.description && (
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        {service.description}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 rounded-xl bg-white px-3 py-2 text-sm font-black text-violet-700 shadow-sm">
                    {priceLabel(service.price)}
                  </div>
                </div>

                {durationLabel(
                  service.durationMinutes
                ) && (
                  <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-600">
                    <Clock3 className="h-4 w-4" />
                    {durationLabel(
                      service.durationMinutes
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Offers */}

      {offers.length > 0 && (
        <section className="rounded-3xl border border-amber-200 bg-gradient-to-l from-amber-50 via-white to-orange-50 p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                العروض الحالية
              </h2>
              <p className="text-sm text-slate-500">
                عروض سارية حاليًا
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {offers.map((offer) => (
              <article
                key={offer.id}
                className="rounded-2xl border border-amber-100 bg-white p-5"
              >
                <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
                  {offer.discountType ===
                  "Percentage"
                    ? `${offer.discountValue}% خصم`
                    : `${offer.discountValue} جنيه خصم`}
                </span>

                <h3 className="mt-4 text-lg font-black text-slate-900">
                  {offer.title}
                </h3>

                {offer.description && (
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    {offer.description}
                  </p>
                )}

                <p className="mt-4 text-xs font-bold text-slate-500">
                  حتى{" "}
                  {dateLabel(offer.endDate)}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Events */}

      {events.length > 0 && (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                الفعاليات القادمة
              </h2>
              <p className="text-sm text-slate-500">
                المواعيد والمناسبات المعلنة من النشاط
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {events.map((event) => (
              <article
                key={event.id}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5"
              >
                <h3 className="text-lg font-black text-slate-900">
                  {event.title}
                </h3>

                {event.description && (
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    {event.description}
                  </p>
                )}

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl bg-white p-3">
                    <p className="text-[11px] font-bold text-slate-400">
                      البداية
                    </p>
                    <p className="mt-1 text-xs font-black text-slate-800">
                      {dateLabel(event.startAt)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-3">
                    <p className="text-[11px] font-bold text-slate-400">
                      النهاية
                    </p>
                    <p className="mt-1 text-xs font-black text-slate-800">
                      {dateLabel(event.endAt)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Hours + Contact */}

      <section className="grid gap-6 lg:grid-cols-2">
        {hours.length > 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Clock3 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  مواعيد العمل
                </h2>
                <p className="text-sm text-slate-500">
                  أوقات الفتح والإغلاق
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {hours.map((day) => (
                <div
                  key={day.dayOfWeek}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
                >
                  <span className="text-sm font-bold text-slate-700">
                    {day.dayName ||
                      [
                        "الأحد",
                        "الاثنين",
                        "الثلاثاء",
                        "الأربعاء",
                        "الخميس",
                        "الجمعة",
                        "السبت",
                      ][day.dayOfWeek]}
                  </span>

                  {day.isClosed ? (
                    <span className="text-xs font-black text-rose-600">
                      مغلق
                    </span>
                  ) : (
                    <span className="text-xs font-black text-emerald-700">
                      {day.openTime} —{" "}
                      {day.closeTime}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-black text-slate-900">
              تواصل وزيارة النشاط
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              اختر الطريقة المناسبة للتواصل أو الوصول إلى المكان.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {business.phone && (
              <a
                href={`tel:${normalizePhone(
                  business.phone
                )}`}
                onClick={handlePhone}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white"
              >
                <Phone className="h-4 w-4" />
                اتصال
              </a>
            )}

            {business.whatsapp && (
              <a
                href={`https://wa.me/${normalizePhone(
                  business.whatsapp
                ).replace(/^0/, "20")}`}
                target="_blank"
                rel="noreferrer"
                onClick={handleWhatsApp}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700"
              >
                <MessageCircle className="h-4 w-4" />
                واتساب
              </a>
            )}

            {business.latitude !== null &&
              business.longitude !== null && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={handleDirections}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-bold text-sky-700"
                >
                  <MapPin className="h-4 w-4" />
                  الاتجاهات
                </a>
              )}

            {business.website && (
              <a
                href={
                  business.website.startsWith(
                    "http"
                  )
                    ? business.website
                    : `https://${business.website}`
                }
                target="_blank"
                rel="noreferrer"
                onClick={handleWebsite}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-bold text-violet-700"
              >
                <Globe className="h-4 w-4" />
                الموقع الإلكتروني
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>

          {business.address && (
            <div className="mt-4 flex gap-3 rounded-2xl bg-slate-50 p-4">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
              <div>
                <p className="text-xs font-bold text-slate-400">
                  العنوان
                </p>
                <p className="mt-1 text-sm font-bold leading-7 text-slate-700">
                  {business.address}
                </p>
              </div>
            </div>
          )}

          {business.isVerified && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              نشاط موثق
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
