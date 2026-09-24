"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  ExternalLink,
  Globe,
  Loader2,
  Map,
  MousePointerClick,
  Phone,
  RefreshCw,
  Users,
  X,
} from "lucide-react";

interface DailyRow {
  day: string;
  View: number;
  PhoneClick: number;
  WhatsAppClick: number;
  DirectionsClick: number;
  WebsiteClick: number;
  total: number;
}

interface AnalyticsData {
  summary: {
    total: number;
    views: number;
    phoneClicks: number;
    whatsappClicks: number;
    directionsClicks: number;
    websiteClicks: number;
  };
  daily: DailyRow[];
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

const cards = [
  {
    key: "views",
    label: "مشاهدات الصفحة",
    icon: Users,
    tone: "sky",
  },
  {
    key: "phoneClicks",
    label: "نقرات الهاتف",
    icon: Phone,
    tone: "emerald",
  },
  {
    key: "whatsappClicks",
    label: "نقرات واتساب",
    icon: MousePointerClick,
    tone: "green",
  },
  {
    key: "directionsClicks",
    label: "طلبات الاتجاهات",
    icon: Map,
    tone: "amber",
  },
  {
    key: "websiteClicks",
    label: "نقرات الموقع",
    icon: Globe,
    tone: "violet",
  },
] as const;

function formatNumber(value: number) {
  return new Intl.NumberFormat("ar-EG").format(value);
}

function formatDay(value: string) {
  try {
    return new Intl.DateTimeFormat("ar-EG", {
      day: "numeric",
      month: "short",
    }).format(new Date(`${value}T00:00:00`));
  } catch {
    return value;
  }
}

function maxDailyValue(rows: DailyRow[]) {
  return Math.max(
    1,
    ...rows.map((row) => Number(row.total))
  );
}

export default function AnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [businessName, setBusinessName] = useState("");
  const [analytics, setAnalytics] =
    useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch(
        `/api/owner/businesses/${id}/analytics`,
        { cache: "no-store" }
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "تعذر تحميل التحليلات");
      }

      setBusinessName(data.business?.name || "");
      setAnalytics({
        summary: data.summary,
        daily: Array.isArray(data.daily) ? data.daily : [],
      });
    } catch (error) {
      setToast({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء تحميل التحليلات",
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

  const maxValue = useMemo(
    () => maxDailyValue(analytics?.daily || []),
    [analytics]
  );

  if (loading) {
    return (
      <div
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-50"
      >
        <Loader2 className="h-10 w-10 animate-spin text-sky-600" />
      </div>
    );
  }

  const summary = analytics?.summary || {
    total: 0,
    views: 0,
    phoneClicks: 0,
    whatsappClicks: 0,
    directionsClicks: 0,
    websiteClicks: 0,
  };

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
                  التحليلات
                </h1>
                {businessName && (
                  <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                    {businessName}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                قياس تفاعل العملاء مع صفحة النشاط خلال الفترة المتاحة.
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
                  suffix === "analytics"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                ملخص النشاط
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                إجمالي الأحداث المسجلة لكل تفاعل مع النشاط. البيانات اليومية تعرض آخر 30 يومًا متاحة.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-1">
            <p className="text-xs font-bold text-slate-500">
              كل الأحداث
            </p>
            <p className="mt-3 text-3xl font-black text-slate-900">
              {formatNumber(summary.total)}
            </p>
          </div>

          {cards.map((card) => {
            const Icon = card.icon;
            const value =
              summary[
                card.key as keyof typeof summary
              ];

            return (
              <div
                key={card.key}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-slate-500">
                      {card.label}
                    </p>
                    <p className="mt-3 text-3xl font-black text-slate-900">
                      {formatNumber(Number(value))}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6">
            <h2 className="text-lg font-black text-slate-900">
              النشاط اليومي
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              عدد التفاعلات المسجلة لكل يوم.
            </p>
          </div>

          {analytics?.daily.length ? (
            <div className="space-y-3">
              {analytics.daily.map((row) => {
                const percentage =
                  Math.max(
                    3,
                    (Number(row.total) / maxValue) *
                      100
                  );

                return (
                  <div
                    key={row.day}
                    className="grid grid-cols-[80px_1fr_50px] items-center gap-3"
                  >
                    <span className="text-xs font-bold text-slate-500">
                      {formatDay(row.day)}
                    </span>

                    <div className="h-9 overflow-hidden rounded-xl bg-slate-100">
                      <div
                        className="flex h-full items-center rounded-xl bg-sky-500 px-3 text-[11px] font-black text-white transition-all"
                        style={{
                          width: `${percentage}%`,
                        }}
                      >
                        {row.total > 0 && row.total}
                      </div>
                    </div>

                    <span className="text-left text-sm font-black text-slate-900">
                      {formatNumber(
                        Number(row.total)
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
              <BarChart3 className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-4 text-lg font-black text-slate-800">
                لا توجد بيانات كافية حتى الآن
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                ستظهر البيانات بعد تسجيل زيارات وتفاعلات مع الصفحة العامة.
              </p>
            </div>
          )}
        </section>
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
          </div>
        </div>
      )}
    </div>
  );
}
