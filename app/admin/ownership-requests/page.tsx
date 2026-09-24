"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Building2,
  Check,
  CheckCircle2,
  Clock3,
  Eye,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  Store,
  User,
  X,
  XCircle,
} from "lucide-react";

type OwnershipRequest = {
  id: number;
  userId: number;
  businessId: number | null;

  requestType: "Create" | "Claim";
  status: "Pending" | "Approved" | "Rejected";

  name: string | null;
  description: string | null;

  categoryId: number | null;
  categoryName: string | null;

  subCategoryId: number | null;
  subCategoryName: string | null;

  cityId: number | null;
  cityName: string | null;

  areaId: number | null;
  areaName: string | null;

  address: string | null;
  latitude: string | number | null;
  longitude: string | number | null;

  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  priceRange: string | null;

  notes: string | null;

  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: number | null;

  userName: string;
  userEmail: string | null;
  userPhone: string | null;

  existingBusinessName: string | null;
  existingBusinessOwnerId: number | null;
};

type TabType = "Pending" | "Approved" | "Rejected";

const tabs: {
  value: TabType;
  label: string;
}[] = [
  {
    value: "Pending",
    label: "قيد المراجعة",
  },
  {
    value: "Approved",
    label: "مقبولة",
  },
  {
    value: "Rejected",
    label: "مرفوضة",
  },
];

function formatDate(value: string | null) {
  if (!value) return "—";

  try {
    return new Intl.DateTimeFormat("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function getStatusLabel(status: TabType) {
  switch (status) {
    case "Pending":
      return "قيد المراجعة";
    case "Approved":
      return "مقبول";
    case "Rejected":
      return "مرفوض";
  }
}

function getRequestTypeLabel(type: "Create" | "Claim") {
  return type === "Create"
    ? "إضافة نشاط جديد"
    : "إثبات ملكية نشاط";
}

export default function OwnershipRequestsPage() {
  const [requests, setRequests] = useState<
    OwnershipRequest[]
  >([]);

  const [activeTab, setActiveTab] =
    useState<TabType>("Pending");

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [selectedRequest, setSelectedRequest] =
    useState<OwnershipRequest | null>(null);

  const [rejectRequest, setRejectRequest] =
    useState<OwnershipRequest | null>(null);

  const [rejectReason, setRejectReason] =
    useState("");

  const [processingId, setProcessingId] =
    useState<number | null>(null);

  const [error, setError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  async function loadRequests(showRefresh = false) {
    try {
      setError("");

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch(
        "/api/admin/ownership-requests",
        {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "تعذر تحميل طلبات الملكية"
        );
      }

      setRequests(
        Array.isArray(data.requests)
          ? data.requests
          : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء تحميل الطلبات"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  const filteredRequests = useMemo(() => {
    const normalizedSearch =
      searchTerm.trim().toLowerCase();

    return requests.filter((item) => {
      if (item.status !== activeTab) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const values = [
        item.name,
        item.userName,
        item.userEmail,
        item.userPhone,
        item.phone,
        item.cityName,
        item.areaName,
        item.categoryName,
        item.subCategoryName,
        item.existingBusinessName,
      ];

      return values.some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(normalizedSearch)
      );
    });
  }, [
    requests,
    activeTab,
    searchTerm,
  ]);

  const pendingCount = requests.filter(
    (item) => item.status === "Pending"
  ).length;

  const approvedCount = requests.filter(
    (item) => item.status === "Approved"
  ).length;

  const rejectedCount = requests.filter(
    (item) => item.status === "Rejected"
  ).length;

  async function handleApprove(
    requestItem: OwnershipRequest
  ) {
    if (
      processingId !== null ||
      requestItem.status !== "Pending"
    ) {
      return;
    }

    const confirmed = window.confirm(
      requestItem.requestType === "Create"
        ? `هل تريد اعتماد طلب إضافة "${requestItem.name}" وإنشاء النشاط؟`
        : `هل تريد اعتماد ملكية "${requestItem.existingBusinessName}" للمستخدم "${requestItem.userName}"؟`
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(requestItem.id);
      setError("");
      setSuccessMessage("");

      const response = await fetch(
        `/api/admin/ownership-requests/${requestItem.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            action: "approve",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "تعذر اعتماد الطلب"
        );
      }

      setSuccessMessage(
        data.message ||
          "تم اعتماد الطلب بنجاح"
      );

      setSelectedRequest(null);

      await loadRequests(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء اعتماد الطلب"
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject() {
    if (
      !rejectRequest ||
      processingId !== null
    ) {
      return;
    }

    const reason = rejectReason.trim();

    if (reason.length < 3) {
      setError(
        "اكتب سببًا واضحًا لرفض الطلب"
      );
      return;
    }

    try {
      setProcessingId(rejectRequest.id);
      setError("");
      setSuccessMessage("");

      const response = await fetch(
        `/api/admin/ownership-requests/${rejectRequest.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            action: "reject",
            reason,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "تعذر رفض الطلب"
        );
      }

      setSuccessMessage(
        data.message ||
          "تم رفض الطلب"
      );

      setRejectRequest(null);
      setRejectReason("");
      setSelectedRequest(null);

      await loadRequests(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء رفض الطلب"
      );
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-50"
    >
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
                  <Building2 size={24} />
                </div>

                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    طلبات ملكية الأنشطة
                  </h1>

                  <p className="mt-1 text-sm text-slate-500">
                    مراجعة طلبات إضافة الأنشطة وإثبات ملكيتها
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => loadRequests(true)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={18}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />
              تحديث
            </button>
          </div>
        </div>

        {/* ================================================= */}
        {/* ALERTS */}
        {/* ================================================= */}

        {successMessage && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
            <CheckCircle2
              size={20}
              className="mt-0.5 shrink-0"
            />

            <div className="text-sm font-medium">
              {successMessage}
            </div>

            <button
              type="button"
              onClick={() =>
                setSuccessMessage("")
              }
              className="mr-auto rounded-lg p-1 hover:bg-emerald-100"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0"
            />

            <div className="text-sm font-medium">
              {error}
            </div>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="mr-auto rounded-lg p-1 hover:bg-red-100"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* ================================================= */}
        {/* SUMMARY */}
        {/* ================================================= */}

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  قيد المراجعة
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {pendingCount}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <Clock3 size={22} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  مقبولة
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {approvedCount}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 size={22} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  مرفوضة
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {rejectedCount}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-700">
                <XCircle size={22} />
              </div>
            </div>
          </div>
        </div>

        {/* ================================================= */}
        {/* FILTERS */}
        {/* ================================================= */}

        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => {
                const count =
                  tab.value === "Pending"
                    ? pendingCount
                    : tab.value ===
                        "Approved"
                      ? approvedCount
                      : rejectedCount;

                const active =
                  activeTab === tab.value;

                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() =>
                      setActiveTab(
                        tab.value
                      )
                    }
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                      active
                        ? "bg-slate-900 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {tab.label}

                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        active
                          ? "bg-white/15 text-white"
                          : "bg-white text-slate-600"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="relative w-full lg:max-w-sm">
              <Search
                size={18}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
                placeholder="ابحث باسم النشاط أو المستخدم..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-10 pl-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* ================================================= */}
        {/* CONTENT */}
        {/* ================================================= */}

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Store size={30} />
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-800">
              لا توجد طلبات
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              لا توجد طلبات ضمن الحالة أو البحث الحالي.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {filteredRequests.map(
              (item) => {
                const isProcessing =
                  processingId ===
                  item.id;

                const hasAnotherOwner =
                  item.requestType ===
                    "Claim" &&
                  item.existingBusinessOwnerId !==
                    null &&
                  item.existingBusinessOwnerId !==
                    item.userId;

                return (
                  <div
                    key={item.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="border-b border-slate-100 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
                                item.requestType ===
                                "Create"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-violet-100 text-violet-700"
                              }`}
                            >
                              {getRequestTypeLabel(
                                item.requestType
                              )}
                            </span>

                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
                                item.status ===
                                "Pending"
                                  ? "bg-amber-100 text-amber-700"
                                  : item.status ===
                                      "Approved"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-red-100 text-red-700"
                              }`}
                            >
                              {getStatusLabel(
                                item.status
                              )}
                            </span>
                          </div>

                          <h2 className="truncate text-lg font-bold text-slate-900">
                            {item.requestType ===
                            "Create"
                              ? item.name ||
                                "نشاط بدون اسم"
                              : item.existingBusinessName ||
                                item.name ||
                                "نشاط غير محدد"}
                          </h2>

                          <p className="mt-1 text-xs text-slate-400">
                            رقم الطلب: #
                            {item.id}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setSelectedRequest(
                              item
                            )
                          }
                          className="shrink-0 rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:bg-slate-50"
                          title="عرض التفاصيل"
                        >
                          <Eye
                            size={19}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 p-5">
                      <div className="flex items-start gap-3">
                        <User
                          size={18}
                          className="mt-0.5 shrink-0 text-slate-400"
                        />

                        <div className="min-w-0">
                          <p className="text-xs text-slate-400">
                            مقدم الطلب
                          </p>

                          <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                            {item.userName}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <MapPin
                          size={18}
                          className="mt-0.5 shrink-0 text-slate-400"
                        />

                        <div className="min-w-0">
                          <p className="text-xs text-slate-400">
                            الموقع
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-800">
                            {[
                              item.areaName,
                              item.cityName,
                            ]
                              .filter(
                                Boolean
                              )
                              .join(
                                "، "
                              ) ||
                              "غير محدد"}
                          </p>
                        </div>
                      </div>

                      {item.phone && (
                        <div className="flex items-start gap-3">
                          <Phone
                            size={18}
                            className="mt-0.5 shrink-0 text-slate-400"
                          />

                          <div>
                            <p className="text-xs text-slate-400">
                              الهاتف
                            </p>

                            <p
                              dir="ltr"
                              className="mt-1 text-sm font-semibold text-slate-800"
                            >
                              {item.phone}
                            </p>
                          </div>
                        </div>
                      )}

                      {hasAnotherOwner && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                          هذا النشاط مرتبط بمالك آخر حاليًا، ولن يمكن اعتماد طلب الملكية.
                        </div>
                      )}

                      <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                        <span className="text-xs text-slate-400">
                          {formatDate(
                            item.createdAt
                          )}
                        </span>

                        {item.status ===
                          "Pending" && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setRejectRequest(
                                  item
                                )
                              }
                              disabled={
                                isProcessing
                              }
                              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <X
                                size={16}
                              />
                              رفض
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleApprove(
                                  item
                                )
                              }
                              disabled={
                                isProcessing ||
                                hasAnotherOwner
                              }
                              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isProcessing ? (
                                <RefreshCw
                                  size={16}
                                  className="animate-spin"
                                />
                              ) : (
                                <Check
                                  size={16}
                                />
                              )}

                              اعتماد
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>

      {/* =================================================== */}
      {/* DETAILS MODAL */}
      {/* =================================================== */}

      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  تفاصيل الطلب #
                  {selectedRequest.id}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {getRequestTypeLabel(
                    selectedRequest.requestType
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedRequest(
                    null
                  )
                }
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <X size={22} />
              </button>
            </div>

            <div className="max-h-[calc(90vh-80px)] overflow-y-auto p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <InfoBox
                  label="اسم المستخدم"
                  value={
                    selectedRequest.userName
                  }
                />

                <InfoBox
                  label="البريد الإلكتروني"
                  value={
                    selectedRequest.userEmail
                  }
                />

                <InfoBox
                  label="هاتف المستخدم"
                  value={
                    selectedRequest.userPhone
                  }
                  ltr
                />

                <InfoBox
                  label="نوع الطلب"
                  value={getRequestTypeLabel(
                    selectedRequest.requestType
                  )}
                />

                <InfoBox
                  label="النشاط"
                  value={
                    selectedRequest.requestType ===
                    "Claim"
                      ? selectedRequest.existingBusinessName
                      : selectedRequest.name
                  }
                />

                <InfoBox
                  label="التصنيف"
                  value={
                    selectedRequest.categoryName
                  }
                />

                <InfoBox
                  label="التصنيف الفرعي"
                  value={
                    selectedRequest.subCategoryName
                  }
                />

                <InfoBox
                  label="المحافظة"
                  value={
                    selectedRequest.cityName
                      ? "جنوب سيناء"
                      : null
                  }
                />

                <InfoBox
                  label="المدينة"
                  value={
                    selectedRequest.cityName
                  }
                />

                <InfoBox
                  label="المنطقة"
                  value={
                    selectedRequest.areaName
                  }
                />

                <InfoBox
                  label="الهاتف"
                  value={
                    selectedRequest.phone
                  }
                  ltr
                />

                <InfoBox
                  label="واتساب"
                  value={
                    selectedRequest.whatsapp
                  }
                  ltr
                />

                <InfoBox
                  label="نطاق السعر"
                  value={
                    selectedRequest.priceRange
                  }
                />

                <InfoBox
                  label="تاريخ الطلب"
                  value={formatDate(
                    selectedRequest.createdAt
                  )}
                />
              </div>

              {selectedRequest.address && (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-400">
                    العنوان
                  </p>

                  <p className="mt-2 text-sm font-semibold leading-7 text-slate-800">
                    {selectedRequest.address}
                  </p>
                </div>
              )}

              {selectedRequest.description && (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-400">
                    وصف النشاط
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {
                      selectedRequest.description
                    }
                  </p>
                </div>
              )}

              {selectedRequest.notes && (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-400">
                    الملاحظات
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {selectedRequest.notes}
                  </p>
                </div>
              )}

              {(selectedRequest.latitude !==
                null ||
                selectedRequest.longitude !==
                  null) && (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-400">
                    الإحداثيات
                  </p>

                  <p
                    dir="ltr"
                    className="mt-2 text-sm font-semibold text-slate-800"
                  >
                    {selectedRequest.latitude ??
                      "—"}{" "}
                    ,{" "}
                    {selectedRequest.longitude ??
                      "—"}
                  </p>
                </div>
              )}

              {selectedRequest.reviewedAt && (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-400">
                    تمت المراجعة في
                  </p>

                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    {formatDate(
                      selectedRequest.reviewedAt
                    )}
                  </p>
                </div>
              )}

              {selectedRequest.status ===
                "Pending" && (
                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      setRejectRequest(
                        selectedRequest
                      )
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50"
                  >
                    <X size={17} />
                    رفض الطلب
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleApprove(
                        selectedRequest
                      )
                    }
                    disabled={
                      selectedRequest.requestType ===
                        "Claim" &&
                      selectedRequest.existingBusinessOwnerId !==
                        null &&
                      selectedRequest.existingBusinessOwnerId !==
                        selectedRequest.userId
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Check size={17} />
                    اعتماد الطلب
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================== */}
      {/* REJECT MODAL */}
      {/* =================================================== */}

      {rejectRequest && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    رفض الطلب
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    الطلب #
                    {rejectRequest.id}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setRejectRequest(
                      null
                    );
                    setRejectReason(
                      ""
                    );
                  }}
                  className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100"
                >
                  <X size={21} />
                </button>
              </div>
            </div>

            <div className="p-5">
              <div className="mb-4 rounded-2xl bg-slate-50 p-4">
                <p className="text-xs text-slate-400">
                  النشاط
                </p>

                <p className="mt-1 font-bold text-slate-800">
                  {rejectRequest.requestType ===
                  "Claim"
                    ? rejectRequest.existingBusinessName ||
                      rejectRequest.name ||
                      "غير محدد"
                    : rejectRequest.name ||
                      "غير محدد"}
                </p>
              </div>

              <label className="mb-2 block text-sm font-bold text-slate-700">
                سبب الرفض
              </label>

              <textarea
                value={rejectReason}
                onChange={(event) =>
                  setRejectReason(
                    event.target.value
                  )
                }
                rows={5}
                maxLength={3000}
                placeholder="اكتب سبب رفض الطلب..."
                className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
              />

              <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setRejectRequest(
                      null
                    );
                    setRejectReason(
                      ""
                    );
                  }}
                  disabled={
                    processingId !== null
                  }
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  إلغاء
                </button>

                <button
                  type="button"
                  onClick={
                    handleReject
                  }
                  disabled={
                    processingId !== null ||
                    rejectReason.trim()
                      .length < 3
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processingId !==
                  null ? (
                    <RefreshCw
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <XCircle size={17} />
                  )}

                  تأكيد الرفض
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoBox({
  label,
  value,
  ltr = false,
}: {
  label: string;
  value: string | number | null;
  ltr?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium text-slate-400">
        {label}
      </p>

      <p
        dir={ltr ? "ltr" : "rtl"}
        className={`mt-2 text-sm font-semibold text-slate-800 ${
          ltr ? "text-right" : ""
        }`}
      >
        {value ?? "غير متوفر"}
      </p>
    </div>
  );
}