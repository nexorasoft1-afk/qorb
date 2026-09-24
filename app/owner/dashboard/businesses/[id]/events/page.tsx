"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Edit3,
  ExternalLink,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
} from "lucide-react";

interface EventItem {
  id: number;
  businessId: number;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FormState {
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  isActive: boolean;
}

const EMPTY: FormState = {
  title: "",
  description: "",
  startAt: "",
  endAt: "",
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

function localDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const local = new Date(
    d.getTime() - d.getTimezoneOffset() * 60000
  );
  return local.toISOString().slice(0, 16);
}

function displayDate(value: string) {
  try {
    return new Intl.DateTimeFormat("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function EventsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch(
        `/api/owner/businesses/${id}/events`,
        { cache: "no-store" }
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "تعذر تحميل الفعاليات");
      }

      setBusinessName(data.business?.name || "");
      setEvents(Array.isArray(data.events) ? data.events : []);
    } catch (error) {
      setToast({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء تحميل الفعاليات",
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
    const start = new Date();
    start.setHours(start.getHours() + 1);
    start.setMinutes(0, 0, 0);

    const end = new Date(
      start.getTime() + 2 * 60 * 60 * 1000
    );

    setEditing(null);
    setForm({
      ...EMPTY,
      startAt: localDateTime(start.toISOString()),
      endAt: localDateTime(end.toISOString()),
    });
    setShowForm(true);
  };

  const openEdit = (item: EventItem) => {
    setEditing(item);
    setForm({
      title: item.title,
      description: item.description || "",
      startAt: localDateTime(item.startAt),
      endAt: localDateTime(item.endAt),
      isActive: item.isActive,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;
    setShowForm(false);
    setEditing(null);
    setForm(EMPTY);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      setToast({
        type: "error",
        message: "عنوان الفعالية مطلوب",
      });
      return;
    }

    const start = new Date(form.startAt);
    const end = new Date(form.endAt);

    if (
      !form.startAt ||
      !form.endAt ||
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
      const url = editing
        ? `/api/owner/businesses/${id}/events/${editing.id}`
        : `/api/owner/businesses/${id}/events`;

      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || null,
          startAt: start.toISOString(),
          endAt: end.toISOString(),
          isActive: form.isActive,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.error ||
            (editing
              ? "تعذر تحديث الفعالية"
              : "تعذر إضافة الفعالية")
        );
      }

      if (data.event) {
        setEvents((current) => {
          const next = editing
            ? current.map((item) =>
                item.id === data.event.id ? data.event : item
              )
            : [...current, data.event];

          return next.sort(
            (a, b) =>
              new Date(a.startAt).getTime() -
              new Date(b.startAt).getTime()
          );
        });
      } else {
        await load();
      }

      setToast({
        type: "success",
        message: editing
          ? "تم تحديث الفعالية بنجاح"
          : "تمت إضافة الفعالية بنجاح",
      });

      closeForm();
    } catch (error) {
      setToast({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء حفظ الفعالية",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (item: EventItem) => {
    try {
      const res = await fetch(
        `/api/owner/businesses/${id}/events/${item.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isActive: !item.isActive,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "تعذر تغيير حالة الفعالية");
      }

      setEvents((current) =>
        current.map((event) =>
          event.id === item.id
            ? data.event || {
                ...event,
                isActive: !event.isActive,
              }
            : event
        )
      );
    } catch (error) {
      setToast({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء التحديث",
      });
    }
  };

  const remove = async (item: EventItem) => {
    if (!window.confirm(`هل تريد حذف فعالية "${item.title}"؟`)) {
      return;
    }

    setDeletingId(item.id);

    try {
      const res = await fetch(
        `/api/owner/businesses/${id}/events/${item.id}`,
        { method: "DELETE" }
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "تعذر حذف الفعالية");
      }

      setEvents((current) =>
        current.filter((event) => event.id !== item.id)
      );

      setToast({
        type: "success",
        message: "تم حذف الفعالية بنجاح",
      });
    } catch (error) {
      setToast({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء حذف الفعالية",
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
                  الفعاليات
                </h1>
                {businessName && (
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                    {businessName}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                أضف فعاليات ومناسبات يمكن عرضها لزوار النشاط.
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
              إضافة فعالية
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
                  suffix === "events"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {events.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
            <CalendarDays className="mx-auto h-12 w-12 text-amber-500" />
            <h2 className="mt-5 text-xl font-black text-slate-900">
              لا توجد فعاليات
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              أضف فعالية ليتمكن العملاء من معرفة المناسبات القادمة.
            </p>
            <button
              onClick={openAdd}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white"
            >
              <Plus className="h-4 w-4" />
              إضافة أول فعالية
            </button>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {events.map((item) => {
              const now = Date.now();
              const starts = new Date(item.startAt).getTime();
              const ends = new Date(item.endAt).getTime();
              const finished = ends < now;
              const ongoing = starts <= now && ends >= now;

              return (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="border-b border-slate-100 bg-gradient-to-l from-amber-50 via-white to-sky-50 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              item.isActive
                                ? ongoing
                                  ? "bg-emerald-100 text-emerald-700"
                                  : finished
                                  ? "bg-slate-100 text-slate-600"
                                  : "bg-sky-100 text-sky-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {!item.isActive
                              ? "متوقفة"
                              : ongoing
                              ? "جارية الآن"
                              : finished
                              ? "انتهت"
                              : "قادمة"}
                          </span>
                        </div>

                        <h2 className="mt-4 text-xl font-black text-slate-900">
                          {item.title}
                        </h2>

                        {item.description && (
                          <p className="mt-2 text-sm leading-7 text-slate-600">
                            {item.description}
                          </p>
                        )}
                      </div>

                      <CalendarDays className="h-8 w-8 shrink-0 text-amber-500" />
                    </div>
                  </div>

                  <div className="grid gap-3 p-5 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-bold text-slate-500">
                        البداية
                      </p>
                      <p className="mt-2 text-sm font-black text-slate-900">
                        {displayDate(item.startAt)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-bold text-slate-500">
                        النهاية
                      </p>
                      <p className="mt-2 text-sm font-black text-slate-900">
                        {displayDate(item.endAt)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-t border-slate-100 p-4">
                    <button
                      onClick={() => openEdit(item)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold"
                    >
                      <Edit3 className="h-4 w-4" />
                      تعديل
                    </button>

                    <button
                      onClick={() => toggle(item)}
                      className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-bold ${
                        item.isActive
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      <Check className="h-4 w-4" />
                      {item.isActive ? "إيقاف" : "تفعيل"}
                    </button>

                    <button
                      onClick={() => remove(item)}
                      disabled={deletingId === item.id}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-bold text-rose-700 disabled:opacity-60"
                    >
                      {deletingId === item.id ? (
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
                  {editing ? "تعديل الفعالية" : "إضافة فعالية جديدة"}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  حدد بيانات الفعالية وفترتها وحالتها.
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
                  عنوان الفعالية *
                </span>
                <input
                  value={form.title}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      title: e.target.value,
                    }))
                  }
                  maxLength={200}
                  placeholder="مثال: ليلة موسيقية"
                  className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-50"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold">
                  وصف الفعالية
                </span>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      description: e.target.value,
                    }))
                  }
                  placeholder="تفاصيل الفعالية..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm leading-7 outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-50"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold">
                    البداية
                  </span>
                  <input
                    type="datetime-local"
                    value={form.startAt}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        startAt: e.target.value,
                      }))
                    }
                    className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-50"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold">
                    النهاية
                  </span>
                  <input
                    type="datetime-local"
                    value={form.endAt}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        endAt: e.target.value,
                      }))
                    }
                    className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-50"
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    isActive: !current.isActive,
                  }))
                }
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 ${
                  form.isActive
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <span className="text-sm font-bold">
                  {form.isActive
                    ? "الفعالية مفعلة"
                    : "الفعالية متوقفة"}
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
                  {editing ? "حفظ التعديلات" : "إضافة الفعالية"}
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
