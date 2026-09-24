"use client";

import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  MapPin,
  Search,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type SuggestionStatus =
  | "Pending"
  | "Approved"
  | "Rejected";

interface AreaSuggestion {
  id: number;
  userId: number;
  userName: string | null;
  userEmail: string | null;
  userPhone: string | null;
  cityId: number;
  cityName: string | null;
  name: string;
  notes: string | null;
  status: SuggestionStatus;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: number | null;
}

type FilterType =
  | "all"
  | "Pending"
  | "Approved"
  | "Rejected";

export default function AreaSuggestionsPage() {
  const [suggestions, setSuggestions] =
    useState<AreaSuggestion[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [actionLoading, setActionLoading] =
    useState<number | null>(null);

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState<FilterType>("all");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [rejectId, setRejectId] =
    useState<number | null>(null);

  const [rejectReason, setRejectReason] =
    useState("");

  // =====================================================
  // Load suggestions
  // =====================================================

  async function loadSuggestions() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/area-suggestions",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data?.error ||
            "تعذر تحميل اقتراحات المناطق"
        );
      }

      setSuggestions(
        Array.isArray(data.suggestions)
          ? data.suggestions
          : []
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء تحميل البيانات"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSuggestions();
  }, []);

  // =====================================================
  // Review suggestion
  // =====================================================

  async function reviewSuggestion(
    id: number,
    action: "approve" | "reject",
    reason = ""
  ) {
    try {
      setActionLoading(id);
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/admin/area-suggestions/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            action,
            reason:
              action === "reject"
                ? reason
                : undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data?.error ||
            "تعذر تنفيذ العملية"
        );
      }

      setSuggestions((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                status:
                  action === "approve"
                    ? "Approved"
                    : "Rejected",
                reviewedAt:
                  new Date().toISOString(),
              }
            : item
        )
      );

      setSuccess(
        data.message ||
          (action === "approve"
            ? "تم اعتماد المنطقة بنجاح"
            : "تم رفض اقتراح المنطقة")
      );

      setRejectId(null);
      setRejectReason("");
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء تنفيذ العملية"
      );
    } finally {
      setActionLoading(null);
    }
  }

  // =====================================================
  // Filtering
  // =====================================================

  const filteredSuggestions = useMemo(() => {
    const value =
      search.trim().toLowerCase();

    return suggestions.filter((item) => {
      const matchesStatus =
        filter === "all" ||
        item.status === filter;

      if (!matchesStatus) {
        return false;
      }

      if (!value) {
        return true;
      }

      return (
        item.name
          ?.toLowerCase()
          .includes(value) ||
        item.cityName
          ?.toLowerCase()
          .includes(value) ||
        item.userName
          ?.toLowerCase()
          .includes(value) ||
        item.userEmail
          ?.toLowerCase()
          .includes(value)
      );
    });
  }, [suggestions, filter, search]);

  // =====================================================
  // Counts
  // =====================================================

  const pendingCount =
    suggestions.filter(
      (item) => item.status === "Pending"
    ).length;

  const approvedCount =
    suggestions.filter(
      (item) => item.status === "Approved"
    ).length;

  const rejectedCount =
    suggestions.filter(
      (item) => item.status === "Rejected"
    ).length;

  // =====================================================
  // Helpers
  // =====================================================

  function formatDate(
    value: string | null
  ) {
    if (!value) return "—";

    try {
      return new Intl.DateTimeFormat(
        "ar-EG",
        {
          dateStyle: "medium",
          timeStyle: "short",
        }
      ).format(new Date(value));
    } catch {
      return value;
    }
  }

  function statusInfo(
    status: SuggestionStatus
  ) {
    switch (status) {
      case "Approved":
        return {
          label: "معتمد",
          icon: CheckCircle2,
          className:
            "bg-emerald-50 text-emerald-700 border-emerald-200",
        };

      case "Rejected":
        return {
          label: "مرفوض",
          icon: XCircle,
          className:
            "bg-red-50 text-red-700 border-red-200",
        };

      default:
        return {
          label: "قيد المراجعة",
          icon: Clock3,
          className:
            "bg-amber-50 text-amber-700 border-amber-200",
        };
    }
  }

  // =====================================================
  // Render
  // =====================================================

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-50"
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ================================================= */}
        {/* Header */}
        {/* ================================================= */}

        <div className="mb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg">
                <MapPin size={28} />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck
                    size={18}
                    className="text-emerald-600"
                  />

                  <p className="text-sm font-bold text-slate-500">
                    لوحة إدارة قُرب
                  </p>
                </div>

                <h1 className="mt-1 text-2xl font-black text-slate-900">
                  اقتراحات المناطق
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  مراجعة واعتماد المناطق الجديدة
                  قبل ظهورها للمستخدمين
                </p>
              </div>
            </div>

            <Link
              href="/admin"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <ArrowRight size={17} />
              العودة للوحة الإدارة
            </Link>
          </div>
        </div>

        {/* ================================================= */}
        {/* Alerts */}
        {/* ================================================= */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            <XCircle
              size={20}
              className="mt-0.5 shrink-0"
            />

            <div>{error}</div>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
            <CheckCircle2
              size={20}
              className="mt-0.5 shrink-0"
            />

            <div>{success}</div>
          </div>
        )}

        {/* ================================================= */}
        {/* Statistics */}
        {/* ================================================= */}

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <StatCard
            title="كل الاقتراحات"
            value={suggestions.length}
            icon={<MapPin size={22} />}
            className="bg-slate-900 text-white"
          />

          <StatCard
            title="قيد المراجعة"
            value={pendingCount}
            icon={<Clock3 size={22} />}
            className="bg-white text-amber-600"
          />

          <StatCard
            title="المعتمدة"
            value={approvedCount}
            icon={
              <CheckCircle2 size={22} />
            }
            className="bg-white text-emerald-600"
          />

          <StatCard
            title="المرفوضة"
            value={rejectedCount}
            icon={<XCircle size={22} />}
            className="bg-white text-red-600"
          />
        </div>

        {/* ================================================= */}
        {/* Filters */}
        {/* ================================================= */}

        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div className="relative w-full lg:max-w-md">
              <Search
                size={19}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="ابحث باسم المنطقة أو المدينة أو المستخدم..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pr-11 pl-4 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <FilterButton
                active={filter === "all"}
                onClick={() =>
                  setFilter("all")
                }
              >
                الكل ({suggestions.length})
              </FilterButton>

              <FilterButton
                active={filter === "Pending"}
                onClick={() =>
                  setFilter("Pending")
                }
              >
                قيد المراجعة (
                {pendingCount}
                )
              </FilterButton>

              <FilterButton
                active={filter === "Approved"}
                onClick={() =>
                  setFilter("Approved")
                }
              >
                المعتمدة (
                {approvedCount}
                )
              </FilterButton>

              <FilterButton
                active={filter === "Rejected"}
                onClick={() =>
                  setFilter("Rejected")
                }
              >
                المرفوضة (
                {rejectedCount}
                )
              </FilterButton>
            </div>
          </div>
        </div>

        {/* ================================================= */}
        {/* Content */}
        {/* ================================================= */}

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />

            <p className="font-bold text-slate-600">
              جاري تحميل الاقتراحات...
            </p>
          </div>
        ) : filteredSuggestions.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <MapPin size={30} />
            </div>

            <h3 className="text-lg font-black text-slate-800">
              لا توجد اقتراحات
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              لا توجد بيانات مطابقة للفلاتر
              الحالية.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSuggestions.map(
              (item) => {
                const status =
                  statusInfo(
                    item.status
                  );

                const StatusIcon =
                  status.icon;

                const isLoading =
                  actionLoading ===
                  item.id;

                return (
                  <div
                    key={item.id}
                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
                  >
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">

                      {/* Main information */}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                            <MapPin
                              size={23}
                            />
                          </div>

                          <div className="min-w-0">
                            <h2 className="truncate text-xl font-black text-slate-900">
                              {item.name}
                            </h2>

                            <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-slate-500">
                              <MapPin
                                size={15}
                              />

                              {item.cityName ||
                                "مدينة غير محددة"}
                            </p>
                          </div>

                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-black ${status.className}`}
                          >
                            <StatusIcon
                              size={14}
                            />

                            {status.label}
                          </span>
                        </div>

                        {/* Notes */}

                        {item.notes && (
                          <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                            <p className="mb-1 text-xs font-black text-slate-400">
                              ملاحظات صاحب الاقتراح
                            </p>

                            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                              {item.notes}
                            </p>
                          </div>
                        )}

                        {/* User information */}

                        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          <InfoBox
                            label="مقدم الاقتراح"
                            value={
                              item.userName ||
                              "غير معروف"
                            }
                          />

                          <InfoBox
                            label="البريد الإلكتروني"
                            value={
                              item.userEmail ||
                              "غير متوفر"
                            }
                          />

                          <InfoBox
                            label="الهاتف"
                            value={
                              item.userPhone ||
                              "غير متوفر"
                            }
                          />

                          <InfoBox
                            label="تاريخ الاقتراح"
                            value={formatDate(
                              item.createdAt
                            )}
                          />

                          <InfoBox
                            label="تاريخ المراجعة"
                            value={formatDate(
                              item.reviewedAt
                            )}
                          />
                        </div>
                      </div>

                      {/* Actions */}

                      {item.status ===
                        "Pending" && (
                        <div className="flex shrink-0 flex-col gap-2 sm:flex-row xl:w-44 xl:flex-col">
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() =>
                              reviewSuggestion(
                                item.id,
                                "approve"
                              )
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Check
                              size={18}
                            />

                            {isLoading
                              ? "جاري التنفيذ..."
                              : "اعتماد المنطقة"}
                          </button>

                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => {
                              setRejectId(
                                item.id
                              );
                              setRejectReason(
                                ""
                              );
                            }}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <X
                              size={18}
                            />

                            رفض الاقتراح
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>

      {/* =================================================== */}
      {/* Reject Modal */}
      {/* =================================================== */}

      {rejectId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  رفض اقتراح المنطقة
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  يمكنك كتابة سبب الرفض ليتم
                  حفظه مع الطلب.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setRejectId(null)
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <textarea
              value={rejectReason}
              onChange={(e) =>
                setRejectReason(
                  e.target.value
                )
              }
              rows={5}
              placeholder="سبب الرفض..."
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-800 outline-none transition focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-100"
            />

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                disabled={
                  actionLoading ===
                  rejectId
                }
                onClick={() =>
                  reviewSuggestion(
                    rejectId,
                    "reject",
                    rejectReason
                  )
                }
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ===
                rejectId
                  ? "جاري الرفض..."
                  : "تأكيد الرفض"}
              </button>

              <button
                type="button"
                onClick={() =>
                  setRejectId(null)
                }
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =======================================================
// Components
// =======================================================

function StatCard({
  title,
  value,
  icon,
  className,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-slate-200 p-5 shadow-sm ${className || "bg-white text-slate-900"}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold opacity-70">
            {title}
          </p>

          <p className="mt-2 text-3xl font-black">
            {value}
          </p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/5">
          {icon}
        </div>
      </div>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2.5 text-xs font-black transition ${
        active
          ? "bg-slate-900 text-white shadow-sm"
          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
      <p className="text-[11px] font-black text-slate-400">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-bold text-slate-700">
        {value}
      </p>
    </div>
  );
}