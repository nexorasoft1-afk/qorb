"use client";

import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Plus,
  Store,
  XCircle,
} from "lucide-react";

import Link from "next/link";
import { useEffect, useState } from "react";

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

export default function OwnerRequestsPage() {
  const [requests, setRequests] =
    useState<
      OwnershipRequest[]
    >([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    try {
      const response =
        await fetch(
          "/api/owner/requests"
        );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        setError(
          result.message ??
            "تعذر تحميل الطلبات"
        );

        return;
      }

      setRequests(
        result.data ?? []
      );
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
        return "bg-emerald-50 text-emerald-700";

      case "Rejected":
        return "bg-rose-50 text-rose-700";

      default:
        return "bg-amber-50 text-amber-700";
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

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900"
        >
          <ArrowRight className="h-4 w-4" />
          الرئيسية
        </Link>

        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 text-sm font-bold text-sky-600">
              طلبات النشاط
            </div>

            <h1 className="text-3xl font-black text-slate-900">
              طلباتي
            </h1>

            <p className="mt-2 text-sm leading-7 text-slate-500">
              تابع حالة طلبات إضافة الأنشطة الخاصة بك.
            </p>
          </div>

          <Link
            href="/owner/register"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white"
          >
            <Plus className="h-4 w-4" />
            طلب إضافة نشاط
          </Link>
        </div>

        {loading && (
          <div className="mt-8 flex min-h-48 items-center justify-center rounded-3xl border border-slate-200 bg-white">
            <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
              <LoaderCircle className="h-5 w-5 animate-spin" />
              جاري تحميل الطلبات...
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="mt-8 rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm font-bold text-rose-700">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          requests.length === 0 && (
            <div className="mt-8 rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center">
              <Store className="mx-auto h-10 w-10 text-slate-300" />

              <h2 className="mt-4 text-lg font-black text-slate-800">
                لا توجد طلبات
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                تقدر ترسل أول طلب لإضافة نشاطك.
              </p>

              <Link
                href="/owner/register"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-bold text-white"
              >
                <Plus className="h-4 w-4" />
                إضافة نشاط
              </Link>
            </div>
          )}

        {!loading &&
          !error &&
          requests.length > 0 && (
            <div className="mt-8 space-y-4">
              {requests.map(
                (request) => (
                  <article
                    key={request.id}
                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                          <Store className="h-6 w-6" />
                        </div>

                        <div>
                          <h2 className="font-black text-slate-900">
                            {request.name ??
                              "طلب نشاط"}
                          </h2>

                          <div className="mt-1 text-xs text-slate-400">
                            طلب رقم #{request.id}
                          </div>

                          <div className="mt-2 text-xs text-slate-500">
                            {new Date(
                              request.createdAt
                            ).toLocaleDateString(
                              "ar-EG"
                            )}
                          </div>
                        </div>
                      </div>

                      <div
                        className={`inline-flex items-center gap-2 self-start rounded-full px-3 py-2 text-xs font-black sm:self-auto ${statusClass(
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

                    {request.notes && (
                      <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-600">
                        {request.notes}
                      </div>
                    )}

                    {request.status ===
                      "Approved" && (
                      <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
                        تمت الموافقة على الطلب.
                        يمكنك الآن إدارة نشاطك من
                        لوحة صاحب النشاط.
                      </div>
                    )}

                    {request.status ===
                      "Rejected" &&
                      request.notes && (
                        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
                          سبب الرفض:{" "}
                          {request.notes}
                        </div>
                      )}
                  </article>
                )
              )}
            </div>
          )}
      </div>
    </div>
  );
}

