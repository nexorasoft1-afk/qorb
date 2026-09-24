"use client";

import Link from "next/link";
import {
  ArrowRight,
  List,
  LoaderCircle,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { useEffect, useState } from "react";

import Map, {
  type MapBusiness,
} from "@/app/components/map/Map";

export default function MapPage() {
  const [businesses, setBusinesses] =
    useState<MapBusiness[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [locationMessage, setLocationMessage] =
    useState(
      "فعّل موقعك لعرض الأماكن القريبة."
    );

  useEffect(() => {
    loadNearby();
  }, []);

  function loadNearby() {
    if (!navigator.geolocation) {
      setLocationMessage(
        "المتصفح لا يدعم تحديد الموقع."
      );
      return;
    }

    setLoading(true);
    setLocationMessage(
      "جاري تحديد موقعك..."
    );

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const params =
            new URLSearchParams({
              lat:
                position.coords.latitude.toString(),
              lng:
                position.coords.longitude.toString(),
              radius: "15000",
              limit: "100",
            });

          const response =
            await fetch(
              `/api/businesses/nearby?${params.toString()}`
            );

          const result =
            await response.json();

          if (!result.success) {
            setBusinesses([]);
            setLocationMessage(
              "تعذر جلب الأماكن القريبة."
            );
            return;
          }

          setBusinesses(
            result.data ?? []
          );

          setLocationMessage(
            result.data?.length
              ? `تم العثور على ${result.data.length} مكان قريب منك.`
              : "لا توجد أماكن مسجلة قريبة منك حاليًا."
          );
        } catch (error) {
          console.error(
            "Map nearby:",
            error
          );

          setLocationMessage(
            "حدث خطأ أثناء جلب الأماكن."
          );
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLoading(false);
        setLocationMessage(
          "لم يتم السماح بالوصول إلى موقعك."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/"
            className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900"
          >
            <ArrowRight className="h-4 w-4" />
            الرئيسية
          </Link>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-bold text-sky-600">
                <MapPin className="h-4 w-4" />
                الخريطة
              </div>

              <h1 className="text-3xl font-black text-slate-900 sm:text-4xl">
                الأماكن القريبة منك
              </h1>

              <p className="mt-2 text-sm leading-7 text-slate-500">
                اكتشف الأنشطة والخدمات حولك على الخريطة.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={loadNearby}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
              >
                {loading ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                تحديث
              </button>

              <Link
                href="/businesses"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white"
              >
                <List className="h-4 w-4" />
                قائمة الأماكن
              </Link>
            </div>
          </div>
        </div>

        <div className="mb-4 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700">
          {locationMessage}
        </div>

        <Map
          businesses={businesses}
          initialCenter={[
            34.3299,
            27.9158,
          ]}
          initialZoom={8}
          className="h-[65vh] min-h-[500px]"
        />
      </div>
    </div>
  );
}