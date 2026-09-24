"use client";

import {
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Crown,
  ExternalLink,
  ImagePlus,
  Images,
  Loader2,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from "lucide-react";

// =========================================================
// Types
// =========================================================

interface BusinessInfo {
  id: number;
  name: string;
  status?: string;
}

interface BusinessImage {
  id: number;
  businessId: number;
  imageUrl?: string | null;
  url: string;
  mimeType?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  isCover: boolean;
  sortOrder: number;
  createdAt?: string;
}

interface ApiResponse {
  success?: boolean;
  error?: string;
  message?: string;
  business?: BusinessInfo;
  images?: BusinessImage[];
  image?: BusinessImage;
  data?:
    | BusinessImage[]
    | BusinessImage;
}

interface PreviewFile {
  key: string;
  file: File;
  previewUrl: string;
  isCover: boolean;
  uploading: boolean;
  uploaded: boolean;
  error?: string;
}

// =========================================================
// Constants
// =========================================================

const MAX_FILE_SIZE = 8 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

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

function formatFileSize(
  bytes: number | null | undefined
): string {
  if (!bytes || bytes <= 0) {
    return "الحجم غير محدد";
  }

  if (bytes < 1024) {
    return `${bytes} بايت`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} ك.ب`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} م.ب`;
}

function getErrorMessage(
  error: unknown,
  fallback: string
): string {
  return error instanceof Error
    ? error.message
    : fallback;
}

// =========================================================
// Page
// =========================================================

export default function ImagesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  const [business, setBusiness] =
    useState<BusinessInfo | null>(null);

  const [images, setImages] =
    useState<BusinessImage[]>([]);

  const [selectedFiles, setSelectedFiles] =
    useState<PreviewFile[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [uploading, setUploading] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const [coverId, setCoverId] =
    useState<number | null>(null);

  const [movingId, setMovingId] =
    useState<number | null>(null);

  const [dragActive, setDragActive] =
    useState(false);

  const [toast, setToast] =
    useState<{
      type: "success" | "error";
      message: string;
    } | null>(null);

  // =======================================================
  // Toast
  // =======================================================

  useEffect(() => {
    if (!toast) return;

    const timer =
      window.setTimeout(() => {
        setToast(null);
      }, 3500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [toast]);

  // =======================================================
  // Cleanup preview URLs
  // =======================================================

  useEffect(() => {
    return () => {
      selectedFiles.forEach(
        (item) => {
          URL.revokeObjectURL(
            item.previewUrl
          );
        }
      );
    };
  }, [selectedFiles]);

  // =======================================================
  // Load images
  // =======================================================

  const loadImages = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoading(true);
      }

      try {
        const response = await fetch(
          `/api/owner/businesses/${id}/images`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data: ApiResponse =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
              "تعذر تحميل صور النشاط"
          );
        }

        const loadedImages =
          Array.isArray(data.images)
            ? data.images
            : Array.isArray(data.data)
            ? (data.data as BusinessImage[])
            : [];

        const sortedImages =
          [...loadedImages].sort(
            (a, b) =>
              Number(a.sortOrder) -
                Number(b.sortOrder) ||
              Number(a.id) -
                Number(b.id)
          );

        setImages(sortedImages);

        if (data.business) {
          setBusiness(data.business);
        }
      } catch (error) {
        console.error(error);

        setToast({
          type: "error",
          message: getErrorMessage(
            error,
            "حدث خطأ أثناء تحميل الصور"
          ),
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
    loadImages();
  }, [loadImages]);

  // =======================================================
  // Derived
  // =======================================================

  const coverImage = useMemo(
    () =>
      images.find(
        (image) => image.isCover
      ) || null,
    [images]
  );

  // =======================================================
  // File validation
  // =======================================================

  const validateFile = (
    file: File
  ): string | null => {
    if (!ALLOWED_TYPES.has(file.type)) {
      return `نوع الملف غير مدعوم: ${file.name}`;
    }

    if (file.size <= 0) {
      return `الملف فارغ: ${file.name}`;
    }

    if (file.size > MAX_FILE_SIZE) {
      return `حجم الصورة أكبر من 8 ميجابايت: ${file.name}`;
    }

    return null;
  };

  // =======================================================
  // Select files
  // =======================================================

  const addFiles = (
    fileList: FileList | File[]
  ) => {
    const incoming =
      Array.from(fileList);

    if (incoming.length === 0) {
      return;
    }

    const next: PreviewFile[] = [];

    for (const file of incoming) {
      const validationError =
        validateFile(file);

      if (validationError) {
        setToast({
          type: "error",
          message: validationError,
        });
        continue;
      }

      const duplicate =
        selectedFiles.some(
          (item) =>
            item.file.name === file.name &&
            item.file.size === file.size &&
            item.file.lastModified ===
              file.lastModified
        );

      if (duplicate) {
        continue;
      }

      const alreadyUploaded =
        images.some(
          (image) =>
            image.fileName === file.name &&
            Number(image.fileSize) ===
              Number(file.size)
        );

      if (alreadyUploaded) {
        setToast({
          type: "error",
          message: `الصورة "${file.name}" موجودة بالفعل في النشاط`,
        });
        continue;
      }

      next.push({
        key: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
        file,
        previewUrl:
          URL.createObjectURL(file),
        isCover:
          images.length === 0 &&
          selectedFiles.length === 0 &&
          next.length === 0,
        uploading: false,
        uploaded: false,
      });
    }

    if (next.length > 0) {
      setSelectedFiles(
        (current) => [
          ...current,
          ...next,
        ]
      );
    }
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files) {
      addFiles(event.target.files);
    }

    event.target.value = "";
  };

  // =======================================================
  // Drag & Drop
  // =======================================================

  const handleDragOver = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);

    if (
      event.dataTransfer.files &&
      event.dataTransfer.files.length > 0
    ) {
      addFiles(
        event.dataTransfer.files
      );
    }
  };

  // =======================================================
  // Remove selected preview
  // =======================================================

  const removeSelectedFile = (
    key: string
  ) => {
    setSelectedFiles(
      (current) => {
        const item =
          current.find(
            (entry) =>
              entry.key === key
          );

        if (item) {
          URL.revokeObjectURL(
            item.previewUrl
          );
        }

        return current.filter(
          (entry) =>
            entry.key !== key
        );
      }
    );
  };

  // =======================================================
  // Upload one file
  // =======================================================

  const uploadOneFile = async (
    item: PreviewFile,
    sortOrder: number,
    forceCover: boolean
  ) => {
    setSelectedFiles(
      (current) =>
        current.map(
          (entry) =>
            entry.key === item.key
              ? {
                  ...entry,
                  uploading: true,
                  error: undefined,
                }
              : entry
        )
    );

    try {
      const formData =
        new FormData();

      formData.append(
        "file",
        item.file
      );

      formData.append(
        "sortOrder",
        String(sortOrder)
      );

      formData.append(
        "isCover",
        String(
          forceCover ||
            item.isCover
        )
      );

      const response = await fetch(
        `/api/owner/businesses/${id}/images`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data: ApiResponse =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "تعذر رفع الصورة"
        );
      }

      const uploaded =
        data.image ||
        (
          data.data &&
          !Array.isArray(data.data)
            ? (data.data as BusinessImage)
            : null
        );

      setSelectedFiles(
        (current) =>
          current.map(
            (entry) =>
              entry.key ===
              item.key
                ? {
                    ...entry,
                    uploading: false,
                    uploaded: true,
                  }
                : entry
          )
      );

      return uploaded || null;
    } catch (error) {
      console.error(error);

      setSelectedFiles(
        (current) =>
          current.map(
            (entry) =>
              entry.key === item.key
                ? {
                    ...entry,
                    uploading: false,
                    uploaded: false,
                    error:
                      getErrorMessage(
                        error,
                        "تعذر رفع الصورة"
                      ),
                  }
                : entry
          )
      );

      throw error;
    }
  };

  // =======================================================
  // Upload all
  // =======================================================

  const handleUploadAll = async () => {
    if (
      uploading ||
      selectedFiles.length === 0
    ) {
      return;
    }

    setUploading(true);

    try {
      let currentImages =
        [...images];

      let nextSort =
        currentImages.length > 0
          ? Math.max(
              ...currentImages.map(
                (image) =>
                  Number(
                    image.sortOrder
                  )
              )
            ) + 1
          : 0;

      let uploadedCount = 0;

      const firstUploadNeedsCover =
        currentImages.length === 0 &&
        !coverImage;

      for (
        const item of selectedFiles
      ) {
        if (item.uploaded) {
          continue;
        }

        const shouldBeCover =
          firstUploadNeedsCover &&
          uploadedCount === 0;

        try {
          const uploaded =
            await uploadOneFile(
              item,
              nextSort,
              shouldBeCover
            );

          if (uploaded) {
            currentImages = [
              ...currentImages,
              uploaded,
            ];

            nextSort += 1;
            uploadedCount += 1;
          }
        } catch {
          // الخطأ تم حفظه على العنصر نفسه
        }
      }

      await loadImages(true);

      setSelectedFiles(
        (current) => {
          current.forEach(
            (item) => {
              URL.revokeObjectURL(
                item.previewUrl
              );
            }
          );

          return [];
        }
      );

      if (uploadedCount > 0) {
        setToast({
          type: "success",
          message: `تم رفع ${uploadedCount} ${
            uploadedCount === 1
              ? "صورة"
              : "صور"
          } بنجاح وحفظها داخل قاعدة البيانات`,
        });
      }
    } catch (error) {
      console.error(error);

      setToast({
        type: "error",
        message: getErrorMessage(
          error,
          "حدث خطأ أثناء رفع الصور"
        ),
      });
    } finally {
      setUploading(false);
    }
  };

  // =======================================================
  // Set cover
  // =======================================================

  const handleSetCover = async (
    image: BusinessImage
  ) => {
    if (coverId !== null) {
      return;
    }

    if (image.isCover) {
      return;
    }

    setCoverId(image.id);

    try {
      const response = await fetch(
        `/api/owner/businesses/${id}/images/${image.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            isCover: true,
          }),
        }
      );

      const data: ApiResponse =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "تعذر تغيير صورة الغلاف"
        );
      }

      setImages(
        (current) =>
          current.map(
            (item) => ({
              ...item,
              isCover:
                item.id ===
                image.id,
            })
          )
      );

      setToast({
        type: "success",
        message:
          "تم تعيين صورة الغلاف بنجاح",
      });
    } catch (error) {
      console.error(error);

      setToast({
        type: "error",
        message: getErrorMessage(
          error,
          "حدث خطأ أثناء تغيير صورة الغلاف"
        ),
      });
    } finally {
      setCoverId(null);
    }
  };

  // =======================================================
  // Delete
  // =======================================================

  const handleDelete = async (
    image: BusinessImage
  ) => {
    const confirmed =
      window.confirm(
        `هل أنت متأكد من حذف الصورة${
          image.fileName
            ? ` "${image.fileName}"`
            : ""
        }؟\n\nلا يمكن التراجع عن هذا الإجراء.`
      );

    if (!confirmed) {
      return;
    }

    setDeletingId(image.id);

    try {
      const response = await fetch(
        `/api/owner/businesses/${id}/images/${image.id}`,
        {
          method: "DELETE",
        }
      );

      const data: ApiResponse =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "تعذر حذف الصورة"
        );
      }

      setImages(
        (current) =>
          current.filter(
            (item) =>
              item.id !== image.id
          )
      );

      await loadImages(true);

      setToast({
        type: "success",
        message:
          "تم حذف الصورة بنجاح",
      });
    } catch (error) {
      console.error(error);

      setToast({
        type: "error",
        message: getErrorMessage(
          error,
          "حدث خطأ أثناء حذف الصورة"
        ),
      });
    } finally {
      setDeletingId(null);
    }
  };

  // =======================================================
  // Move
  // =======================================================

  const moveImage = async (
    imageId: number,
    direction: "up" | "down"
  ) => {
    if (movingId !== null) {
      return;
    }

    const sorted =
      [...images].sort(
        (a, b) =>
          Number(a.sortOrder) -
            Number(b.sortOrder) ||
          Number(a.id) -
            Number(b.id)
      );

    const currentIndex =
      sorted.findIndex(
        (image) =>
          image.id === imageId
      );

    if (currentIndex === -1) {
      return;
    }

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

    setMovingId(imageId);

    try {
      const [
        firstResponse,
        secondResponse,
      ] = await Promise.all([
        fetch(
          `/api/owner/businesses/${id}/images/${current.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              sortOrder:
                target.sortOrder,
            }),
          }
        ),
        fetch(
          `/api/owner/businesses/${id}/images/${target.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              sortOrder:
                current.sortOrder,
            }),
          }
        ),
      ]);

      const [
        firstData,
        secondData,
      ] = await Promise.all([
        firstResponse.json(),
        secondResponse.json(),
      ]);

      if (
        !firstResponse.ok ||
        !firstData.success
      ) {
        throw new Error(
          firstData.error ||
            "تعذر تحديث ترتيب الصورة"
        );
      }

      if (
        !secondResponse.ok ||
        !secondData.success
      ) {
        throw new Error(
          secondData.error ||
            "تعذر تحديث ترتيب الصورة"
        );
      }

      await loadImages(true);

      setToast({
        type: "success",
        message:
          direction === "up"
            ? "تم رفع الصورة للأعلى"
            : "تم نقل الصورة للأسفل",
      });
    } catch (error) {
      console.error(error);

      await loadImages(true);

      setToast({
        type: "error",
        message: getErrorMessage(
          error,
          "حدث خطأ أثناء ترتيب الصور"
        ),
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
            <p className="text-sm font-bold text-slate-600">
              جاري تحميل صور النشاط...
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
          Header
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
                    إدارة الصور
                  </h1>

                  {business?.name && (
                    <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                      {business.name}
                    </span>
                  )}
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  صور نشاطك محفوظة مباشرة داخل قاعدة بيانات PostgreSQL.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  loadImages()
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
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* =================================================
            Navigation
        ================================================= */}

        <div className="mb-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <nav className="flex min-w-max gap-1">
            {NAV_ITEMS.map((item) => {
              const href =
                item.hrefKey === "basic"
                  ? `/owner/dashboard/businesses/${id}`
                  : `/owner/dashboard/businesses/${id}/${item.hrefKey}`;

              const isActive =
                item.hrefKey ===
                "images";

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

        {/* =================================================
            Stats
        ================================================= */}

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  إجمالي الصور
                </p>

                <p className="mt-2 text-3xl font-black text-slate-900">
                  {images.length}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <Images className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  صورة الغلاف
                </p>

                <p className="mt-2 text-base font-black text-slate-900">
                  {coverImage
                    ? "محددة"
                    : "غير محددة"}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <Crown className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  الحد الأقصى للصورة
                </p>

                <p className="mt-2 text-base font-black text-slate-900">
                  8 ميجابايت
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                <Upload className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            Upload area
        ================================================= */}

        <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                رفع صور جديدة
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                يمكنك اختيار عدة صور مرة واحدة. JPG و PNG و WEBP و GIF حتى 8 ميجابايت للصورة.
              </p>
            </div>

            {selectedFiles.length >
              0 && (
              <span className="w-fit rounded-full bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700">
                {selectedFiles.length}{" "}
                ملف جاهز للرفع
              </span>
            )}
          </div>

          <div
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`rounded-3xl border-2 border-dashed p-8 text-center transition sm:p-10 ${
              dragActive
                ? "border-sky-500 bg-sky-50"
                : "border-slate-200 bg-slate-50/70 hover:border-sky-300 hover:bg-sky-50/40"
            }`}
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-sky-600 shadow-sm">
              <ImagePlus className="h-8 w-8" />
            </div>

            <h3 className="mt-5 text-lg font-black text-slate-900">
              اسحب الصور هنا
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              أو اختر الصور من جهازك
            </p>

            <button
              type="button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              <ImagePlus className="h-4 w-4" />
              اختيار الصور
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              onChange={handleInputChange}
              className="hidden"
            />
          </div>

          {/* Selected preview */}

          {selectedFiles.length >
            0 && (
            <div className="mt-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-800">
                  الصور المختارة
                </h3>

                <button
                  type="button"
                  onClick={() => {
                    selectedFiles.forEach(
                      (item) =>
                        URL.revokeObjectURL(
                          item.previewUrl
                        )
                    );

                    setSelectedFiles(
                      []
                    );
                  }}
                  disabled={uploading}
                  className="text-xs font-bold text-rose-600 transition hover:text-rose-700 disabled:opacity-50"
                >
                  إزالة الكل
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {selectedFiles.map(
                  (item) => (
                    <div
                      key={item.key}
                      className={`overflow-hidden rounded-2xl border bg-white ${
                        item.error
                          ? "border-rose-200"
                          : "border-slate-200"
                      }`}
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                        <img
                          src={
                            item.previewUrl
                          }
                          alt={
                            item.file.name
                          }
                          className="h-full w-full object-cover"
                        />

                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-slate-950/70 to-transparent p-3 pt-8">
                          <span className="max-w-[75%] truncate text-xs font-bold text-white">
                            {item.file.name}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              removeSelectedFile(
                                item.key
                              )
                            }
                            disabled={
                              uploading ||
                              item.uploading
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-slate-700 transition hover:bg-white disabled:opacity-50"
                            title="إزالة"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        {item.isCover && (
                          <span className="absolute right-3 top-3 rounded-full bg-amber-400 px-3 py-1 text-[11px] font-black text-white shadow-sm">
                            غلاف أولي
                          </span>
                        )}

                        {item.uploading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50">
                            <div className="flex flex-col items-center gap-2 text-white">
                              <Loader2 className="h-8 w-8 animate-spin" />
                              <span className="text-xs font-bold">
                                جاري الرفع...
                              </span>
                            </div>
                          </div>
                        )}

                        {item.uploaded && (
                          <div className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                            <Check className="h-5 w-5" />
                          </div>
                        )}
                      </div>

                      <div className="p-3">
                        <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                          <span>
                            {formatFileSize(
                              item.file.size
                            )}
                          </span>

                          <span>
                            {item.file.type
                              .replace(
                                "image/",
                                ""
                              )
                              .toUpperCase()}
                          </span>
                        </div>

                        {item.error && (
                          <p className="mt-2 text-xs font-bold text-rose-600">
                            {item.error}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>

              <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-6 text-slate-500">
                  أول صورة جديدة ستصبح صورة الغلاف تلقائيًا عند عدم وجود غلاف للنشاط.
                </p>

                <button
                  type="button"
                  onClick={handleUploadAll}
                  disabled={
                    uploading ||
                    selectedFiles.every(
                      (item) =>
                        item.uploaded
                    )
                  }
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-7 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      جاري رفع الصور...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      رفع الصور
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* =================================================
            Existing images
        ================================================= */}

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                صور النشاط
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                الصورة ذات الترتيب الأول هي التي تظهر أولًا، والغلاف هو الصورة الرئيسية للنشاط.
              </p>
            </div>

            {coverImage && (
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
                <Crown className="h-3.5 w-3.5" />
                الغلاف:{" "}
                {coverImage.fileName ||
                  `صورة ${coverImage.id}`}
              </span>
            )}
          </div>

          {images.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-slate-400 shadow-sm">
                <Images className="h-9 w-9" />
              </div>

              <h3 className="mt-5 text-lg font-black text-slate-900">
                لا توجد صور للنشاط حتى الآن
              </h3>

              <p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-slate-500">
                أضف صورًا واضحة للنشاط، وستُحفظ مباشرة داخل قاعدة البيانات وتظهر في الصفحة العامة.
              </p>

              <button
                type="button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                <ImagePlus className="h-4 w-4" />
                إضافة صور
              </button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {images.map(
                (image, index) => {
                  return (
                    <article
                      key={image.id}
                      className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                    >
                      {/* Image */}

                      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                        <img
                          src={image.url}
                          alt={
                            image.fileName ||
                            `${business?.name || "النشاط"} - صورة ${index + 1}`
                          }
                          className="h-full w-full object-cover transition duration-500 hover:scale-[1.02]"
                        />

                        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
                          <span className="rounded-full bg-slate-950/70 px-3 py-1.5 text-xs font-black text-white backdrop-blur">
                            #{index + 1}
                          </span>

                          {image.isCover && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1.5 text-xs font-black text-white shadow-lg">
                              <Crown className="h-3.5 w-3.5" />
                              غلاف
                            </span>
                          )}
                        </div>

                        {deletingId ===
                          image.id && (
                          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60">
                            <Loader2 className="h-9 w-9 animate-spin text-white" />
                          </div>
                        )}
                      </div>

                      {/* Info */}

                      <div className="p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-slate-900">
                              {image.fileName ||
                                `صورة ${index + 1}`}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {formatFileSize(
                                image.fileSize
                              )}
                            </p>
                          </div>

                          <span className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                            ترتيب{" "}
                            {
                              image.sortOrder
                            }
                          </span>
                        </div>

                        {/* Order */}

                        <div className="mt-4 flex items-center gap-2">
                          <button
                            type="button"
                            disabled={
                              index ===
                                0 ||
                              movingId !==
                                null
                            }
                            onClick={() =>
                              moveImage(
                                image.id,
                                "up"
                              )
                            }
                            className="inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {movingId ===
                            image.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <ChevronUp className="h-4 w-4" />
                            )}
                            لأعلى
                          </button>

                          <button
                            type="button"
                            disabled={
                              index ===
                                images.length -
                                  1 ||
                              movingId !==
                                null
                            }
                            onClick={() =>
                              moveImage(
                                image.id,
                                "down"
                              )
                            }
                            className="inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {movingId ===
                            image.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                            لأسفل
                          </button>
                        </div>

                        {/* Actions */}

                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleSetCover(
                                image
                              )
                            }
                            disabled={
                              image.isCover ||
                              coverId ===
                                image.id
                            }
                            className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold transition disabled:cursor-not-allowed ${
                              image.isCover
                                ? "border border-amber-200 bg-amber-50 text-amber-700"
                                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {coverId ===
                            image.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Crown className="h-4 w-4" />
                            )}

                            {image.isCover
                              ? "الغلاف الحالي"
                              : "تعيين كغلاف"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                image
                              )
                            }
                            disabled={
                              deletingId ===
                              image.id
                            }
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingId ===
                            image.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            حذف
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>
      </main>

      {/* ===================================================
          Toast
      =================================================== */}

      {toast && (
        <div className="fixed bottom-5 left-1/2 z-[70] w-[calc(100%-2rem)] max-w-md -translate-x-1/2">
          <div
            className={`flex items-start gap-3 rounded-2xl border bg-white px-4 py-4 shadow-2xl ${
              toast.type ===
              "success"
                ? "border-emerald-200"
                : "border-rose-200"
            }`}
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                toast.type ===
                "success"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-rose-50 text-rose-600"
              }`}
            >
              {toast.type ===
              "success" ? (
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

