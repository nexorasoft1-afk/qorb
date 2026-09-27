"use client";

import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  ExternalLink,
  LoaderCircle,
  Plus,
  RefreshCw,
  Store,
  XCircle,
} from "lucide-react";

import Link from "next/link";
import { useEffect, useState } from "react";

interface OwnershipRequest {
  id: number;
  requestType: "Create" | "Claim";
  name: string | null;
  status: "Pending" | "Approved" | "Rejected";
  notes: string | null;
  createdAt: string;
  reviewedAt: string | null;

  // قد ترجع الـ API هذه القيمة في الطلب المعتمد
  businessId?: number | null;
}

export default function OwnerRequestsPage() {
  const [requests, setRequests] = useState<OwnershipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/owner/requests", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(
          result.message ?? "تعذر تحميل الطلبات"
        );

        return;
      }

      setRequests(result.data ?? []);
    } catch (error) {
      console.error("Owner requests:", error);

      setError("حدث خطأ أثناء تحميل الطلبات");
    } finally {
      setLoading(false);
    }
  }

  function statusLabel(
    status: OwnershipRequest["status"]
  ) {
    switch (status) {
      case "Approved":
        return "تمت الموافقة";

      case "Rejected":
        return "مرفوض";

      default:
        return "قيد المراجعة";
    }
  }

  function statusDescription(
    status: OwnershipRequest["status"]
  ) {
    switch (status) {
      case "Approved":
        return "تمت الموافقة على طلبك ويمكنك الآن إدارة نشاطك.";

      case "Rejected":
        return "تم رفض الطلب. راجع سبب الرفض ويمكنك إعادة التقديم.";

      default:
        return "طلبك قيد المراجعة من إدارة قُرب.";
    }
  }

  function statusClass(
    status: OwnershipRequest["status"]
  ) {
    switch (status) {
      case "Approved":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";

      case "Rejected":
        return "bg-rose-50 text-rose-700 border-rose-200";

      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  }

  function StatusIcon({
    status,
  }: {
    status: OwnershipRequest["status"];
  }) {
    if (status === "Approved") {
      return <CheckCircle2 className="h-4 w-4" />;
    }

    if (status === "Rejected") {
      return <XCircle className="h-4 w-4" />;
    }

    return <Clock3 className="h-4 w-4" />;
  }

  function requestTypeLabel(
    requestType: OwnershipRequest["requestType"]
  ) {
    return requestType === "Claim"
      ? "طلب إثبات ملكية"
      : "طلب إضافة نشاط";
  }

  function formatDate(date: string | null) {
    if (!date) {
      return "—";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function getBusinessId(
    request: OwnershipRequest
  ) {
    if (
      request.businessId !== null &&
      request.businessId !== undefined
    ) {
      return request.businessId;
    }

    return null;
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-50"
    >
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Back */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-slate-900"
        >
          <ArrowRight className="h-4 w-4" />
          الرئيسية
        </Link>

        {/* Header */}
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 text-sm font-bold text-sky-600">
              طلبات النشاط
            </div>

            <h1 className="text-3xl font-black text-slate-900">
              طلباتي
            </h1>

            <p className="mt-2 text-sm leading-7 text-slate-500">
              تابع حالة طلبات إضافة الأنشطة وإثبات ملكيتها.
            </p>
          </div>

          <Link
            href="/owner/register"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            طلب إضافة نشاط
          </Link>
        </div>

        {/* Loading */}
        {loading && (
          <div className="mt-8 flex min-h-48 items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
              <LoaderCircle className="h-5 w-5 animate-spin" />
              جاري تحميل الطلبات...
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="mt-8 rounded-3xl border border-rose-200 bg-rose-50 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-black text-rose-800">
                  تعذر تحميل الطلبات
                </h2>

                <p className="mt-1 text-sm leading-6 text-rose-700">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={loadRequests}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-700"
              >
                <RefreshCw className="h-4 w-4" />
                إعادة المحاولة
              </button>
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading &&
          !error &&
          requests.length === 0 && (
            <div className="mt-8 rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-sky-50 text-sky-600">
                <Store className="h-8 w-8" />
              </div>

              <h2 className="mt-5 text-xl font-black text-slate-800">
                لا توجد طلبات حتى الآن
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-500">
                يمكنك إضافة نشاطك إلى قُرب وإرساله للمراجعة من الإدارة.
              </p>

              <Link
                href="/owner/register"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-sky-700"
              >
                <Plus className="h-4 w-4" />
                إضافة نشاط
              </Link>
            </div>
          )}

        {/* Requests */}
        {!loading &&
          !error &&
          requests.length > 0 && (
            <div className="mt-8 space-y-5">

              {requests.map((request) => {
                const businessId =
                  getBusinessId(request);

                return (
                  <article
                    key={request.id}
                    className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                  >
                    {/* Top */}
                    <div className="p-5 sm:p-6">
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

                        {/* Business */}
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                            <Store className="h-6 w-6" />
                          </div>

                          <div className="min-w-0">
                            <h2 className="truncate text-lg font-black text-slate-900">
                              {request.name ??
                                "طلب نشاط"}
                            </h2>

                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                              <span>
                                طلب رقم #{request.id}
                              </span>

                              <span className="hidden sm:inline">
                                •
                              </span>

                              <span>
                                {requestTypeLabel(
                                  request.requestType
                                )}
                              </span>
                            </div>

                            <div className="mt-2 text-xs text-slate-500">
                              تاريخ الطلب:{" "}
                              {formatDate(
                                request.createdAt
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status */}
                        <div
                          className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-2 text-xs font-black ${statusClass(
                            request.status
                          )}`}
                        >
                          <StatusIcon
                            status={
                              request.status
                            }
                          />

                          {statusLabel(
                            request.status
                          )}
                        </div>
                      </div>

                      {/* Status explanation */}
                      <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                        <p className="text-sm leading-7 text-slate-600">
                          {statusDescription(
                            request.status
                          )}
                        </p>
                      </div>

                      {/* Review date */}
                      {request.reviewedAt && (
                        <div className="mt-3 text-xs text-slate-400">
                          تمت المراجعة بتاريخ:{" "}
                          {formatDate(
                            request.reviewedAt
                          )}
                        </div>
                      )}

                      {/* Notes */}
                      {request.notes && (
                        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                          <div className="mb-1 text-xs font-black text-slate-400">
                            ملاحظات الإدارة
                          </div>

                          <p className="text-sm leading-7 text-slate-600">
                            {request.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Approved */}
                    {request.status ===
                      "Approved" && (
                      <div className="border-t border-emerald-100 bg-emerald-50/70 p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-start gap-3">
                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

                            <div>
                              <div className="font-black text-emerald-800">
                                تم اعتماد نشاطك
                              </div>

                              <p className="mt-1 text-sm leading-6 text-emerald-700">
                                يمكنك الآن الدخول إلى لوحة صاحب النشاط وإكمال بيانات نشاطك.
                              </p>
                            </div>
                          </div>

                          {businessId ? (
                            <Link
                              href={`/owner/dashboard/businesses/${businessId}`}
                              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
                            >
                              إدارة النشاط
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          ) : (
                            <Link
                              href="/owner/dashboard"
                              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
                            >
                              لوحة صاحب النشاط
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Rejected */}
                    {request.status ===
                      "Rejected" && (
                      <div className="border-t border-rose-100 bg-rose-50/70 p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-start gap-3">
                            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />

                            <div>
                              <div className="font-black text-rose-800">
                                تم رفض الطلب
                              </div>

                              <p className="mt-1 text-sm leading-6 text-rose-700">
                                يمكنك مراجعة الملاحظات وإرسال طلب جديد بعد تعديل البيانات.
                              </p>
                            </div>
                          </div>

                          <Link
                            href="/owner/register"
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-rose-700"
                          >
                            <RefreshCw className="h-4 w-4" />
                            إعادة التقديم
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* Pending */}
                    {request.status ===
                      "Pending" && (
                      <div className="border-t border-amber-100 bg-amber-50/70 p-5">
                        <div className="flex items-start gap-3">
                          <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

                          <div>
                            <div className="font-black text-amber-800">
                              طلبك قيد المراجعة
                            </div>

                            <p className="mt-1 text-sm leading-6 text-amber-700">
                              سيتم مراجعة البيانات من الإدارة، وستظهر لك النتيجة هنا بعد اتخاذ القرار.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}

        {/* Bottom CTA */}
        {!loading &&
          !error &&
          requests.length > 0 && (
            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-black text-slate-900">
                    لديك نشاط آخر؟
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    يمكنك إرسال طلب جديد لإضافة نشاط آخر إلى قُرب.
                  </p>
                </div>

                <Link
                  href="/owner/register"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
                >
                  <Plus className="h-4 w-4" />
                  إضافة نشاط آخر
                </Link>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}