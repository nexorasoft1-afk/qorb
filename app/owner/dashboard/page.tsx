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
import { useEffect, useMemo, useState } from "react";

interface OwnershipRequest {
  id: number;
  requestType: "Create" | "Claim";
  name: string | null;
  status:
    | "Pending"
    | "Approved"
    | "Rejected";
  notes: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

interface Business {
  id: number;
  name: string;
  status:
    | "Pending"
    | "Approved"
    | "Rejected"
    | "Suspended";
  coverImage: string | null;
}

export default function OwnerRequestsPage() {
  const [requests, setRequests] =
    useState<OwnershipRequest[]>([]);

  const [businesses, setBusinesses] =
    useState<Business[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests(
    isRefresh = false
  ) {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [
        requestsResponse,
        businessesResponse,
      ] = await Promise.all([
        fetch("/api/owner/requests", {
          cache: "no-store",
        }),
        fetch("/api/owner/businesses", {
          cache: "no-store",
        }),
      ]);

      const requestsResult =
        await requestsResponse.json();

      const businessesResult =
        await businessesResponse.json();

      if (
        !requestsResponse.ok ||
        !requestsResult.success
      ) {
        setError(
          requestsResult.message ??
            "تعذر تحميل الطلبات"
        );

        return;
      }

      setRequests(
        requestsResult.data ?? []
      );

      if (
        businessesResponse.ok &&
        businessesResult.success
      ) {
        setBusinesses(
          businessesResult.data ?? []
        );
      }
    } catch (error) {
      console.error(
        "Owner requests:",
        error
      );

      setError(
        "حدث خطأ أثناء تحميل الطلبات"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
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
      return (
        <CheckCircle2 className="h-4 w-4" />
      );
    }

    if (status === "Rejected") {
      return (
        <XCircle className="h-4 w-4" />
      );
    }

    return (
      <Clock3 className="h-4 w-4" />
    );
  }

  function requestTypeLabel(
    type: OwnershipRequest["requestType"]
  ) {
    return type === "Claim"
      ? "طلب إثبات ملكية"
      : "طلب إضافة نشاط";
  }

  function formatDate(
    value: string | null
  ) {
    if (!value) {
      return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleDateString(
      "ar-EG",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
  }

  /*
   * نبحث عن النشاط المرتبط بالطلب.
   *
   * بما أن الـ API الخاص بالطلبات لا يعيد businessId،
   * نربط الطلب بالنشاط عن طريق الاسم.
   *
   * في حالة وجود أكثر من نشاط بنفس الاسم،
   * نأخذ النشاط المعتمد أولاً.
   */
  function findBusinessForRequest(
    request: OwnershipRequest
  ) {
    if (!request.name) {
      return null;
    }

    const sameName =
      businesses.filter(
        (business) =>
          business.name.trim() ===
          request.name?.trim()
      );

    if (!sameName.length) {
      return null;
    }

    return (
      sameName.find(
        (business) =>
          business.status ===
          "Approved"
      ) ??
      sameName[0]
    );
  }

  const statistics = useMemo(() => {
    return {
      total: requests.length,

      pending: requests.filter(
        (request) =>
          request.status === "Pending"
      ).length,

      approved: requests.filter(
        (request) =>
          request.status === "Approved"
      ).length,

      rejected: requests.filter(
        (request) =>
          request.status === "Rejected"
      ).length,
    };
  }, [requests]);

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-50"
    >
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back */}
        <Link
          href="/owner/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-slate-900"
        >
          <ArrowRight className="h-4 w-4" />
          لوحة صاحب النشاط
        </Link>

        {/* Header */}
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 text-sm font-bold text-sky-600">
              متابعة الطلبات
            </div>

            <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              طلباتي
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
              تابع حالة طلبات إضافة الأنشطة وإثبات الملكية
              الخاصة بحسابك.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                loadRequests(true)
              }
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  refreshing
                    ? "animate-spin"
                    : ""
                }`}
              />
              تحديث
            </button>

            <Link
              href="/owner/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              طلب إضافة نشاط
            </Link>
          </div>
        </div>

        {/* Statistics */}
        {!loading &&
          !error &&
          requests.length > 0 && (
            <div className="mt-8 grid gap-4 sm:grid-cols-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-xs font-bold text-slate-400">
                  إجمالي الطلبات
                </div>

                <div className="mt-2 text-3xl font-black text-slate-900">
                  {statistics.total}
                </div>
              </div>

              <div className="rounded-3xl border border-amber-100 bg-amber-50/60 p-5">
                <div className="text-xs font-bold text-amber-600">
                  قيد المراجعة
                </div>

                <div className="mt-2 text-3xl font-black text-amber-700">
                  {statistics.pending}
                </div>
              </div>

              <div className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-5">
                <div className="text-xs font-bold text-emerald-600">
                  تمت الموافقة
                </div>

                <div className="mt-2 text-3xl font-black text-emerald-700">
                  {statistics.approved}
                </div>
              </div>

              <div className="rounded-3xl border border-rose-100 bg-rose-50/60 p-5">
                <div className="text-xs font-bold text-rose-600">
                  مرفوضة
                </div>

                <div className="mt-2 text-3xl font-black text-rose-700">
                  {statistics.rejected}
                </div>
              </div>
            </div>
          )}

        {/* Loading */}
        {loading && (
          <div className="mt-8 flex min-h-56 items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
              <LoaderCircle className="h-5 w-5 animate-spin" />
              جاري تحميل الطلبات...
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="mt-8 rounded-3xl border border-rose-200 bg-rose-50 p-6">
            <div className="flex items-start gap-3">
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />

              <div>
                <h2 className="font-black text-rose-800">
                  تعذر تحميل الطلبات
                </h2>

                <p className="mt-1 text-sm leading-6 text-rose-700">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    loadRequests(true)
                  }
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-rose-700"
                >
                  <RefreshCw className="h-4 w-4" />
                  المحاولة مرة أخرى
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading &&
          !error &&
          requests.length === 0 && (
            <div className="mt-8 overflow-hidden rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50">
                <Store className="h-8 w-8 text-sky-500" />
              </div>

              <h2 className="mt-5 text-xl font-black text-slate-900">
                لا توجد طلبات حتى الآن
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-500">
                يمكنك إضافة نشاط جديد وإرساله للمراجعة،
                وبعد الموافقة ستتمكن من إدارة بياناته بالكامل.
              </p>

              <Link
                href="/owner/register"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-sky-700"
              >
                <Plus className="h-4 w-4" />
                إضافة نشاط جديد
              </Link>
            </div>
          )}

        {/* Requests */}
        {!loading &&
          !error &&
          requests.length > 0 && (
            <div className="mt-8 space-y-5">
              {requests.map(
                (request) => {
                  const business =
                    findBusinessForRequest(
                      request
                    );

                  return (
                    <article
                      key={request.id}
                      className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm"
                    >
                      {/* Top */}
                      <div className="p-5 sm:p-6">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex min-w-0 items-start gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                              <Store className="h-7 w-7" />
                            </div>

                            <div className="min-w-0">
                              <div className="mb-1 text-xs font-bold text-sky-600">
                                {requestTypeLabel(
                                  request.requestType
                                )}
                              </div>

                              <h2 className="truncate text-lg font-black text-slate-900 sm:text-xl">
                                {request.name ??
                                  "طلب نشاط"}
                              </h2>

                              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                                <span>
                                  طلب رقم #
                                  {request.id}
                                </span>

                                <span>
                                  تاريخ الطلب:{" "}
                                  {formatDate(
                                    request.createdAt
                                  )}
                                </span>
                              </div>

                              {request.reviewedAt && (
                                <div className="mt-1 text-xs text-slate-400">
                                  تمت المراجعة:{" "}
                                  {formatDate(
                                    request.reviewedAt
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div
                            className={`inline-flex shrink-0 items-center gap-2 self-start rounded-full border px-3.5 py-2 text-xs font-black ${statusClass(
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

                        {/* Pending */}
                        {request.status ===
                          "Pending" && (
                          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                            <div className="flex items-start gap-3">
                              <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

                              <div>
                                <h3 className="font-black text-amber-800">
                                  طلبك تحت المراجعة
                                </h3>

                                <p className="mt-1 text-sm leading-7 text-amber-700">
                                  تم استلام طلبك بنجاح،
                                  وسيتم مراجعته من إدارة
                                  قُرب قبل نشر النشاط.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Approved */}
                        {request.status ===
                          "Approved" && (
                          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex items-start gap-3">
                                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

                                <div>
                                  <h3 className="font-black text-emerald-800">
                                    تم اعتماد النشاط
                                  </h3>

                                  <p className="mt-1 text-sm leading-7 text-emerald-700">
                                    يمكنك الآن استكمال بيانات
                                    النشاط وإضافة الخدمات والصور
                                    ومواعيد العمل والعروض.
                                  </p>
                                </div>
                              </div>

                              {business && (
                                <Link
                                  href={`/owner/dashboard/businesses/${business.id}`}
                                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-xs font-black text-white transition hover:bg-emerald-700"
                                >
                                  إدارة النشاط
                                  <ExternalLink className="h-4 w-4" />
                                </Link>
                              )}
                            </div>

                            {!business && (
                              <div className="mt-3 rounded-xl bg-white/70 px-4 py-3 text-xs font-semibold leading-6 text-emerald-700">
                                تمت الموافقة على الطلب.
                                ستظهر خيارات إدارة النشاط
                                بمجرد ارتباط النشاط بحسابك.
                              </div>
                            )}
                          </div>
                        )}

                        {/* Rejected */}
                        {request.status ===
                          "Rejected" && (
                          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4">
                            <div className="flex items-start gap-3">
                              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />

                              <div>
                                <h3 className="font-black text-rose-800">
                                  لم تتم الموافقة على الطلب
                                </h3>

                                {request.notes ? (
                                  <p className="mt-1 text-sm leading-7 text-rose-700">
                                    <span className="font-black">
                                      ملاحظات الإدارة:
                                    </span>{" "}
                                    {request.notes}
                                  </p>
                                ) : (
                                  <p className="mt-1 text-sm leading-7 text-rose-700">
                                    لم يتم تسجيل سبب للرفض.
                                    يمكنك تقديم طلب جديد بالمعلومات
                                    الصحيحة.
                                  </p>
                                )}
                              </div>
                            </div>

                            <Link
                              href="/owner/register"
                              className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-xs font-black text-rose-700 transition hover:bg-rose-50"
                            >
                              <Plus className="h-4 w-4" />
                              تقديم طلب جديد
                            </Link>
                          </div>
                        )}

                        {/* Notes */}
                        {request.notes &&
                          request.status !==
                            "Rejected" && (
                            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                              <div className="text-xs font-black text-slate-500">
                                ملاحظات الإدارة
                              </div>

                              <p className="mt-1 text-sm leading-7 text-slate-600">
                                {request.notes}
                              </p>
                            </div>
                          )}
                      </div>

                      {/* Approved business quick action */}
                      {request.status ===
                        "Approved" &&
                        business && (
                          <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 sm:px-6">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="text-xs text-slate-500">
                                <span className="font-black text-slate-700">
                                  الخطوة التالية:
                                </span>{" "}
                                أكمل ملف النشاط ليظهر بشكل أفضل
                                للزوار.
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <Link
                                  href={`/businesses/${business.id}`}
                                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                                >
                                  عرض النشاط
                                  <ExternalLink className="h-4 w-4" />
                                </Link>

                                <Link
                                  href={`/owner/dashboard/businesses/${business.id}`}
                                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800"
                                >
                                  إدارة النشاط
                                  <ArrowRight className="h-4 w-4" />
                                </Link>
                              </div>
                            </div>
                          </div>
                        )}
                    </article>
                  );
                }
              )}
            </div>
          )}
      </div>
    </div>
  );
}