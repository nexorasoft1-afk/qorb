"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CirclePercent,
  Edit3,
  ExternalLink,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Tag,
  Trash2,
  X,
} from "lucide-react";

interface Offer {
  id: number;
  businessId: number;
  title: string;
  description: string | null;
  discountType: "Percentage" | "Fixed";
  discountValue: string | number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

interface FormState {
  title: string;
  description: string;
  discountType: "Percentage" | "Fixed";
  discountValue: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

const EMPTY: FormState = {
  title: "",
  description: "",
  discountType: "Percentage",
  discountValue: "",
  startDate: "",
  endDate: "",
  isActive: true,
};

const NAV_ITEMS = [
  ["البيانات الأساسية", ""],
  ["الخدمات", "services"],
  ["الصور", "images"],
  ["مواعيد العمل", "hours"],
  ["العروض", "offers"],
  ["الفعاليات", "events"],
  ["التحليلات", "analytics"],
];

function toLocalInput(date: string) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const local = new Date(
    d.getTime() - d.getTimezoneOffset() * 60000
  );
  return local.toISOString().slice(0, 16);
}

function formatDate(date: string) {
  try {
    return new Intl.DateTimeFormat("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  } catch {
    return date;
  }
}

function discountLabel(offer: Offer) {
  const value = Number(offer.discountValue);
  if (offer.discountType === "Percentage") {
    return `${value}% خصم`;
  }
  return `${value} جنيه خصم`;
}

export default function OffersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [offers, setOffers] = useState<Offer[]>([]);
  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Offer | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/owner/businesses/${id}/offers`,
        { cache: "no-store" }
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "تعذر تحميل العروض");
      }

      setBusinessName(data.business?.name || "");
      setOffers(Array.isArray(data.offers) ? data.offers : []);
    } catch (error) {
      setToast({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء تحميل العروض",
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

  const openAdd = () => {
    const now = new Date();
    const end = new Date(
      now.getTime() + 7 * 24 * 60 * 60 * 1000
    );

    setEditing(null);
    setForm({
      ...EMPTY,
      startDate: toLocalInput(now.toISOString()),
      endDate: toLocalInput(end.toISOString()),
    });
    setShowForm(true);
  };

  const openEdit = (offer: Offer) => {
    setEditing(offer);
    setForm({
      title: offer.title,
      description: offer.description || "",
      discountType: offer.discountType,
      discountValue: String(offer.discountValue),
      startDate: toLocalInput(offer.startDate),
      endDate: toLocalInput(offer.endDate),
      isActive: offer.isActive,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;
    setShowForm(false);
    setEditing(null);
    setForm(EMPTY);
  };

  const setField = (
    key: keyof FormState,
    value: string | boolean
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      setToast({
        type: "error",
        message: "عنوان العرض مطلوب",
      });
      return;
    }

    const value = Number(form.discountValue);
    if (!Number.isFinite(value) || value < 0) {
      setToast({
        type: "error",
        message: "قيمة الخصم غير صالحة",
      });
      return;
    }

    if (
      form.discountType === "Percentage" &&
      value > 100
    ) {
      setToast({
        type: "error",
        message: "نسبة الخصم لا يمكن أن تتجاوز 100%",
      });
      return;
    }

    const start = new Date(form.startDate);
    const end = new Date(form.endDate);

    if (
      !form.startDate ||
      !form.endDate ||
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start
    ) {
      setToast({
        type: "error",
        message: "تأكد من صحة تاريخ البداية والنهاية",
      });
      return;
    }

    setSaving(true);

    try {
      const editingId = editing?.id;
      const res = await fetch(
        editing
          ? `/api/owner/businesses/${id}/offers/${editingId}`
          : `/api/owner/businesses/${id}/offers`,
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title.trim(),
            description: form.description.trim() || null,
            discountType: form.discountType,
            discountValue: value,
            startDate: start.toISOString(),
            endDate: end.toISOString(),
            isActive: form.isActive,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.error ||
            (editing
              ? "تعذر تحديث العرض"
              : "تعذر إضافة العرض")
        );
      }

      const offer = data.offer;

      if (offer) {
        setOffers((current) => {
          const next = editing
            ? current.map((item) =>
                item.id === offer.id ? offer : item
              )
            : [offer, ...current];

          return next.sort(
            (a, b) =>
              Number(b.isActive) - Number(a.isActive) ||
              new Date(b.startDate).getTime() -
                new Date(a.startDate).getTime()
          );
        });
      } else {
        await load();
      }

      setToast({
        type: "success",
        message: editing
          ? "تم تحديث العرض بنجاح"
          : "تمت إضافة العرض بنجاح",
      });

      closeForm();
    } catch (error) {
      setToast({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء حفظ العرض",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (offer: Offer) => {
    try {
      const res = await fetch(
        `/api/owner/businesses/${id}/offers/${offer.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isActive: !offer.isActive,
          }),
        }
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "تعذر تغيير حالة العرض");
      }

      setOffers((current) =>
        current.map((item) =>
          item.id === offer.id
            ? data.offer || {
                ...item,
                isActive: !item.isActive,
              }
            : item
        )
      );

      setToast({
        type: "success",
        message: offer.isActive
          ? "تم إيقاف العرض"
          : "تم تفعيل العرض",
      });
    } catch (error) {
      setToast({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء تحديث العرض",
      });
    }
  };

  const remove = async (offer: Offer) => {
    if (
      !window.confirm(
        `هل تريد حذف العرض "${offer.title}"؟`
      )
    ) {
      return;
    }

    setDeletingId(offer.id);

    try {
      const res = await fetch(
        `/api/owner/businesses/${id}/offers/${offer.id}`,
        { method: "DELETE" }
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "تعذر حذف العرض");
      }

      setOffers((current) =>
        current.filter((item) => item.id !== offer.id)
      );

      setToast({
        type: "success",
        message: "تم حذف العرض بنجاح",
      });
    } catch (error) {
      setToast({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء حذف العرض",
      });
    } finally {
      setDeletingId(null);
    }
  };

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
                  العروض
                </h1>
                {businessName && (
                  <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
                    {businessName}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                أنشئ عروضًا موسمية ومؤقتة مع تحديد نسبة أو قيمة الخصم.
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
              onClick={openAdd}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white"
            >
              <Plus className="h-4 w-4" />
              إضافة عرض
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
                  suffix === "offers"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {offers.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
            <Tag className="mx-auto h-12 w-12 text-violet-500" />
            <h2 className="mt-5 text-xl font-black text-slate-900">
              لا توجد عروض حتى الآن
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              أضف أول عرض ليظهر للعملاء في الصفحة العامة.
            </p>
            <button
              onClick={openAdd}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white"
            >
              <Plus className="h-4 w-4" />
              إنشاء أول عرض
            </button>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {offers.map((offer) => {
              const now = Date.now();
              const activeByDate =
                new Date(offer.startDate).getTime() <= now &&
                new Date(offer.endDate).getTime() >= now;

              return (
                <article
                  key={offer.id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="border-b border-slate-100 bg-gradient-to-l from-violet-50 via-white to-amber-50 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-700">
                            {discountLabel(offer)}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              offer.isActive
                                ? activeByDate
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-amber-100 text-amber-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {offer.isActive
                              ? activeByDate
                                ? "نشط الآن"
                                : "نشط حسب الفترة"
                              : "متوقف"}
                          </span>
                        </div>

                        <h2 className="mt-4 text-xl font-black text-slate-900">
                          {offer.title}
                        </h2>

                        {offer.description && (
                          <p className="mt-2 text-sm leading-7 text-slate-600">
                            {offer.description}
                          </p>
                        )}
                      </div>

                      <CirclePercent className="h-8 w-8 shrink-0 text-violet-500" />
                    </div>
                  </div>

                  <div className="grid gap-3 p-5 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-bold text-slate-500">
                        يبدأ
                      </p>
                      <p className="mt-2 text-sm font-black text-slate-900">
                        {formatDate(offer.startDate)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-bold text-slate-500">
                        ينتهي
                      </p>
                      <p className="mt-2 text-sm font-black text-slate-900">
                        {formatDate(offer.endDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 border-t border-slate-100 p-4">
                    <button
                      onClick={() => openEdit(offer)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                    >
                      <Edit3 className="h-4 w-4" />
                      تعديل
                    </button>

                    <button
                      onClick={() => toggle(offer)}
                      className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold ${
                        offer.isActive
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      <Check className="h-4 w-4" />
                      {offer.isActive ? "إيقاف" : "تفعيل"}
                    </button>

                    <button
                      onClick={() => remove(offer)}
                      disabled={deletingId === offer.id}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-700 disabled:opacity-60"
                    >
                      {deletingId === offer.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      حذف
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
            onClick={closeForm}
          />

          <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white p-5">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  {editing ? "تعديل العرض" : "إضافة عرض جديد"}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  حدد قيمة الخصم والفترة التي يعمل خلالها العرض.
                </p>
              </div>

              <button
                onClick={closeForm}
                disabled={saving}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={save} className="space-y-5 p-5">
              <label className="block">
                <span className="mb-2 block text-sm font-bold">
                  عنوان العرض *
                </span>
                <input
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  maxLength={200}
                  placeholder="مثال: خصم نهاية الأسبوع"
                  className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold">
                  وصف العرض
                </span>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) =>
                    setField("description", e.target.value)
                  }
                  placeholder="اكتب تفاصيل العرض..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm leading-7 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold">
                    نوع الخصم
                  </span>
                  <select
                    value={form.discountType}
                    onChange={(e) =>
                      setField(
                        "discountType",
                        e.target.value as
                          | "Percentage"
                          | "Fixed"
                      )
                    }
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
                  >
                    <option value="Percentage">
                      نسبة مئوية
                    </option>
                    <option value="Fixed">
                      مبلغ ثابت
                    </option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold">
                    قيمة الخصم
                  </span>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max={
                        form.discountType === "Percentage"
                          ? "100"
                          : undefined
                      }
                      step="0.01"
                      value={form.discountValue}
                      onChange={(e) =>
                        setField(
                          "discountValue",
                          e.target.value
                        )
                      }
                      placeholder="0"
                      className="h-12 w-full rounded-xl border border-slate-200 px-4 pl-14 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      {form.discountType === "Percentage"
                        ? "%"
                        : "ج.م"}
                    </span>
                  </div>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold">
                    بداية العرض
                  </span>
                  <input
                    type="datetime-local"
                    value={form.startDate}
                    onChange={(e) =>
                      setField("startDate", e.target.value)
                    }
                    className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold">
                    نهاية العرض
                  </span>
                  <input
                    type="datetime-local"
                    value={form.endDate}
                    onChange={(e) =>
                      setField("endDate", e.target.value)
                    }
                    className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={() =>
                  setField("isActive", !form.isActive)
                }
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 ${
                  form.isActive
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <span className="text-sm font-bold">
                  {form.isActive
                    ? "العرض مفعل"
                    : "العرض متوقف"}
                </span>

                <span
                  className={`relative h-7 w-12 rounded-full ${
                    form.isActive
                      ? "bg-emerald-500"
                      : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                      form.isActive
                        ? "right-1"
                        : "right-6"
                    }`}
                  />
                </span>
              </button>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-bold"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-7 py-3 text-sm font-bold text-white disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {editing ? "حفظ التعديلات" : "إضافة العرض"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
