"use client";

import {
  use,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import Link from "next/link";

import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  Globe,
  Image as ImageIcon,
  Loader2,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Plus,
  Save,
  Settings,
  Tag,
  X,
  Clock3,
  Wrench,
} from "lucide-react";

// =========================================================
// Types
// =========================================================

interface SubCategory {
  id: number;
  name: string;
  categoryId?: number;
  category_id?: number;
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

interface Area {
  id: number;
  name: string;
  cityId?: number;
  city_id?: number;
  isActive?: boolean;
  is_active?: boolean;
}

interface City {
  id: number;
  name: string;

  governorateId?: number;
  governorate_id?: number;

  governorateName?: string;
  governorate_name?: string;

  governorate?: {
    id?: number;
    name?: string;
  };

  areas?: Area[];
}

interface Business {
  id: number;
  ownerId: number | null;

  name: string;
  slug?: string;
  description: string | null;

  categoryId: number;
  subCategoryId: number | null;

  governorateId: number;
  cityId: number;
  areaId: number | null;

  address: string | null;

  latitude: number | string | null;
  longitude: number | string | null;

  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  priceRange: string | null;

  status?: string;
  isVerified?: boolean;

  category?: {
    id: number;
    name: string;
  } | null;

  subCategory?: {
    id: number;
    name: string;
  } | null;

  governorate?: {
    id: number;
    name: string;
  } | null;

  city?: {
    id: number;
    name: string;
  } | null;

  area?: {
    id: number;
    name: string;
  } | null;
}

interface FormState {
  name: string;
  description: string;

  categoryId: string;
  subCategoryId: string;

  governorateId: string;
  cityId: string;
  areaId: string;

  address: string;

  latitude: string;
  longitude: string;

  phone: string;
  whatsapp: string;
  website: string;
  priceRange: string;
}

interface ManageTab {
  href: string;
  label: string;
  icon: typeof Building2;
}

// =========================================================
// Helpers
// =========================================================

function extractArray<T>(
  payload: any,
  keys: string[] = []
): T[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  for (const key of keys) {
    if (Array.isArray(payload?.[key])) {
      return payload[key];
    }
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.data?.data)) {
    return payload.data.data;
  }

  return [];
}

function normalizeNumber(
  value: string
): number | null {
  if (!value.trim()) {
    return null;
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue)
    ? numberValue
    : null;
}

// =========================================================
// Page
// =========================================================

export default function OwnerBusinessManagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const routeParams = use(params);

  const businessId = String(
    routeParams?.id ?? ""
  );

  // =========================================================
  // State
  // =========================================================

  const [business, setBusiness] =
    useState<Business | null>(null);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [subCategories, setSubCategories] =
    useState<SubCategory[]>([]);

  const [governorates, setGovernorates] =
    useState<Governorate[]>([]);

  const [cities, setCities] =
    useState<City[]>([]);

  const [areas, setAreas] =
    useState<Area[]>([]);

  const [form, setForm] =
    useState<FormState>({
      name: "",
      description: "",

      categoryId: "",
      subCategoryId: "",

      governorateId: "",
      cityId: "",
      areaId: "",

      address: "",

      latitude: "",
      longitude: "",

      phone: "",
      whatsapp: "",
      website: "",
      priceRange: "",
    });

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [loadingSubCategories, setLoadingSubCategories] =
    useState(false);

  const [loadingAreas, setLoadingAreas] =
    useState(false);

  const [locationLoading, setLocationLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  // =========================================================
  // Area suggestion
  // =========================================================

  const [areaModalOpen, setAreaModalOpen] =
    useState(false);

  const [areaSuggestionName, setAreaSuggestionName] =
    useState("");

  const [areaSuggestionNotes, setAreaSuggestionNotes] =
    useState("");

  const [sendingAreaSuggestion, setSendingAreaSuggestion] =
    useState(false);

  // =========================================================
  // Navigation
  // =========================================================

  const manageTabs = useMemo<ManageTab[]>(
    () => [
      {
        href: `/owner/dashboard/businesses/${businessId}`,
        label: "البيانات الأساسية",
        icon: Building2,
      },
      {
        href: `/owner/dashboard/businesses/${businessId}/services`,
        label: "الخدمات",
        icon: Wrench,
      },
      {
        href: `/owner/dashboard/businesses/${businessId}/images`,
        label: "الصور",
        icon: ImageIcon,
      },
      {
        href: `/owner/dashboard/businesses/${businessId}/hours`,
        label: "مواعيد العمل",
        icon: Clock3,
      },
      {
        href: `/owner/dashboard/businesses/${businessId}/offers`,
        label: "العروض",
        icon: Tag,
      },
      {
        href: `/owner/dashboard/businesses/${businessId}/events`,
        label: "الفعاليات",
        icon: CalendarDays,
      },
      {
        href: `/owner/dashboard/businesses/${businessId}/analytics`,
        label: "الإحصائيات",
        icon: BarChart3,
      },
    ],
    [businessId]
  );

  // =========================================================
  // Derived values
  // =========================================================

  const selectedCity = useMemo(() => {
    return (
      cities.find(
        (city) =>
          String(city.id) === form.cityId
      ) ?? null
    );
  }, [cities, form.cityId]);

  const selectedGovernorate = useMemo(() => {
    return governorates.find(
      (item) =>
        String(item.id) ===
        form.governorateId
    );
  }, [
    governorates,
    form.governorateId,
  ]);

  const visibleCities = useMemo(() => {
    if (!form.governorateId) {
      return cities;
    }

    const matching = cities.filter(
      (city) => {
        const govId =
          city.governorateId ??
          city.governorate_id ??
          city.governorate?.id;

        if (govId == null) {
          return false;
        }

        return (
          String(govId) ===
          form.governorateId
        );
      }
    );

    // في حالة API المدن لا يرجع معلومات المحافظة
    if (matching.length === 0) {
      const hasGovernorateInfo =
        cities.some(
          (city) =>
            city.governorateId != null ||
            city.governorate_id != null ||
            city.governorate?.id != null
        );

      if (!hasGovernorateInfo) {
        return cities;
      }
    }

    return matching;
  }, [
    cities,
    form.governorateId,
  ]);

  // =========================================================
  // Update field
  // =========================================================

  function updateField<K extends keyof FormState>(
    field: K,
    value: FormState[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  // =========================================================
  // Normalize categories
  // =========================================================

  function normalizeCategories(
    raw: Category[]
  ): Category[] {
    return raw.map(
      (category: any) => ({
        id: Number(category.id),

        name: String(
          category.name ?? ""
        ),

        slug: category.slug,

        subCategories:
          Array.isArray(
            category.subCategories
          )
            ? category.subCategories.map(
                (item: any) => ({
                  id: Number(item.id),

                  name: String(
                    item.name ?? ""
                  ),

                  categoryId:
                    item.categoryId !=
                    null
                      ? Number(
                          item.categoryId
                        )
                      : item.category_id !=
                        null
                      ? Number(
                          item.category_id
                        )
                      : undefined,
                })
              )
            : Array.isArray(
                category.subcategories
              )
            ? category.subcategories.map(
                (item: any) => ({
                  id: Number(item.id),

                  name: String(
                    item.name ?? ""
                  ),

                  categoryId:
                    item.categoryId !=
                    null
                      ? Number(
                          item.categoryId
                        )
                      : item.category_id !=
                        null
                      ? Number(
                          item.category_id
                        )
                      : undefined,
                })
              )
            : [],
      })
    );
  }

  // =========================================================
  // Load categories
  // =========================================================

  async function loadCategories(): Promise<
    Category[]
  > {
    try {
      const response = await fetch(
        "/api/categories",
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        return [];
      }

      const payload =
        await response.json();

      const raw =
        extractArray<Category>(
          payload,
          [
            "categories",
            "items",
            "results",
          ]
        );

      const normalized =
        normalizeCategories(raw);

      setCategories(normalized);

      return normalized;
    } catch (err) {
      console.error(
        "Categories load error:",
        err
      );

      return [];
    }
  }

  // =========================================================
  // Load subcategories
  // =========================================================

  async function loadSubCategories(
    categoryId: string,
    categoriesList: Category[] = categories
  ) {
    if (!categoryId) {
      setSubCategories([]);
      return;
    }

    setLoadingSubCategories(true);

    try {
      const category =
        categoriesList.find(
          (item) =>
            String(item.id) ===
            String(categoryId)
        );

      const nested =
        category?.subCategories ??
        category?.subcategories ??
        [];

      if (nested.length > 0) {
        setSubCategories(nested);
        return;
      }

      const response =
        await fetch(
          `/api/categories?categoryId=${encodeURIComponent(
            categoryId
          )}`,
          {
            cache: "no-store",
          }
        );

      if (!response.ok) {
        setSubCategories([]);
        return;
      }

      const payload =
        await response.json();

      const direct =
        extractArray<SubCategory>(
          payload,
          [
            "subCategories",
            "subcategories",
            "children",
            "items",
            "results",
          ]
        ).map((item: any) => ({
          id: Number(item.id),

          name: String(
            item.name ?? ""
          ),

          categoryId:
            item.categoryId != null
              ? Number(
                  item.categoryId
                )
              : item.category_id != null
              ? Number(
                  item.category_id
                )
              : undefined,
        }));

      const filtered =
        direct.filter(
          (item) => {
            if (
              item.categoryId == null ||
              Number.isNaN(
                item.categoryId
              )
            ) {
              return true;
            }

            return (
              String(
                item.categoryId
              ) ===
              String(categoryId)
            );
          }
        );

      setSubCategories(filtered);
    } catch (err) {
      console.error(
        "Subcategories load error:",
        err
      );

      setSubCategories([]);
    } finally {
      setLoadingSubCategories(false);
    }
  }

  // =========================================================
  // Load cities
  // =========================================================

  async function loadCities(): Promise<
    City[]
  > {
    try {
      const response = await fetch(
        "/api/cities",
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        setCities([]);
        return [];
      }

      const payload =
        await response.json();

      const raw =
        extractArray<City>(
          payload,
          [
            "cities",
            "items",
            "results",
          ]
        );

      const normalized =
        raw.map(
          (city: any) => ({
            id: Number(city.id),

            name: String(
              city.name ?? ""
            ),

            governorateId:
              city.governorateId !=
              null
                ? Number(
                    city.governorateId
                  )
                : city.governorate_id !=
                  null
                ? Number(
                    city.governorate_id
                  )
                : city.governorate
                    ?.id != null
                ? Number(
                    city.governorate.id
                  )
                : undefined,

            governorateName:
              city.governorateName ??
              city.governorate_name ??
              city.governorate?.name ??
              undefined,

            areas:
              Array.isArray(
                city.areas
              )
                ? city.areas.map(
                    (area: any) => ({
                      id: Number(
                        area.id
                      ),

                      name: String(
                        area.name ?? ""
                      ),

                      cityId:
                        area.cityId !=
                        null
                          ? Number(
                              area.cityId
                            )
                          : area.city_id !=
                            null
                          ? Number(
                              area.city_id
                            )
                          : undefined,

                      isActive:
                        area.isActive !=
                        null
                          ? Boolean(
                              area.isActive
                            )
                          : area.is_active !=
                            null
                          ? Boolean(
                              area.is_active
                            )
                          : true,
                    })
                  )
                : [],
          })
        );

      setCities(normalized);

      return normalized;
    } catch (err) {
      console.error(
        "Cities load error:",
        err
      );

      setCities([]);

      return [];
    }
  }

  // =========================================================
  // Build governorates from cities
  // =========================================================

  function buildGovernoratesFromCities(
    cityList: City[],
    currentBusiness: Business | null
  ) {
    const map =
      new Map<number, string>();

    for (const city of cityList) {
      if (
        city.governorateId &&
        city.governorateName
      ) {
        map.set(
          city.governorateId,
          city.governorateName
        );
      }
    }

    if (
      currentBusiness?.governorateId &&
      currentBusiness.governorate?.name
    ) {
      map.set(
        currentBusiness.governorateId,
        currentBusiness.governorate.name
      );
    }

    const result =
      Array.from(map.entries())
        .map(
          ([id, name]) => ({
            id,
            name,
          })
        )
        .sort((a, b) =>
          a.name.localeCompare(
            b.name,
            "ar"
          )
        );

    setGovernorates(result);
  }

  // =========================================================
  // Load areas
  // =========================================================

  async function loadAreas(
    cityId: string,
    preserveArea = false
  ) {
    if (!cityId) {
      setAreas([]);

      if (!preserveArea) {
        updateField(
          "areaId",
          ""
        );
      }

      return;
    }

    setLoadingAreas(true);

    try {
      const response =
        await fetch(
          `/api/cities?cityId=${encodeURIComponent(
            cityId
          )}`,
          {
            cache: "no-store",
          }
        );

      if (!response.ok) {
        setAreas([]);
        return;
      }

      const payload =
        await response.json();

      let foundAreas =
        extractArray<Area>(
          payload,
          [
            "areas",
            "items",
            "results",
          ]
        );

      // في حالة API رجع المدينة وبداخلها areas
      if (foundAreas.length === 0) {
        const returnedCities =
          extractArray<City>(
            payload,
            [
              "cities",
              "city",
              "items",
              "results",
            ]
          );

        if (
          returnedCities.length > 0
        ) {
          foundAreas =
            returnedCities.flatMap(
              (city: any) =>
                Array.isArray(
                  city.areas
                )
                  ? city.areas
                  : []
            );
        }
      }

      // fallback من بيانات المدن الموجودة بالفعل
      if (foundAreas.length === 0) {
        const localCity =
          cities.find(
            (city) =>
              String(city.id) ===
              String(cityId)
          );

        if (
          localCity?.areas?.length
        ) {
          foundAreas =
            localCity.areas;
        }
      }

      const normalized =
        foundAreas
          .map(
            (area: any) => ({
              id: Number(
                area.id
              ),

              name: String(
                area.name ?? ""
              ),

              cityId:
                area.cityId != null
                  ? Number(
                      area.cityId
                    )
                  : area.city_id !=
                    null
                  ? Number(
                      area.city_id
                    )
                  : Number(
                      cityId
                    ),

              isActive:
                area.isActive !=
                null
                  ? Boolean(
                      area.isActive
                    )
                  : area.is_active !=
                    null
                  ? Boolean(
                      area.is_active
                    )
                  : true,
            })
          )
          .filter(
            (area) =>
              area.isActive !==
                false &&
              String(area.cityId) ===
                String(cityId)
          )
          .sort((a, b) =>
            a.name.localeCompare(
              b.name,
              "ar"
            )
          );

      setAreas(normalized);

      if (!preserveArea) {
        updateField(
          "areaId",
          ""
        );
      }
    } catch (err) {
      console.error(
        "Areas load error:",
        err
      );

      setAreas([]);
    } finally {
      setLoadingAreas(false);
    }
  }

  // =========================================================
  // Load business
  // =========================================================

  async function loadBusiness(): Promise<
    Business
  > {
    if (!businessId) {
      throw new Error(
        "رقم النشاط غير موجود"
      );
    }

    const response =
      await fetch(
        `/api/owner/businesses/${encodeURIComponent(
          businessId
        )}`,
        {
          cache: "no-store",
        }
      );

    const payload =
      await response.json();

    if (!response.ok) {
      throw new Error(
        payload?.error ||
          payload?.message ||
          "تعذر تحميل بيانات النشاط"
      );
    }

    const currentBusiness: Business =
      payload?.business ??
      payload?.data ??
      payload;

    if (!currentBusiness) {
      throw new Error(
        "لم يتم العثور على بيانات النشاط"
      );
    }

    setBusiness(
      currentBusiness
    );

    setForm({
      name:
        currentBusiness.name ??
        "",

      description:
        currentBusiness.description ??
        "",

      categoryId:
        currentBusiness.categoryId !=
        null
          ? String(
              currentBusiness.categoryId
            )
          : "",

      subCategoryId:
        currentBusiness.subCategoryId !=
        null
          ? String(
              currentBusiness.subCategoryId
            )
          : "",

      governorateId:
        currentBusiness.governorateId !=
        null
          ? String(
              currentBusiness.governorateId
            )
          : "",

      cityId:
        currentBusiness.cityId !=
        null
          ? String(
              currentBusiness.cityId
            )
          : "",

      areaId:
        currentBusiness.areaId !=
        null
          ? String(
              currentBusiness.areaId
            )
          : "",

      address:
        currentBusiness.address ??
        "",

      latitude:
        currentBusiness.latitude !=
        null
          ? String(
              currentBusiness.latitude
            )
          : "",

      longitude:
        currentBusiness.longitude !=
        null
          ? String(
              currentBusiness.longitude
            )
          : "",

      phone:
        currentBusiness.phone ??
        "",

      whatsapp:
        currentBusiness.whatsapp ??
        "",

      website:
        currentBusiness.website ??
        "",

      priceRange:
        currentBusiness.priceRange ??
        "",
    });

    return currentBusiness;
  }

  // =========================================================
  // Initial load
  // =========================================================

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      setError("");
      setMessage("");

      try {
        const currentBusiness =
          await loadBusiness();

        if (cancelled) {
          return;
        }

        const [
          categoryList,
          cityList,
        ] = await Promise.all([
          loadCategories(),
          loadCities(),
        ]);

        if (cancelled) {
          return;
        }

        buildGovernoratesFromCities(
          cityList,
          currentBusiness
        );

        if (
          currentBusiness?.categoryId
        ) {
          await loadSubCategories(
            String(
              currentBusiness.categoryId
            ),
            categoryList
          );
        }

        if (
          currentBusiness?.cityId
        ) {
          await loadAreas(
            String(
              currentBusiness.cityId
            ),
            true
          );
        }
      } catch (err: any) {
        console.error(
          "Manage business init error:",
          err
        );

        if (!cancelled) {
          setError(
            err?.message ||
              "حدث خطأ أثناء تحميل بيانات النشاط"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [businessId]);

  // =========================================================
  // Category change
  // =========================================================

  async function handleCategoryChange(
    categoryId: string
  ) {
    updateField(
      "categoryId",
      categoryId
    );

    updateField(
      "subCategoryId",
      ""
    );

    await loadSubCategories(
      categoryId
    );
  }

  // =========================================================
  // Governorate change
  // =========================================================

  function handleGovernorateChange(
    governorateId: string
  ) {
    updateField(
      "governorateId",
      governorateId
    );

    updateField(
      "cityId",
      ""
    );

    updateField(
      "areaId",
      ""
    );

    setAreas([]);
  }

  // =========================================================
  // City change
  // =========================================================

  async function handleCityChange(
    cityId: string
  ) {
    updateField(
      "cityId",
      cityId
    );

    updateField(
      "areaId",
      ""
    );

    await loadAreas(
      cityId,
      false
    );
  }

  // =========================================================
  // Current location
  // =========================================================

  function getCurrentLocation() {
    if (
      !navigator.geolocation
    ) {
      setError(
        "المتصفح لا يدعم تحديد الموقع"
      );

      return;
    }

    setLocationLoading(true);
    setError("");
    setMessage("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const {
          latitude,
          longitude,
        } = position.coords;

        updateField(
          "latitude",
          latitude.toFixed(7)
        );

        updateField(
          "longitude",
          longitude.toFixed(7)
        );

        setMessage(
          "تم تحديد موقع النشاط بنجاح، اضغط حفظ لتثبيت الموقع."
        );

        setLocationLoading(false);
      },
      (geoError) => {
        console.error(
          "Geolocation error:",
          geoError
        );

        let geoMessage =
          "تعذر تحديد الموقع الحالي";

        if (
          geoError.code === 1
        ) {
          geoMessage =
            "تم رفض صلاحية الوصول إلى الموقع من المتصفح.";
        } else if (
          geoError.code === 2
        ) {
          geoMessage =
            "تعذر الحصول على موقع الجهاز.";
        } else if (
          geoError.code === 3
        ) {
          geoMessage =
            "انتهت مهلة تحديد الموقع.";
        }

        setError(geoMessage);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  // =========================================================
  // Directions
  // =========================================================

  function openDirections() {
    const latitude =
      normalizeNumber(
        form.latitude
      );

    const longitude =
      normalizeNumber(
        form.longitude
      );

    if (
      latitude == null ||
      longitude == null
    ) {
      setError(
        "لا يوجد إحداثيات صحيحة لفتح الاتجاهات."
      );

      return;
    }

    const url =
      `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  }

  // =========================================================
  // Save
  // =========================================================

  async function handleSave(
    event: FormEvent
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (!form.name.trim()) {
        throw new Error(
          "اسم النشاط مطلوب"
        );
      }

      if (!form.categoryId) {
        throw new Error(
          "اختر التصنيف الرئيسي"
        );
      }

      if (!form.governorateId) {
        throw new Error(
          "اختر المحافظة"
        );
      }

      if (!form.cityId) {
        throw new Error(
          "اختر المدينة"
        );
      }

      const response =
        await fetch(
          `/api/owner/businesses/${encodeURIComponent(
            businessId
          )}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              name:
                form.name.trim(),

              description:
                form.description.trim() ||
                null,

              categoryId:
                Number(
                  form.categoryId
                ),

              subCategoryId:
                form.subCategoryId
                  ? Number(
                      form.subCategoryId
                    )
                  : null,

              governorateId:
                Number(
                  form.governorateId
                ),

              cityId:
                Number(
                  form.cityId
                ),

              areaId:
                form.areaId
                  ? Number(
                      form.areaId
                    )
                  : null,

              address:
                form.address.trim() ||
                null,

              latitude:
                normalizeNumber(
                  form.latitude
                ),

              longitude:
                normalizeNumber(
                  form.longitude
                ),

              phone:
                form.phone.trim() ||
                null,

              whatsapp:
                form.whatsapp.trim() ||
                null,

              website:
                form.website.trim() ||
                null,

              priceRange:
                form.priceRange.trim() ||
                null,
            }),
          }
        );

      const payload =
        await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.error ||
            payload?.message ||
            "تعذر حفظ بيانات النشاط"
        );
      }

      setMessage(
        "تم حفظ بيانات النشاط بنجاح."
      );

      if (payload?.business) {
        setBusiness(
          payload.business
        );
      }
    } catch (err: any) {
      console.error(
        "Save business error:",
        err
      );

      setError(
        err?.message ||
          "حدث خطأ أثناء حفظ بيانات النشاط"
      );
    } finally {
      setSaving(false);
    }
  }

  // =========================================================
  // Area suggestion
  // =========================================================

  async function submitAreaSuggestion(
    event: FormEvent
  ) {
    event.preventDefault();

    const name =
      areaSuggestionName.trim();

    if (!form.cityId) {
      setError(
        "اختر المدينة أولًا."
      );

      return;
    }

    if (!name) {
      setError(
        "اكتب اسم المنطقة أو الحي."
      );

      return;
    }

    setSendingAreaSuggestion(true);
    setError("");
    setMessage("");

    try {
      const response =
        await fetch(
          "/api/owner/area-suggestions",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              cityId:
                Number(
                  form.cityId
                ),

              name,

              notes:
                areaSuggestionNotes.trim() ||
                null,
            }),
          }
        );

      const payload =
        await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.error ||
            payload?.message ||
            "تعذر إرسال اقتراح المنطقة"
        );
      }

      setAreaModalOpen(false);

      setAreaSuggestionName(
        ""
      );

      setAreaSuggestionNotes(
        ""
      );

      setMessage(
        "تم إرسال اقتراح المنطقة للمراجعة، وستظهر ضمن مناطق المدينة بعد اعتمادها."
      );

      await loadAreas(
        form.cityId,
        true
      );
    } catch (err: any) {
      console.error(
        "Area suggestion error:",
        err
      );

      setError(
        err?.message ||
          "تعذر إرسال اقتراح المنطقة"
      );
    } finally {
      setSendingAreaSuggestion(false);
    }
  }

  // =========================================================
  // Loading screen
  // =========================================================

  if (loading) {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-slate-50 flex items-center justify-center p-6"
      >
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <Loader2 className="h-6 w-6 animate-spin text-slate-600" />

          <span className="font-bold text-slate-600">
            جاري تحميل بيانات النشاط...
          </span>
        </div>
      </div>
    );
  }

  // =========================================================
  // Error page
  // =========================================================

  if (!business && error) {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-slate-50 p-6"
      >
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-red-50 p-7 text-red-700 shadow-sm">
          <div className="mb-2 text-xl font-black">
            تعذر تحميل النشاط
          </div>

          <div className="text-sm leading-7">
            {error}
          </div>

          <Link
            href="/owner/dashboard"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            <ArrowRight className="h-4 w-4" />
            العودة للوحة النشاطات
          </Link>
        </div>
      </div>
    );
  }

  // =========================================================
  // Main
  // =========================================================

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-50"
    >
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">

        {/* =====================================================
            Header
        ====================================================== */}

        <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <Link
              href="/owner/dashboard"
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
            >
              <ArrowRight className="h-4 w-4" />
              العودة للوحة النشاطات
            </Link>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="flex items-center gap-2 text-2xl font-black text-slate-900 sm:text-3xl">
                <Building2 className="h-8 w-8" />
                إدارة النشاط
              </h1>

              {business?.isVerified && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  نشاط موثق
                </span>
              )}

              {business?.status && (
                <span
                  className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${
                    business.status ===
                    "Approved"
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                      : business.status ===
                        "Pending"
                      ? "bg-amber-50 text-amber-700 ring-amber-200"
                      : business.status ===
                        "Rejected"
                      ? "bg-red-50 text-red-700 ring-red-200"
                      : "bg-slate-100 text-slate-700 ring-slate-200"
                  }`}
                >
                  {business.status ===
                  "Approved"
                    ? "معتمد"
                    : business.status ===
                      "Pending"
                    ? "قيد المراجعة"
                    : business.status ===
                      "Rejected"
                    ? "مرفوض"
                    : business.status}
                </span>
              )}
            </div>

            {business?.name && (
              <p className="mt-1 text-sm text-slate-500">
                {business.name}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/businesses/${businessId}`}
              target="_blank"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <ExternalLink className="h-4 w-4" />
              عرض صفحة النشاط
            </Link>
          </div>
        </div>

        {/* =====================================================
            Management Navigation
        ====================================================== */}

        <div className="mb-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="flex min-w-max gap-2">
            {manageTabs.map(
              (tab, index) => {
                const isActive =
                  index === 0;

                const Icon =
                  tab.icon;

                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition ${
                      isActive
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </Link>
                );
              }
            )}
          </div>
        </div>

        {/* =====================================================
            Messages
        ====================================================== */}

        {(error || message) && (
          <div className="mb-6 space-y-3">
            {error && (
              <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                <X className="mt-0.5 h-5 w-5 shrink-0" />

                <div className="text-sm font-medium leading-6">
                  {error}
                </div>
              </div>
            )}

            {message && (
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

                <div className="text-sm font-medium leading-6">
                  {message}
                </div>
              </div>
            )}
          </div>
        )}

        {/* =====================================================
            Main Form
        ====================================================== */}

        <form
          onSubmit={handleSave}
          className="space-y-6"
        >
          {/* ===================================================
              Basic Information
          ==================================================== */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                <Building2 className="h-5 w-5 text-slate-700" />
              </div>

              <div>
                <h2 className="font-black text-slate-900">
                  البيانات الأساسية
                </h2>

                <p className="text-sm text-slate-500">
                  بيانات النشاط التي تظهر للزوار
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  اسم النشاط
                </label>

                <input
                  value={form.name}
                  onChange={(e) =>
                    updateField(
                      "name",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  placeholder="اسم النشاط"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  وصف النشاط
                </label>

                <textarea
                  value={
                    form.description
                  }
                  onChange={(e) =>
                    updateField(
                      "description",
                      e.target.value
                    )
                  }
                  rows={5}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  placeholder="اكتب وصفًا مختصرًا وواضحًا عن النشاط..."
                />
              </div>
            </div>
          </section>

          {/* ===================================================
              Classification
          ==================================================== */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                <Tag className="h-5 w-5 text-slate-700" />
              </div>

              <div>
                <h2 className="font-black text-slate-900">
                  التصنيف
                </h2>

                <p className="text-sm text-slate-500">
                  اختر التصنيف الرئيسي والفرعي المناسب
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  التصنيف الرئيسي
                </label>

                <select
                  value={
                    form.categoryId
                  }
                  onChange={(e) =>
                    handleCategoryChange(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                >
                  <option value="">
                    اختر التصنيف الرئيسي
                  </option>

                  {categories.map(
                    (category) => (
                      <option
                        key={
                          category.id
                        }
                        value={
                          category.id
                        }
                      >
                        {category.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  التصنيف الفرعي
                </label>

                <div className="relative">
                  <select
                    value={
                      form.subCategoryId
                    }
                    onChange={(e) =>
                      updateField(
                        "subCategoryId",
                        e.target.value
                      )
                    }
                    disabled={
                      !form.categoryId ||
                      loadingSubCategories
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="">
                      {loadingSubCategories
                        ? "جاري تحميل التصنيفات الفرعية..."
                        : "بدون تصنيف فرعي"}
                    </option>

                    {subCategories.map(
                      (
                        subCategory
                      ) => (
                        <option
                          key={
                            subCategory.id
                          }
                          value={
                            subCategory.id
                          }
                        >
                          {
                            subCategory.name
                          }
                        </option>
                      )
                    )}
                  </select>

                  {loadingSubCategories && (
                    <Loader2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ===================================================
              Location
          ==================================================== */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                <MapPin className="h-5 w-5 text-slate-700" />
              </div>

              <div>
                <h2 className="font-black text-slate-900">
                  الموقع
                </h2>

                <p className="text-sm text-slate-500">
                  المحافظة والمدينة والمنطقة وموقع النشاط
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  المحافظة
                </label>

                <select
                  value={
                    form.governorateId
                  }
                  onChange={(e) =>
                    handleGovernorateChange(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                >
                  <option value="">
                    اختر المحافظة
                  </option>

                  {governorates.map(
                    (
                      governorate
                    ) => (
                      <option
                        key={
                          governorate.id
                        }
                        value={
                          governorate.id
                        }
                      >
                        {
                          governorate.name
                        }
                      </option>
                    )
                  )}

                  {form.governorateId &&
                    selectedGovernorate ==
                      null &&
                    business?.governorate
                      ?.name && (
                      <option
                        value={
                          business
                            .governorate
                            .id
                        }
                      >
                        {
                          business
                            .governorate
                            .name
                        }
                      </option>
                    )}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  المدينة
                </label>

                <select
                  value={
                    form.cityId
                  }
                  onChange={(e) =>
                    handleCityChange(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                >
                  <option value="">
                    اختر المدينة
                  </option>

                  {visibleCities.map(
                    (city) => (
                      <option
                        key={city.id}
                        value={
                          city.id
                        }
                      >
                        {city.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  المنطقة / الحي
                </label>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <select
                      value={
                        form.areaId
                      }
                      onChange={(e) =>
                        updateField(
                          "areaId",
                          e.target.value
                        )
                      }
                      disabled={
                        !form.cityId ||
                        loadingAreas
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      <option value="">
                        {loadingAreas
                          ? "جاري تحميل المناطق..."
                          : form.cityId
                          ? "اختر المنطقة / الحي"
                          : "اختر المدينة أولًا"}
                      </option>

                      {areas.map(
                        (area) => (
                          <option
                            key={
                              area.id
                            }
                            value={
                              area.id
                            }
                          >
                            {area.name}
                          </option>
                        )
                      )}
                    </select>

                    {loadingAreas && (
                      <Loader2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setAreaSuggestionName(
                        ""
                      );

                      setAreaSuggestionNotes(
                        ""
                      );

                      setError("");
                      setMessage("");

                      setAreaModalOpen(
                        true
                      );
                    }}
                    disabled={
                      !form.cityId
                    }
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                    اقتراح منطقة / حي جديد
                  </button>
                </div>

                <p className="mt-2 text-xs leading-5 text-slate-400">
                  المنطقة الجديدة تُرسل
                  للإدارة للمراجعة، وبعد
                  اعتمادها ستظهر ضمن مناطق
                  المدينة.
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  العنوان بالتفصيل
                </label>

                <input
                  value={
                    form.address
                  }
                  onChange={(e) =>
                    updateField(
                      "address",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  placeholder="مثال: شارع السلام، بجوار..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  خط العرض Latitude
                </label>

                <input
                  value={
                    form.latitude
                  }
                  onChange={(e) =>
                    updateField(
                      "latitude",
                      e.target.value
                    )
                  }
                  dir="ltr"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  placeholder="27.9158"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  خط الطول Longitude
                </label>

                <input
                  value={
                    form.longitude
                  }
                  onChange={(e) =>
                    updateField(
                      "longitude",
                      e.target.value
                    )
                  }
                  dir="ltr"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  placeholder="34.3299"
                />
              </div>

              <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={
                    getCurrentLocation
                  }
                  disabled={
                    locationLoading
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {locationLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      جاري تحديد الموقع...
                    </>
                  ) : (
                    <>
                      <Navigation className="h-4 w-4" />
                      تحديد موقعي الحالي
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={
                    openDirections
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  <ExternalLink className="h-4 w-4" />
                  فتح الاتجاهات
                </button>
              </div>
            </div>
          </section>

          {/* ===================================================
              Contact
          ==================================================== */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                <Phone className="h-5 w-5 text-slate-700" />
              </div>

              <div>
                <h2 className="font-black text-slate-900">
                  بيانات التواصل
                </h2>

                <p className="text-sm text-slate-500">
                  وسائل التواصل والموقع الإلكتروني
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  رقم الهاتف
                </label>

                <div className="relative">
                  <Phone className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    value={
                      form.phone
                    }
                    onChange={(e) =>
                      updateField(
                        "phone",
                        e.target.value
                      )
                    }
                    dir="ltr"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-10 text-left outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    placeholder="01xxxxxxxxx"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  واتساب
                </label>

                <div className="relative">
                  <MessageCircle className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    value={
                      form.whatsapp
                    }
                    onChange={(e) =>
                      updateField(
                        "whatsapp",
                        e.target.value
                      )
                    }
                    dir="ltr"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-10 text-left outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    placeholder="01xxxxxxxxx"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  الموقع الإلكتروني
                </label>

                <div className="relative">
                  <Globe className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    value={
                      form.website
                    }
                    onChange={(e) =>
                      updateField(
                        "website",
                        e.target.value
                      )
                    }
                    dir="ltr"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-10 text-left outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  نطاق الأسعار
                </label>

                <select
                  value={
                    form.priceRange
                  }
                  onChange={(e) =>
                    updateField(
                      "priceRange",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                >
                  <option value="">
                    اختر نطاق الأسعار
                  </option>

                  <option value="$">
                    $ اقتصادي
                  </option>

                  <option value="$$">
                    $$ متوسط
                  </option>

                  <option value="$$$">
                    $$$ مرتفع
                  </option>

                  <option value="$$$$">
                    $$$$ مرتفع جدًا
                  </option>
                </select>
              </div>
            </div>
          </section>

          {/* ===================================================
              Save Bar
          ==================================================== */}

          <div className="sticky bottom-4 z-20">
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-500">
                تأكد من مراجعة بيانات النشاط قبل الحفظ.
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    حفظ بيانات النشاط
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* =======================================================
          Area Suggestion Modal
      ======================================================== */}

      {areaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div
            className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  اقتراح منطقة / حي جديد
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  {selectedCity
                    ? `المدينة: ${selectedCity.name}`
                    : "اختر المدينة أولًا"}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setAreaModalOpen(
                    false
                  )
                }
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={
                submitAreaSuggestion
              }
              className="space-y-5 p-5"
            >
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  اسم المنطقة / الحي
                </label>

                <input
                  autoFocus
                  value={
                    areaSuggestionName
                  }
                  onChange={(e) =>
                    setAreaSuggestionName(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  placeholder="مثال: الهضبة الجديدة"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  ملاحظات
                  <span className="mr-1 font-normal text-slate-400">
                    (اختياري)
                  </span>
                </label>

                <textarea
                  value={
                    areaSuggestionNotes
                  }
                  onChange={(e) =>
                    setAreaSuggestionNotes(
                      e.target.value
                    )
                  }
                  rows={4}
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  placeholder="أي معلومات إضافية تساعد الإدارة في مراجعة الاقتراح..."
                />
              </div>

              <div className="rounded-xl bg-slate-50 p-3 text-xs leading-6 text-slate-500">
                سيتم إرسال الاقتراح إلى
                الإدارة، ولن يتم إضافته مباشرة
                إلى قائمة المناطق إلا بعد
                اعتماده.
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setAreaModalOpen(
                      false
                    )
                  }
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={
                    sendingAreaSuggestion
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sendingAreaSuggestion ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      إرسال الاقتراح
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}