"use client";

import {
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Clock3,
  Edit3,
  ExternalLink,
  Loader2,
  Menu,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
  Wrench,
  CircleDollarSign,
  Power,
} from "lucide-react";

// =========================================================
// Types
// =========================================================

interface Service {
  id: number;
  businessId: number;
  name: string;
  description: string | null;
  price: string | number | null;
  durationMinutes: number | null;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
}

interface BusinessInfo {
  id: number;
  name: string;
  status?: string;
}

interface ApiResponse {
  success?: boolean;
  error?: string;
  message?: string;
  business?: BusinessInfo;
  services?: Service[];
  data?: Service[] | Service;
  service?: Service;
}

interface FormState {
  name: string;
  description: string;
  price: string;
  durationMinutes: string;
  sortOrder: string;
  isActive: boolean;
}

type ToastType = "success" | "error";

interface ToastState {
  type: ToastType;
  message: string;
}

// =========================================================
// Constants
// =========================================================

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  price: "",
  durationMinutes: "",
  sortOrder: "0",
  isActive: true,
};

const NAV_ITEMS = [
  {
    label: "البيانات الأساسية",
    hrefKey: "basic",
  },
  {
    label: "الخدمات",
    hrefKey: "services",
  },
  {
    label: "الصور",
    hrefKey: "images",
  },
  {
    label: "مواعيد العمل",
    hrefKey: "hours",
  },
  {
    label: "العروض",
    hrefKey: "offers",
  },
  {
    label: "الفعاليات",
    hrefKey: "events",
  },
  {
    label: "التحليلات",
    hrefKey: "analytics",
  },
];

// =========================================================
// Helpers
// =========================================================

function formatPrice(
  price: string | number | null
): string {
  if (
    price === null ||
    price === undefined ||
    price === ""
  ) {
    return "السعر عند الطلب";
  }

  const value = Number(price);

  if (!Number.isFinite(value)) {
    return String(price);
  }

  return new Intl.NumberFormat("ar-EG", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDuration(
  minutes: number | null
): string {
  if (!minutes) {
    return "المدة غير محددة";
  }

  if (minutes < 60) {
    return `${minutes} دقيقة`;
  }

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  if (remaining === 0) {
    return hours === 1
      ? "ساعة"
      : `${hours} ساعات`;
  }

  return `${hours} ساعة و ${remaining} دقيقة`;
}

function normalizeServices(
  data: ApiResponse
): Service[] {
  if (Array.isArray(data.services)) {
    return data.services;
  }

  if (Array.isArray(data.data)) {
    return data.data as Service[];
  }

  return [];
}

// =========================================================
// Page
// =========================================================

export default function ServicesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const router = useRouter();

  const [services, setServices] = useState<Service[]>(
    []
  );

  const [business, setBusiness] =
    useState<BusinessInfo | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] =
    useState<number | null>(null);
  const [togglingId, setTogglingId] =
    useState<number | null>(null);
  const [movingId, setMovingId] =
    useState<number | null>(null);

  const [showForm, setShowForm] =
    useState(false);

  const [editingService, setEditingService] =
    useState<Service | null>(null);

  const [form, setForm] =
    useState<FormState>(EMPTY_FORM);

  const [toast, setToast] =
    useState<ToastState | null>(null);

  // =======================================================
  // Toast
  // =======================================================

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 3500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [toast]);

  // =======================================================
  // Load
  // =======================================================

  const loadServices = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoading(true);
      }

      try {
        const response = await fetch(
          `/api/owner/businesses/${id}/services`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data: ApiResponse =
          await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.error ||
              "تعذر تحميل الخدمات"
          );
        }

        const loadedServices =
          normalizeServices(data).sort(
            (a, b) =>
              Number(a.sortOrder) -
                Number(b.sortOrder) ||
              Number(a.id) -
                Number(b.id)
          );

        setServices(loadedServices);

        if (data.business) {
          setBusiness(data.business);
        }
      } catch (error) {
        console.error(error);

        setToast({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "حدث خطأ أثناء تحميل الخدمات",
        });
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [id]
  );

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  // =======================================================
  // Derived
  // =======================================================

  const activeCount = useMemo(
    () =>
      services.filter(
        (service) => service.isActive
      ).length,
    [services]
  );

  const inactiveCount = useMemo(
    () =>
      services.filter(
        (service) => !service.isActive
      ).length,
    [services]
  );

  // =======================================================
  // Form helpers
  // =======================================================

  const openAddForm = () => {
    const nextSort =
      services.length > 0
        ? Math.max(
            ...services.map((service) =>
              Number(service.sortOrder)
            )
          ) + 1
        : 0;

    setEditingService(null);

    setForm({
      ...EMPTY_FORM,
      sortOrder: String(nextSort),
    });

    setShowForm(true);
  };

  const openEditForm = (
    service: Service
  ) => {
    setEditingService(service);

    setForm({
      name: service.name || "",
      description:
        service.description || "",
      price:
        service.price === null ||
        service.price === undefined
          ? ""
          : String(service.price),
      durationMinutes:
        service.durationMinutes === null ||
        service.durationMinutes === undefined
          ? ""
          : String(service.durationMinutes),
      sortOrder: String(
        service.sortOrder ?? 0
      ),
      isActive: Boolean(
        service.isActive
      ),
    });

    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingService(null);
    setForm(EMPTY_FORM);
  };

  const updateForm = (
    key: keyof FormState,
    value: string | boolean
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  // =======================================================
  // Save service
  // =======================================================

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const name = form.name.trim();

    if (!name) {
      setToast({
        type: "error",
        message: "اكتب اسم الخدمة أولًا",
      });
      return;
    }

    const price =
      form.price.trim() === ""
        ? null
        : Number(form.price);

    if (
      price !== null &&
      (!Number.isFinite(price) || price < 0)
    ) {
      setToast({
        type: "error",
        message:
          "السعر يجب أن يكون رقمًا صحيحًا أو عشريًا أكبر من أو يساوي صفر",
      });
      return;
    }

    const duration =
      form.durationMinutes.trim() === ""
        ? null
        : Number(form.durationMinutes);

    if (
      duration !== null &&
      (!Number.isInteger(duration) ||
        duration <= 0 ||
        duration > 1440)
    ) {
      setToast({
        type: "error",
        message:
          "مدة الخدمة يجب أن تكون رقمًا صحيحًا بين 1 و1440 دقيقة",
      });
      return;
    }

    const sortOrder = Number(
      form.sortOrder
    );

    if (
      !Number.isInteger(sortOrder) ||
      sortOrder < 0
    ) {
      setToast({
        type: "error",
        message:
          "ترتيب الخدمة يجب أن يكون رقمًا صحيحًا يبدأ من صفر",
      });
      return;
    }

    setSaving(true);

    try {
      const isEditing =
        editingService !== null;

      const url = isEditing
        ? `/api/owner/businesses/${id}/services/${editingService.id}`
        : `/api/owner/businesses/${id}/services`;

      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description:
            form.description.trim() || null,
          price,
          durationMinutes: duration,
          sortOrder,
          isActive: form.isActive,
        }),
      });

      const data: ApiResponse =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            (isEditing
              ? "تعذر تحديث الخدمة"
              : "تعذر إضافة الخدمة")
        );
      }

      const returnedService =
        data.service ||
        (data.data &&
        !Array.isArray(data.data)
          ? (data.data as Service)
          : null);

      if (returnedService) {
        setServices((current) => {
          const next = isEditing
            ? current.map((service) =>
                service.id ===
                returnedService.id
                  ? returnedService
                  : service
              )
            : [
                ...current,
                returnedService,
              ];

          return next.sort(
            (a, b) =>
              Number(a.sortOrder) -
                Number(b.sortOrder) ||
              Number(a.id) -
                Number(b.id)
          );
        });
      } else {
        await loadServices(true);
      }

      setToast({
        type: "success",
        message: isEditing
          ? "تم تحديث الخدمة بنجاح"
          : "تمت إضافة الخدمة بنجاح",
      });

      closeForm();
    } catch (error) {
      console.error(error);

      setToast({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء حفظ الخدمة",
      });
    } finally {
      setSaving(false);
    }
  };

  // =======================================================
  // Toggle active
  // =======================================================

  const handleToggleActive = async (
    service: Service
  ) => {
    if (togglingId !== null) return;

    setTogglingId(service.id);

    try {
      const response = await fetch(
        `/api/owner/businesses/${id}/services/${service.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isActive: !service.isActive,
          }),
        }
      );

      const data: ApiResponse =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "تعذر تغيير حالة الخدمة"
        );
      }

      const updated =
        data.service ||
        (data.data &&
        !Array.isArray(data.data)
          ? (data.data as Service)
          : null);

      if (updated) {
        setServices((current) =>
          current.map((item) =>
            item.id === updated.id
              ? updated
              : item
          )
        );
      } else {
        setServices((current) =>
          current.map((item) =>
            item.id === service.id
              ? {
                  ...item,
                  isActive:
                    !item.isActive,
                }
              : item
          )
        );
      }

      setToast({
        type: "success",
        message: service.isActive
          ? "تم إيقاف الخدمة"
          : "تم تفعيل الخدمة",
      });
    } catch (error) {
      console.error(error);

      setToast({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء تحديث حالة الخدمة",
      });
    } finally {
      setTogglingId(null);
    }
  };

  // =======================================================
  // Delete
  // =======================================================

  const handleDelete = async (
    service: Service
  ) => {
    const confirmed =
      window.confirm(
        `هل أنت متأكد من حذف خدمة "${service.name}"؟\n\nلا يمكن التراجع عن هذا الإجراء.`
      );

    if (!confirmed) return;

    setDeletingId(service.id);

    try {
      const response = await fetch(
        `/api/owner/businesses/${id}/services/${service.id}`,
        {
          method: "DELETE",
        }
      );

      const data: ApiResponse =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "تعذر حذف الخدمة"
        );
      }

      setServices((current) =>
        current.filter(
          (item) =>
            item.id !== service.id
        )
      );

      setToast({
        type: "success",
        message: "تم حذف الخدمة بنجاح",
      });
    } catch (error) {
      console.error(error);

      setToast({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء حذف الخدمة",
      });
    } finally {
      setDeletingId(null);
    }
  };

  // =======================================================
  // Move order
  // =======================================================

  const moveService = async (
    serviceId: number,
    direction: "up" | "down"
  ) => {
    if (movingId !== null) return;

    const sorted = [...services].sort(
      (a, b) =>
        Number(a.sortOrder) -
          Number(b.sortOrder) ||
        Number(a.id) -
          Number(b.id)
    );

    const currentIndex =
      sorted.findIndex(
        (service) =>
          service.id === serviceId
      );

    if (currentIndex === -1) return;

    const targetIndex =
      direction === "up"
        ? currentIndex - 1
        : currentIndex + 1;

    if (
      targetIndex < 0 ||
      targetIndex >= sorted.length
    ) {
      return;
    }

    const current =
      sorted[currentIndex];
    const target =
      sorted[targetIndex];

    setMovingId(serviceId);

    try {
      const currentSort =
        Number(current.sortOrder);

      const targetSort =
        Number(target.sortOrder);

      const [firstResponse, secondResponse] =
        await Promise.all([
          fetch(
            `/api/owner/businesses/${id}/services/${current.id}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                sortOrder: targetSort,
              }),
            }
          ),
          fetch(
            `/api/owner/businesses/${id}/services/${target.id}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                sortOrder: currentSort,
              }),
            }
          ),
        ]);

      const [firstData, secondData] =
        await Promise.all([
          firstResponse.json(),
          secondResponse.json(),
        ]);

      if (
        !firstResponse.ok ||
        !firstData.success
      ) {
        throw new Error(
          firstData.error ||
            "تعذر تحديث ترتيب الخدمة"
        );
      }

      if (
        !secondResponse.ok ||
        !secondData.success
      ) {
        throw new Error(
          secondData.error ||
            "تعذر تحديث ترتيب الخدمة"
        );
      }

      await loadServices(true);

      setToast({
        type: "success",
        message:
          direction === "up"
            ? "تم رفع الخدمة للأعلى"
            : "تم نقل الخدمة للأسفل",
      });
    } catch (error) {
      console.error(error);

      await loadServices(true);

      setToast({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء ترتيب الخدمات",
      });
    } finally {
      setMovingId(null);
    }
  };

  // =======================================================
  // Loading
  // =======================================================

  if (loading) {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-slate-50"
      >
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4">
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-slate-200 bg-white px-10 py-12 shadow-sm">
            <Loader2 className="h-10 w-10 animate-spin text-sky-600" />
            <p className="text-sm font-medium text-slate-600">
              جاري تحميل خدمات النشاط...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =======================================================
  // Main
  // =======================================================

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-50"
    >
      {/* ===================================================
          Top bar
      =================================================== */}

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/owner/dashboard"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                title="لوحة التحكم"
              >
                <ArrowRight className="h-5 w-5" />
              </Link>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-black text-slate-900 sm:text-2xl">
                    إدارة الخدمات
                  </h1>

                  {business?.name && (
                    <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                      {business.name}
                    </span>
                  )}
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  أضف خدمات نشاطك وحدد أسعارها ومدتها وترتيب ظهورها.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  loadServices()
                }
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <RefreshCw className="h-4 w-4" />
                تحديث
              </button>

              <Link
                href={`/businesses/${id}`}
                target="_blank"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
              >
                <ExternalLink className="h-4 w-4" />
                الصفحة العامة
              </Link>

              <button
                type="button"
                onClick={openAddForm}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                إضافة خدمة
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ===================================================
          Content
      =================================================== */}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Navigation */}

        <div className="mb-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <nav className="flex min-w-max gap-1">
            {NAV_ITEMS.map((item) => {
              const href =
                item.hrefKey === "basic"
                  ? `/owner/dashboard/businesses/${id}`
                  : `/owner/dashboard/businesses/${id}/${item.hrefKey}`;

              const isActive =
                item.hrefKey ===
                "services";

              return (
                <Link
                  key={item.hrefKey}
                  href={href}
                  className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                    isActive
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Stats */}

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  إجمالي الخدمات
                </p>
                <p className="mt-2 text-3xl font-black text-slate-900">
                  {services.length}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <Wrench className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  الخدمات النشطة
                </p>
                <p className="mt-2 text-3xl font-black text-emerald-700">
                  {activeCount}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Check className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  الخدمات المتوقفة
                </p>
                <p className="mt-2 text-3xl font-black text-amber-700">
                  {inactiveCount}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <Power className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Empty */}

        {services.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-sky-50 text-sky-600">
              <Wrench className="h-9 w-9" />
            </div>

            <h2 className="mt-6 text-xl font-black text-slate-900">
              لا توجد خدمات مضافة حتى الآن
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-slate-500">
              أضف الخدمات التي يقدمها نشاطك حتى تظهر للعملاء بطريقة واضحة ومنظمة.
            </p>

            <button
              type="button"
              onClick={openAddForm}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              إضافة أول خدمة
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {services.map(
              (service, index) => {
                return (
                  <article
                    key={service.id}
                    className={`overflow-hidden rounded-3xl border bg-white shadow-sm transition ${
                      service.isActive
                        ? "border-slate-200"
                        : "border-slate-200 opacity-90"
                    }`}
                  >
                    <div className="p-5 sm:p-6">
                      <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
                        {/* Number / handle */}

                        <div className="flex items-center gap-3 xl:w-32 xl:flex-col xl:justify-center">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-lg font-black text-slate-700">
                            {index + 1}
                          </div>

                          <div className="flex flex-col gap-1 sm:flex-row xl:flex-col">
                            <button
                              type="button"
                              disabled={
                                index === 0 ||
                                movingId !== null
                              }
                              onClick={() =>
                                moveService(
                                  service.id,
                                  "up"
                                )
                              }
                              className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {movingId ===
                              service.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <ChevronUp className="h-3.5 w-3.5" />
                              )}
                              لأعلى
                            </button>

                            <button
                              type="button"
                              disabled={
                                index ===
                                  services.length -
                                    1 ||
                                movingId !== null
                              }
                              onClick={() =>
                                moveService(
                                  service.id,
                                  "down"
                                )
                              }
                              className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {movingId ===
                              service.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5" />
                              )}
                              لأسفل
                            </button>
                          </div>
                        </div>

                        {/* Main */}

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h2 className="break-words text-lg font-black text-slate-900 sm:text-xl">
                                  {service.name}
                                </h2>

                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                                    service.isActive
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {service.isActive
                                    ? "نشطة"
                                    : "متوقفة"}
                                </span>
                              </div>

                              {service.description && (
                                <p className="mt-2 max-w-3xl whitespace-pre-line text-sm leading-7 text-slate-500">
                                  {
                                    service.description
                                  }
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="rounded-2xl bg-slate-50 p-4">
                              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                <CircleDollarSign className="h-4 w-4" />
                                السعر
                              </div>

                              <p className="mt-2 text-base font-black text-slate-900">
                                {formatPrice(
                                  service.price
                                )}
                              </p>
                            </div>

                            <div className="rounded-2xl bg-slate-50 p-4">
                              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                <Clock3 className="h-4 w-4" />
                                المدة
                              </div>

                              <p className="mt-2 text-base font-black text-slate-900">
                                {formatDuration(
                                  service.durationMinutes
                                )}
                              </p>
                            </div>

                            <div className="rounded-2xl bg-slate-50 p-4">
                              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                <Menu className="h-4 w-4" />
                                ترتيب الظهور
                              </div>

                              <p className="mt-2 text-base font-black text-slate-900">
                                {service.sortOrder}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}

                        <div className="flex flex-wrap items-center gap-2 xl:w-52 xl:flex-col xl:items-stretch">
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleActive(
                                service
                              )
                            }
                            disabled={
                              togglingId ===
                              service.id
                            }
                            className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 xl:flex-none ${
                              service.isActive
                                ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                          >
                            {togglingId ===
                            service.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Power className="h-4 w-4" />
                            )}

                            {service.isActive
                              ? "إيقاف الخدمة"
                              : "تفعيل الخدمة"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openEditForm(
                                service
                              )
                            }
                            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 xl:flex-none"
                          >
                            <Edit3 className="h-4 w-4" />
                            تعديل
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                service
                              )
                            }
                            disabled={
                              deletingId ===
                              service.id
                            }
                            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 xl:flex-none"
                          >
                            {deletingId ===
                            service.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            حذف
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </main>

      {/* ===================================================
          Modal
      =================================================== */}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
            onClick={closeForm}
          />

          <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  {editingService
                    ? "تعديل الخدمة"
                    : "إضافة خدمة جديدة"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  أدخل البيانات التي تريد ظهورها للعملاء.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
                title="إغلاق"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-5 sm:p-6"
            >
              {/* Name */}

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  اسم الخدمة
                  <span className="mr-1 text-rose-500">
                    *
                  </span>
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    updateForm(
                      "name",
                      event.target.value
                    )
                  }
                  maxLength={200}
                  placeholder="مثال: قص شعر رجالي"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-50"
                  autoFocus
                />
              </div>

              {/* Description */}

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  وصف الخدمة
                </label>

                <textarea
                  value={form.description}
                  onChange={(event) =>
                    updateForm(
                      "description",
                      event.target.value
                    )
                  }
                  rows={4}
                  placeholder="اكتب وصفًا مختصرًا وواضحًا للخدمة..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium leading-7 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-50"
                />
              </div>

              {/* Price / Duration */}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    السعر
                  </label>

                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={(event) =>
                        updateForm(
                          "price",
                          event.target.value
                        )
                      }
                      placeholder="مثال: 150"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pl-16 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-50"
                    />

                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      جنيه
                    </span>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    مدة الخدمة بالدقائق
                  </label>

                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="1440"
                      step="1"
                      value={
                        form.durationMinutes
                      }
                      onChange={(event) =>
                        updateForm(
                          "durationMinutes",
                          event.target.value
                        )
                      }
                      placeholder="مثال: 45"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pl-16 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-50"
                    />

                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      دقيقة
                    </span>
                  </div>
                </div>
              </div>

              {/* Sort + Active */}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    ترتيب الظهور
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={
                      form.sortOrder
                    }
                    onChange={(event) =>
                      updateForm(
                        "sortOrder",
                        event.target.value
                      )
                    }
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-50"
                  />

                  <p className="mt-2 text-xs text-slate-400">
                    الرقم الأصغر يظهر أولًا.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    حالة الخدمة
                  </label>

                  <button
                    type="button"
                    onClick={() =>
                      updateForm(
                        "isActive",
                        !form.isActive
                      )
                    }
                    className={`flex h-12 w-full items-center justify-between rounded-xl border px-4 transition ${
                      form.isActive
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <span
                      className={`text-sm font-bold ${
                        form.isActive
                          ? "text-emerald-700"
                          : "text-slate-600"
                      }`}
                    >
                      {form.isActive
                        ? "الخدمة نشطة"
                        : "الخدمة متوقفة"}
                    </span>

                    <span
                      className={`relative h-7 w-12 rounded-full transition ${
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
                </div>
              </div>

              {/* Footer */}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-7 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      {editingService ? (
                        <Save className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}

                      {editingService
                        ? "حفظ التعديلات"
                        : "إضافة الخدمة"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================
          Toast
      =================================================== */}

      {toast && (
        <div className="fixed bottom-5 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2">
          <div
            className={`flex items-start gap-3 rounded-2xl border bg-white px-4 py-4 shadow-2xl ${
              toast.type === "success"
                ? "border-emerald-200"
                : "border-rose-200"
            }`}
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
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

            <div className="min-w-0 flex-1 pt-1">
              <p
                className={`text-sm font-bold ${
                  toast.type ===
                  "success"
                    ? "text-emerald-800"
                    : "text-rose-800"
                }`}
              >
                {toast.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setToast(null)
              }
              className="text-slate-400 transition hover:text-slate-600"
              title="إغلاق"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

