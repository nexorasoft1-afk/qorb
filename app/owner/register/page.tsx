"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Globe,
  Loader2,
  MapPin,
  MapPinned,
  MessageCircle,
  Navigation,
  Phone,
  Plus,
  Send,
  Store,
  Tag,
  X,
} from "lucide-react";

// =========================================================
// Types
// =========================================================

interface SubCategory {
  id: number;
  name: string;
  slug?: string;
  categoryId?: number;
}

interface Category {
  id: number;
  name: string;
  slug?: string;
  subCategories?: SubCategory[];
  subcategories?: SubCategory[];
}

interface Governorate {
  id: number;
  name: string;
}

interface City {
  id: number;
  name: string;
  slug?: string;
  governorateId?: number | null;
  governorate_id?: number | null;
}

interface Area {
  id: number;
  name: string;
  cityId?: number;
  city_id?: number;
}

interface MeResponse {
  user?: {
    id: number;
    fullName?: string;
    role?: string;
  } | null;
  id?: number;
  fullName?: string;
  role?: string;
}

// =========================================================
// Helpers
// =========================================================

function normalizeArray<T = any>(value: any): T[] {
  if (Array.isArray(value)) return value;

  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.results)) return value.results;

  return [];
}

function extractCategories(data: any): Category[] {
  const raw = normalizeArray<any>(data);

  return raw.map((item: any) => ({
    id: Number(item.id ?? item.categoryId ?? item.CategoryID),
    name: String(item.name ?? item.Name ?? item.categoryName ?? ""),
    slug: item.slug ?? item.Slug,
    subCategories:
      item.subCategories ||
      item.subcategories ||
      item.sub_categories ||
      item.children ||
      [],
  }));
}

function extractCities(data: any): City[] {
  const raw = normalizeArray<any>(data);

  return raw
    .map((item: any) => ({
      id: Number(item.id ?? item.cityId ?? item.CityID),
      name: String(item.name ?? item.Name ?? item.cityName ?? ""),
      slug: item.slug ?? item.Slug,
      governorateId:
        item.governorateId ??
        item.governorate_id ??
        item.GovernorateID ??
        null,
    }))
    .filter((item) => item.id && item.name);
}

function extractAreas(data: any): Area[] {
  const raw = normalizeArray<any>(data);

  return raw
    .map((item: any) => ({
      id: Number(item.id ?? item.areaId ?? item.AreaID),
      name: String(item.name ?? item.Name ?? item.areaName ?? ""),
      cityId:
        item.cityId ??
        item.city_id ??
        item.CityID ??
        undefined,
      city_id:
        item.city_id ??
        item.cityId ??
        item.CityID ??
        undefined,
    }))
    .filter((item) => item.id && item.name);
}

// =========================================================
// Page
// =========================================================

export default function OwnerRegisterPage() {
  const router = useRouter();

  // =======================================================
  // Main loading / errors
  // =======================================================

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =======================================================
  // Auth
  // =======================================================

  const [user, setUser] = useState<MeResponse["user"] | null>(null);

  // =======================================================
  // Lookups
  // =======================================================

  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);

  // =======================================================
  // Form
  // =======================================================

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");

  const [cityId, setCityId] = useState("");
  const [areaId, setAreaId] = useState("");

  const [address, setAddress] = useState("");

  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [website, setWebsite] = useState("");

  const [priceRange, setPriceRange] = useState("");

  // =======================================================
  // Location
  // =======================================================

  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [locationSuccess, setLocationSuccess] = useState(false);

  // =======================================================
  // Area suggestion
  // =======================================================

  const [showAreaSuggestion, setShowAreaSuggestion] = useState(false);
  const [suggestedAreaName, setSuggestedAreaName] = useState("");
  const [suggestedAreaNotes, setSuggestedAreaNotes] = useState("");
  const [areaSuggestionLoading, setAreaSuggestionLoading] =
    useState(false);

  // =======================================================
  // Selected category
  // =======================================================

  const selectedCategory = useMemo(() => {
    return categories.find(
      (item) => String(item.id) === String(categoryId)
    );
  }, [categories, categoryId]);

  const subCategories = useMemo(() => {
    if (!selectedCategory) return [];

    return (
      selectedCategory.subCategories ||
      selectedCategory.subcategories ||
      []
    );
  }, [selectedCategory]);

  const selectedCity = useMemo(() => {
    return cities.find(
      (item) => String(item.id) === String(cityId)
    );
  }, [cities, cityId]);

  // =======================================================
  // Initial load
  // =======================================================

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    setLoading(true);
    setError("");

    try {
      const [meRes, categoriesRes, citiesRes] = await Promise.all([
        fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        }),

        fetch("/api/categories", {
          cache: "no-store",
        }),

        fetch("/api/cities", {
          cache: "no-store",
        }),
      ]);

      // ----------------------------------------------------
      // Session
      // ----------------------------------------------------

      if (!meRes.ok) {
        router.replace("/login");
        return;
      }

      const meData: MeResponse = await meRes.json();

      const currentUser =
        meData.user ||
        (meData.id
          ? {
              id: Number(meData.id),
              fullName: meData.fullName,
              role: meData.role,
            }
          : null);

      if (!currentUser) {
        router.replace("/login");
        return;
      }

      setUser(currentUser);

      // ----------------------------------------------------
      // Categories
      // ----------------------------------------------------

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();

        setCategories(extractCategories(categoriesData));
      } else {
        setCategories([]);
      }

      // ----------------------------------------------------
      // Cities
      // ----------------------------------------------------

      if (citiesRes.ok) {
        const citiesData = await citiesRes.json();

        setCities(extractCities(citiesData));
      } else {
        setCities([]);
      }
    } catch (err) {
      console.error("Owner register load error:", err);

      setError("حدث خطأ أثناء تحميل بيانات الصفحة");
    } finally {
      setLoading(false);
    }
  }

  // =======================================================
  // Load areas when city changes
  // =======================================================

  useEffect(() => {
    if (!cityId) {
      setAreas([]);
      setAreaId("");
      return;
    }

    loadAreas(Number(cityId));
  }, [cityId]);

  async function loadAreas(selectedCityId: number) {
    try {
      setAreaId("");

      const res = await fetch(
        `/api/cities?cityId=${selectedCityId}`,
        {
          cache: "no-store",
        }
      );

      if (!res.ok) {
        setAreas([]);
        return;
      }

      const data = await res.json();

      setAreas(extractAreas(data));
    } catch (err) {
      console.error("Load areas error:", err);

      setAreas([]);
    }
  }

  // =======================================================
  // Category change
  // =======================================================

  function handleCategoryChange(
    e: React.ChangeEvent<HTMLSelectElement>
  ) {
    setCategoryId(e.target.value);

    // تصفير التصنيف الفرعي عند تغيير الرئيسي
    setSubCategoryId("");
  }

  // =======================================================
  // Location helpers
  // =======================================================

  async function checkLocationPermission() {
    try {
      if (!navigator.permissions?.query) {
        return null;
      }

      const permission = await navigator.permissions.query({
        name: "geolocation" as PermissionName,
      });

      return permission.state;
    } catch {
      return null;
    }
  }

  function useCurrentLocation() {
    setError("");
    setLocationMessage("");
    setLocationSuccess(false);

    // ----------------------------------------------------
    // Browser support
    // ----------------------------------------------------

    if (typeof window === "undefined") return;

    if (!navigator.geolocation) {
      setLocationMessage(
        "المتصفح الحالي لا يدعم خدمة تحديد الموقع."
      );

      return;
    }

    // ----------------------------------------------------
    // HTTPS / localhost
    // ----------------------------------------------------

    if (!window.isSecureContext) {
      setLocationMessage(
        "تحديد الموقع يحتاج اتصالًا آمنًا HTTPS أو التشغيل من localhost. إذا كنت تفتح الموقع من عنوان الشبكة مثل 192.168.x.x عبر HTTP فلن يسمح المتصفح بتحديد الموقع."
      );

      return;
    }

    // ----------------------------------------------------
    // Start
    // ----------------------------------------------------

    setLocationLoading(true);
    setLocationMessage("جاري تحديد موقعك...");

    checkLocationPermission().then((permission) => {
      if (permission === "denied") {
        setLocationLoading(false);

        setLocationMessage(
          "تم رفض صلاحية الموقع من المتصفح. اسمح للموقع باستخدام الموقع من إعدادات المتصفح ثم حاول مرة أخرى."
        );

        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          setLatitude(lat.toFixed(6));
          setLongitude(lng.toFixed(6));

          setLocationLoading(false);
          setLocationSuccess(true);

          setLocationMessage(
            `تم تحديد موقعك بنجاح: ${lat.toFixed(
              6
            )}, ${lng.toFixed(6)}`
          );
        },

        (geoError) => {
          setLocationLoading(false);
          setLocationSuccess(false);

          switch (geoError.code) {
            case geoError.PERMISSION_DENIED:
              setLocationMessage(
                "تم رفض إذن تحديد الموقع. اسمح للموقع باستخدام موقعك من المتصفح ثم أعد المحاولة."
              );
              break;

            case geoError.POSITION_UNAVAILABLE:
              setLocationMessage(
                "تعذر الحصول على الموقع الحالي. تأكد من تشغيل خدمة الموقع على الجهاز."
              );
              break;

            case geoError.TIMEOUT:
              setLocationMessage(
                "استغرق تحديد الموقع وقتًا طويلًا. حاول مرة أخرى."
              );
              break;

            default:
              setLocationMessage(
                "حدث خطأ أثناء تحديد موقعك."
              );
          }

          console.error("Geolocation error:", geoError);
        },

        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 30000,
        }
      );
    });
  }

  // =======================================================
  // Area suggestion
  // =======================================================

  function openAreaSuggestion() {
    setError("");
    setSuccess("");

    if (!cityId) {
      setError("اختر المدينة أولًا قبل اقتراح منطقة جديدة.");
      return;
    }

    setSuggestedAreaName("");
    setSuggestedAreaNotes("");
    setShowAreaSuggestion(true);
  }

  function closeAreaSuggestion() {
    if (areaSuggestionLoading) return;

    setShowAreaSuggestion(false);
    setSuggestedAreaName("");
    setSuggestedAreaNotes("");
  }

  async function submitAreaSuggestion(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setError("");
    setSuccess("");

    const cleanName = suggestedAreaName.trim();

    if (!cityId) {
      setError("اختر المدينة أولًا.");
      return;
    }

    if (!cleanName) {
      setError("اكتب اسم المنطقة المقترحة.");
      return;
    }

    if (cleanName.length < 2) {
      setError("اسم المنطقة يجب أن يكون حرفين على الأقل.");
      return;
    }

    setAreaSuggestionLoading(true);

    try {
      const res = await fetch(
        "/api/owner/area-suggestions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",

          body: JSON.stringify({
            cityId: Number(cityId),
            name: cleanName,
            notes:
              suggestedAreaNotes.trim() ||
              null,
          }),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            "تعذر إرسال اقتراح المنطقة."
        );
      }

      setShowAreaSuggestion(false);

      setSuggestedAreaName("");
      setSuggestedAreaNotes("");

      setSuccess(
        "تم إرسال اقتراح المنطقة بنجاح، وسيتم مراجعته من الإدارة."
      );
    } catch (err: any) {
      console.error(
        "Area suggestion error:",
        err
      );

      setError(
        err?.message ||
          "حدث خطأ أثناء إرسال اقتراح المنطقة."
      );
    } finally {
      setAreaSuggestionLoading(false);
    }
  }

  // =======================================================
  // Submit business request
  // =======================================================

 async function handleSubmit(
  e: React.FormEvent
) {
  e.preventDefault();

  setError("");
  setSuccess("");

  // ----------------------------------------------------
  // Validation
  // ----------------------------------------------------

  const cleanName = name.trim();
  const cleanPhone = phone.trim();

  if (!cleanName) {
    setError("اكتب اسم النشاط.");
    return;
  }

  if (!categoryId) {
    setError("اختر تصنيف النشاط.");
    return;
  }

  if (!cityId) {
    setError("اختر المدينة.");
    return;
  }

  if (!cleanPhone) {
    setError("اكتب رقم الهاتف.");
    return;
  }

  const selectedCityData = cities.find(
    (city) => Number(city.id) === Number(cityId)
  );

  const governorateId =
    selectedCityData?.governorateId ??
    selectedCityData?.governorate_id ??
    undefined;

  const payload: Record<string, unknown> = {
    name: cleanName,
    categoryId: Number(categoryId),
    cityId: Number(cityId),
    phone: cleanPhone,
  };

  // ----------------------------------------------------
  // Optional fields
  // مهم: لا نرسل null
  // ----------------------------------------------------

  const cleanDescription = description.trim();

  if (cleanDescription) {
    payload.description = cleanDescription;
  }

  if (subCategoryId) {
    payload.subCategoryId = Number(subCategoryId);
  }

  if (governorateId) {
    payload.governorateId = Number(governorateId);
  }

  if (areaId) {
    payload.areaId = Number(areaId);
  }

  const cleanAddress = address.trim();

  if (cleanAddress) {
    payload.address = cleanAddress;
  }

  const cleanWhatsApp = whatsapp.trim();

  if (cleanWhatsApp) {
    payload.whatsapp = cleanWhatsApp;
  }

  const cleanWebsite = website.trim();

  if (cleanWebsite) {
    payload.website = cleanWebsite;
  }

  if (priceRange) {
    payload.priceRange = priceRange;
  }

  // ----------------------------------------------------
  // Coordinates
  // ----------------------------------------------------

  if (latitude.trim()) {
    const lat = Number(latitude);

    if (
      !Number.isFinite(lat) ||
      lat < -90 ||
      lat > 90
    ) {
      setError("خط العرض غير صحيح.");
      return;
    }

    payload.latitude = lat;
  }

  if (longitude.trim()) {
    const lng = Number(longitude);

    if (
      !Number.isFinite(lng) ||
      lng < -180 ||
      lng > 180
    ) {
      setError("خط الطول غير صحيح.");
      return;
    }

    payload.longitude = lng;
  }

  setSubmitting(true);

  try {
    console.log(
      "OWNER REQUEST PAYLOAD:",
      payload
    );

    const res = await fetch(
      "/api/owner/requests",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        credentials: "include",

        body: JSON.stringify(payload),
      }
    );

    const data = await res
      .json()
      .catch(() => ({}));

    if (!res.ok) {
      console.error(
        "OWNER REQUEST API ERROR:",
        data
      );

      throw new Error(
        data?.error ||
          data?.message ||
          "تعذر إرسال الطلب."
      );
    }

    setSuccess(
      "تم إرسال طلب إضافة النشاط بنجاح، وسيتم مراجعته من الإدارة."
    );

    setTimeout(() => {
      router.push("/owner/requests");
      router.refresh();
    }, 900);
  } catch (err: any) {
    console.error(
      "Owner register submit error:",
      err
    );

    setError(
      err?.message ||
        "حدث خطأ أثناء إرسال الطلب."
    );
  } finally {
    setSubmitting(false);
  }
}
  // =======================================================
  // Loading
  // =======================================================

  if (loading) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-slate-50 flex items-center justify-center p-6"
      >
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-sm p-10 text-center">
          <div className="mx-auto mb-5 w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <Loader2
              size={30}
              className="text-emerald-600 animate-spin"
            />
          </div>

          <h1 className="text-xl font-bold text-slate-800">
            جاري تجهيز الصفحة
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            يتم تحميل بيانات النشاط والمدن والتصنيفات...
          </p>
        </div>
      </main>
    );
  }

  // =======================================================
  // Render
  // =======================================================

  return (
    <>
      <main
        dir="rtl"
        className="min-h-screen bg-slate-50 text-slate-800 py-6 md:py-10 px-4"
      >
        <div className="max-w-5xl mx-auto">
          {/* =================================================
              Header
          ================================================= */}

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-6">
            <div className="bg-gradient-to-l from-emerald-700 via-emerald-600 to-teal-600 px-6 md:px-8 py-7 text-white">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                      <Store size={26} />
                    </div>

                    <div>
                      <h1 className="text-2xl md:text-3xl font-black">
                        إضافة نشاط جديد
                      </h1>

                      <p className="text-white/80 text-sm mt-1">
                        أضف نشاطك إلى منصة قُرب
                      </p>
                    </div>
                  </div>

                  {user?.fullName && (
                    <p className="text-sm text-white/80">
                      مرحبًا {user.fullName}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/owner/requests")
                  }
                  className="inline-flex items-center justify-center gap-2 bg-white text-emerald-700 hover:bg-emerald-50 px-5 py-3 rounded-xl font-bold transition"
                >
                  طلباتي
                  <ArrowRight size={17} />
                </button>
              </div>
            </div>

            <div className="px-6 md:px-8 py-4 bg-emerald-50/60 border-t border-emerald-100">
              <div className="flex items-start gap-3">
                <AlertCircle
                  size={19}
                  className="text-emerald-600 mt-0.5 shrink-0"
                />

                <p className="text-sm leading-7 text-slate-600">
                  بعد إرسال الطلب ستقوم الإدارة بمراجعته قبل
                  نشر النشاط على المنصة.
                </p>
              </div>
            </div>
          </div>

          {/* =================================================
              Alerts
          ================================================= */}

          {error && (
            <div className="mb-5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl px-5 py-4 flex items-start gap-3">
              <AlertCircle
                size={20}
                className="shrink-0 mt-0.5"
              />

              <p className="text-sm font-medium leading-6">
                {error}
              </p>

              <button
                type="button"
                onClick={() => setError("")}
                className="mr-auto text-rose-400 hover:text-rose-600"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {success && (
            <div className="mb-5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl px-5 py-4 flex items-start gap-3">
              <CheckCircle2
                size={20}
                className="shrink-0 mt-0.5"
              />

              <p className="text-sm font-medium leading-6">
                {success}
              </p>

              <button
                type="button"
                onClick={() => setSuccess("")}
                className="mr-auto text-emerald-400 hover:text-emerald-600"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {/* =================================================
              Form
          ================================================= */}

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* =================================================
                Basic information
            ================================================= */}

            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-7">
              <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Store size={21} />
                </div>

                <div>
                  <h2 className="font-black text-slate-800">
                    البيانات الأساسية
                  </h2>

                  <p className="text-xs text-slate-500 mt-1">
                    المعلومات الرئيسية للنشاط
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Name */}

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    اسم النشاط
                    <span className="text-rose-500 mr-1">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    placeholder="مثال: مطعم أبو أحمد"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>

                {/* Description */}

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    وصف النشاط
                  </label>

                  <textarea
                    value={description}
                    onChange={(e) =>
                      setDescription(e.target.value)
                    }
                    rows={4}
                    placeholder="اكتب وصفًا مختصرًا عن النشاط والخدمات التي يقدمها..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none resize-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>

                {/* Category */}

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    التصنيف
                    <span className="text-rose-500 mr-1">
                      *
                    </span>
                  </label>

                  <div className="relative">
                    <Tag
                      size={18}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />

                    <select
                      value={categoryId}
                      onChange={handleCategoryChange}
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pr-11 pl-4 py-3.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    >
                      <option value="">
                        اختر التصنيف
                      </option>

                      {categories.map((category) => (
                        <option
                          key={category.id}
                          value={category.id}
                        >
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Sub category */}

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    التصنيف الفرعي
                  </label>

                  <select
                    value={subCategoryId}
                    onChange={(e) =>
                      setSubCategoryId(
                        e.target.value
                      )
                    }
                    disabled={
                      !categoryId ||
                      subCategories.length === 0
                    }
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {!categoryId
                        ? "اختر التصنيف أولًا"
                        : subCategories.length === 0
                        ? "لا يوجد تصنيف فرعي"
                        : "اختر التصنيف الفرعي"}
                    </option>

                    {subCategories.map((subCategory) => (
                      <option
                        key={subCategory.id}
                        value={subCategory.id}
                      >
                        {subCategory.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price range */}

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    مستوى الأسعار
                  </label>

                  <select
                    value={priceRange}
                    onChange={(e) =>
                      setPriceRange(
                        e.target.value
                      )
                    }
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  >
                    <option value="">
                      اختر مستوى الأسعار
                    </option>

                    <option value="Low">
                      منخفض
                    </option>

                    <option value="Medium">
                      متوسط
                    </option>

                    <option value="High">
                      مرتفع
                    </option>

                    <option value="Luxury">
                      فاخر
                    </option>
                  </select>
                </div>
              </div>
            </section>

            {/* =================================================
                Location
            ================================================= */}

            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-7">
              <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <MapPinned size={21} />
                </div>

                <div>
                  <h2 className="font-black text-slate-800">
                    موقع النشاط
                  </h2>

                  <p className="text-xs text-slate-500 mt-1">
                    حدد المدينة والمنطقة وموقع النشاط
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* City */}

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    المدينة
                    <span className="text-rose-500 mr-1">
                      *
                    </span>
                  </label>

                  <select
                    value={cityId}
                    onChange={(e) =>
                      setCityId(
                        e.target.value
                      )
                    }
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
                  >
                    <option value="">
                      اختر المدينة
                    </option>

                    {cities.map((city) => (
                      <option
                        key={city.id}
                        value={city.id}
                      >
                        {city.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Area */}

                <div>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <label className="block text-sm font-bold text-slate-700">
                      المنطقة
                    </label>

                    <button
                      type="button"
                      onClick={openAreaSuggestion}
                      disabled={!cityId}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 disabled:text-slate-400 disabled:cursor-not-allowed transition"
                    >
                      <Plus size={15} />
                      اقتراح منطقة جديدة
                    </button>
                  </div>

                  <select
                    value={areaId}
                    onChange={(e) =>
                      setAreaId(
                        e.target.value
                      )
                    }
                    disabled={!cityId}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {!cityId
                        ? "اختر المدينة أولًا"
                        : areas.length === 0
                        ? "لا توجد مناطق مسجلة — يمكنك اقتراح منطقة"
                        : "بدون تحديد منطقة"}
                    </option>

                    {areas.map((area) => (
                      <option
                        key={area.id}
                        value={area.id}
                      >
                        {area.name}
                      </option>
                    ))}
                  </select>

                  {!cityId && (
                    <p className="text-[11px] text-slate-400 mt-2">
                      اختر المدينة أولًا لعرض المناطق.
                    </p>
                  )}

                  {cityId &&
                    areas.length === 0 && (
                      <p className="text-[11px] text-amber-600 mt-2">
                        لا توجد مناطق مسجلة لهذه المدينة حاليًا.
                        يمكنك اقتراح منطقة جديدة.
                      </p>
                    )}
                </div>

                {/* Address */}

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    العنوان التفصيلي
                  </label>

                  <textarea
                    value={address}
                    onChange={(e) =>
                      setAddress(
                        e.target.value
                      )
                    }
                    rows={3}
                    placeholder="مثال: شارع السلام، بجوار..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none resize-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
                  />
                </div>

                {/* Geolocation */}

                <div className="md:col-span-2 rounded-2xl border border-sky-100 bg-sky-50/70 p-4 md:p-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl bg-white text-sky-600 flex items-center justify-center border border-sky-100 shrink-0">
                        <Navigation size={21} />
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-800">
                          الموقع الجغرافي
                        </h3>

                        <p className="text-xs text-slate-500 leading-6 mt-1">
                          استخدم موقع جهازك لتحديد إحداثيات
                          النشاط تلقائيًا.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={useCurrentLocation}
                      disabled={locationLoading}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 text-white text-sm font-bold transition shadow-sm"
                    >
                      {locationLoading ? (
                        <>
                          <Loader2
                            size={17}
                            className="animate-spin"
                          />
                          جاري التحديد...
                        </>
                      ) : (
                        <>
                          <MapPin size={17} />
                          تحديد موقعي
                        </>
                      )}
                    </button>
                  </div>

                  {/* Location status */}

                  {locationMessage && (
                    <div
                      className={`mt-4 rounded-xl px-4 py-3 text-xs leading-6 border ${
                        locationSuccess
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : "bg-amber-50 border-amber-200 text-amber-700"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {locationSuccess ? (
                          <CheckCircle2
                            size={16}
                            className="shrink-0 mt-0.5"
                          />
                        ) : (
                          <AlertCircle
                            size={16}
                            className="shrink-0 mt-0.5"
                          />
                        )}

                        <span>
                          {locationMessage}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Coordinates */}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-2">
                        خط العرض Latitude
                      </label>

                      <input
                        type="text"
                        value={latitude}
                        onChange={(e) =>
                          setLatitude(
                            e.target.value
                          )
                        }
                        placeholder="مثال: 27.9158"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-2">
                        خط الطول Longitude
                      </label>

                      <input
                        type="text"
                        value={longitude}
                        onChange={(e) =>
                          setLongitude(
                            e.target.value
                          )
                        }
                        placeholder="مثال: 34.3299"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* =================================================
                Contact
            ================================================= */}

            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-7">
              <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                  <Phone size={21} />
                </div>

                <div>
                  <h2 className="font-black text-slate-800">
                    بيانات التواصل
                  </h2>

                  <p className="text-xs text-slate-500 mt-1">
                    بيانات يستطيع الزوار التواصل من خلالها
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Phone */}

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    رقم الهاتف
                    <span className="text-rose-500 mr-1">
                      *
                    </span>
                  </label>

                  <div className="relative">
                    <Phone
                      size={18}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />

                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) =>
                        setPhone(
                          e.target.value
                        )
                      }
                      placeholder="مثال: 01000000000"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 pr-11 pl-4 py-3.5 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
                    />
                  </div>
                </div>

                {/* WhatsApp */}

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    واتساب
                  </label>

                  <div className="relative">
                    <MessageCircle
                      size={18}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />

                    <input
                      type="tel"
                      value={whatsapp}
                      onChange={(e) =>
                        setWhatsapp(
                          e.target.value
                        )
                      }
                      placeholder="رقم الواتساب"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 pr-11 pl-4 py-3.5 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
                    />
                  </div>
                </div>

                {/* Website */}

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    الموقع الإلكتروني
                  </label>

                  <div className="relative">
                    <Globe
                      size={18}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />

                    <input
                      type="url"
                      value={website}
                      onChange={(e) =>
                        setWebsite(
                          e.target.value
                        )
                      }
                      placeholder="https://example.com"
                      dir="ltr"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 pr-11 pl-4 py-3.5 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* =================================================
                Submit
            ================================================= */}

            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-7">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div>
                  <h2 className="font-black text-slate-800">
                    إرسال الطلب
                  </h2>

                  <p className="text-sm text-slate-500 mt-2 leading-7">
                    بعد الضغط على إرسال سيتم تحويل الطلب إلى
                    الإدارة للمراجعة والموافقة.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold transition shadow-sm min-w-[190px]"
                >
                  {submitting ? (
                    <>
                      <Loader2
                        size={19}
                        className="animate-spin"
                      />
                      جاري إرسال الطلب...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      إرسال طلب النشاط
                    </>
                  )}
                </button>
              </div>
            </section>
          </form>
        </div>
      </main>

      {/* =====================================================
          Area Suggestion Modal
      ===================================================== */}

      {showAreaSuggestion && (
        <div
          dir="rtl"
          className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget &&
              !areaSuggestionLoading
            ) {
              closeAreaSuggestion();
            }
          }}
        >
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Modal header */}

            <div className="bg-gradient-to-l from-emerald-700 to-teal-600 px-6 py-5 text-white">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
                    <Plus size={22} />
                  </div>

                  <div>
                    <h2 className="text-lg font-black">
                      اقتراح منطقة جديدة
                    </h2>

                    <p className="text-xs text-white/80 mt-1">
                      سيتم مراجعة الاقتراح من الإدارة
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeAreaSuggestion}
                  disabled={areaSuggestionLoading}
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-50 flex items-center justify-center transition"
                >
                  <X size={19} />
                </button>
              </div>
            </div>

            {/* Modal body */}

            <form
              onSubmit={submitAreaSuggestion}
              className="p-6 space-y-5"
            >
              {/* Selected city */}

              <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-4">
                <div className="text-xs font-bold text-slate-500 mb-1">
                  المدينة
                </div>

                <div className="flex items-center gap-2 text-slate-800 font-bold">
                  <MapPin
                    size={17}
                    className="text-emerald-600"
                  />

                  {selectedCity?.name ||
                    "غير محددة"}
                </div>
              </div>

              {/* Area name */}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  اسم المنطقة
                  <span className="text-rose-500 mr-1">
                    *
                  </span>
                </label>

                <input
                  autoFocus
                  type="text"
                  value={suggestedAreaName}
                  onChange={(e) =>
                    setSuggestedAreaName(
                      e.target.value
                    )
                  }
                  placeholder="مثال: حي النور"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>

              {/* Notes */}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  ملاحظات
                  <span className="text-xs font-normal text-slate-400 mr-2">
                    اختياري
                  </span>
                </label>

                <textarea
                  value={suggestedAreaNotes}
                  onChange={(e) =>
                    setSuggestedAreaNotes(
                      e.target.value
                    )
                  }
                  rows={4}
                  placeholder="أي تفاصيل تساعد الإدارة في التحقق من المنطقة..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none resize-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>

              {/* Info */}

              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3.5 text-xs text-emerald-700 leading-6">
                اقتراح المنطقة لا يضيفها مباشرة إلى النظام. بعد
                موافقة الإدارة ستظهر المنطقة تلقائيًا لجميع
                المستخدمين داخل هذه المدينة.
              </div>

              {/* Actions */}

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeAreaSuggestion}
                  disabled={areaSuggestionLoading}
                  className="flex-1 px-5 py-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm transition disabled:opacity-50"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={areaSuggestionLoading}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold text-sm transition"
                >
                  {areaSuggestionLoading ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <Send size={17} />
                      إرسال الاقتراح
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}