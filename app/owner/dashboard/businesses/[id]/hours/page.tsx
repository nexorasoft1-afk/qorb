"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  Check,
  ExternalLink,
  Loader2,
  RefreshCw,
  Save,
  X,
} from "lucide-react";

interface HourRow {
  id: number | null;
  businessId: number;
  dayOfWeek: number;
  dayName: string;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
}

const NAV_ITEMS = [
  ["البيانات الأساسية", ""],
  ["الخدمات", "services"],
  ["الصور", "images"],
  ["مواعيد العمل", "hours"],
  ["العروض", "offers"],
  ["الفعاليات", "events"],
  ["التحليلات", "analytics"],
];

export default function HoursPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [businessName, setBusinessName] = useState("");
  const [hours, setHours] = useState<HourRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch(
        `/api/owner/businesses/${id}/hours`,
        { cache: "no-store" }
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "تعذر تحميل مواعيد العمل");
      }

      setBusinessName(data.business?.name || "");
      setHours(Array.isArray(data.hours) ? data.hours : []);
    } catch (error) {
      setToast({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء تحميل مواعيد العمل",
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const update = (
    dayOfWeek: number,
    field: keyof HourRow,
    value: string | boolean
  ) => {
    setHours((current) =>
      current.map((day) =>
        day.dayOfWeek === dayOfWeek
          ? { ...day, [field]: value }
          : day
      )
    );
  };

  const save = async () => {
    setSaving(true);

    try {
      const res = await fetch(
        `/api/owner/businesses/${id}/hours`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hours }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "تعذر حفظ المواعيد");
      }

      setHours(data.hours || []);
      setToast({
        type: "success",
        message: "تم حفظ مواعيد العمل بنجاح",
      });
    } catch (error) {
      setToast({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء الحفظ",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-50"
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-sky-600" />
          <p className="text-sm font-bold text-slate-600">
            جاري تحميل مواعيد العمل...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/owner/dashboard"
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200"
            >
              <ArrowRight className="h-5 w-5" />
            </Link>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900">
                  مواعيد العمل
                </h1>
                {businessName && (
                  <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                    {businessName}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                حدد أوقات فتح وإغلاق النشاط لكل يوم.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => load()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold"
            >
              <RefreshCw className="h-4 w-4" />
              تحديث
            </button>

            <Link
              href={`/businesses/${id}`}
              target="_blank"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold"
            >
              <ExternalLink className="h-4 w-4" />
              الصفحة العامة
            </Link>

            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "جاري الحفظ..." : "حفظ المواعيد"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <nav className="flex min-w-max gap-1">
            {NAV_ITEMS.map(([label, suffix]) => (
              <Link
                key={label}
                href={
                  suffix
                    ? `/owner/dashboard/businesses/${id}/${suffix}`
                    : `/owner/dashboard/businesses/${id}`
                }
                className={`rounded-xl px-4 py-2.5 text-sm font-bold ${
                  suffix === "hours"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="space-y-4">
          {hours.map((day) => (
            <div
              key={day.dayOfWeek}
              className={`rounded-3xl border bg-white p-5 shadow-sm ${
                day.isClosed
                  ? "border-slate-200"
                  : "border-emerald-200"
              }`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                    <CalendarClock className="h-6 w-6 text-slate-700" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">
                      {day.dayName}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {day.isClosed
                        ? "النشاط مغلق في هذا اليوم"
                        : "النشاط مفتوح في هذا اليوم"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    update(
                      day.dayOfWeek,
                      "isClosed",
                      !day.isClosed
                    )
                  }
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${
                    day.isClosed
                      ? "border border-slate-200 bg-slate-50 text-slate-600"
                      : "border border-emerald-200 bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {day.isClosed ? (
                    <X className="h-4 w-4" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  {day.isClosed ? "مغلق" : "مفتوح"}
                </button>
              </div>

              {!day.isClosed && (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      يفتح الساعة
                    </span>
                    <input
                      type="time"
                      value={day.openTime || ""}
                      onChange={(e) =>
                        update(
                          day.dayOfWeek,
                          "openTime",
                          e.target.value
                        )
                      }
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-50"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      يغلق الساعة
                    </span>
                    <input
                      type="time"
                      value={day.closeTime || ""}
                      onChange={(e) =>
                        update(
                          day.dayOfWeek,
                          "closeTime",
                          e.target.value
                        )
                      }
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-50"
                    />
                  </label>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                toast.type === "success"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-rose-50 text-rose-600"
              }`}
            >
              {toast.type === "success" ? (
                <Check className="h-5 w-5" />
              ) : (
                <X className="h-5 w-5" />
              )}
            </div>
            <p className="flex-1 text-sm font-bold text-slate-800">
              {toast.message}
            </p>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
