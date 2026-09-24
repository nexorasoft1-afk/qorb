"use client";

import { ArrowRight, MapPin } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";

import SearchFilters from "@/app/components/search/SearchFilters";
import SearchResults from "@/app/components/search/SearchResults";
import type { BusinessCardData } from "@/app/components/business/BusinessCard";

interface Category {
  id: number;
  name: string;
}

interface City {
  id: number;
  name: string;
}

function SearchContent() {
  const searchParams = useSearchParams();

  const initialQuery =
    searchParams.get("q") ?? "";

  const [query, setQuery] =
    useState(initialQuery);

  const [categoryId, setCategoryId] =
    useState("");

  const [cityId, setCityId] =
    useState("");

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [cities, setCities] =
    useState<City[]>([]);

  const [businesses, setBusinesses] =
    useState<BusinessCardData[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [location, setLocation] =
    useState<{
      lat: number;
      lng: number;
    } | null>(null);

  const searchTitle = useMemo(() => {
    if (query.trim()) {
      return `نتائج البحث عن "${query.trim()}"`;
    }

    return "اكتشف الأماكن";
  }, [query]);

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [
          categoriesResponse,
          citiesResponse,
        ] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/cities"),
        ]);

        const categoriesResult =
          await categoriesResponse.json();

        const citiesResult =
          await citiesResponse.json();

        if (categoriesResult.success) {
          setCategories(
            categoriesResult.data ?? []
          );
        }

        if (citiesResult.success) {
          setCities(
            (citiesResult.data ?? []).map(
              (city: {
                id: number;
                name: string;
              }) => ({
                id: city.id,
                name: city.name,
              })
            )
          );
        }
      } catch (error) {
        console.error(
          "Load search filters:",
          error
        );
      }
    };

    loadFilters();
  }, []);

  useEffect(() => {
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (!lat || !lng) {
      return;
    }

    const latitude = Number(lat);
    const longitude = Number(lng);

    if (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude)
    ) {
      setLocation({
        lat: latitude,
        lng: longitude,
      });
    }
  }, [searchParams]);

  useEffect(() => {
    if (initialQuery.trim()) {
      searchBusinesses(initialQuery);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function searchBusinesses(
    searchQuery = query
  ) {
    const value =
      searchQuery.trim();

    if (!value) {
      setBusinesses([]);
      return;
    }

    setLoading(true);

    try {
      const params =
        new URLSearchParams();

      params.set("q", value);

      if (categoryId) {
        params.set(
          "categoryId",
          categoryId
        );
      }

      if (cityId) {
        params.set(
          "cityId",
          cityId
        );
      }

      const response = await fetch(
        `/api/businesses/search?${params.toString()}`
      );

      const result =
        await response.json();

      if (result.success) {
        setBusinesses(
          result.data ?? []
        );
      } else {
        setBusinesses([]);
      }
    } catch (error) {
      console.error(
        "Search businesses:",
        error
      );

      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  }

  function resetSearch() {
    setQuery("");
    setCategoryId("");
    setCityId("");
    setBusinesses([]);
  }

  async function nearbySearch() {
    if (!navigator.geolocation) {
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const params =
            new URLSearchParams({
              lat:
                position.coords.latitude.toString(),
              lng:
                position.coords.longitude.toString(),
              radius: "10000",
              limit: "50",
            });

          if (categoryId) {
            params.set(
              "categoryId",
              categoryId
            );
          }

          if (cityId) {
            params.set(
              "cityId",
              cityId
            );
          }

          const response =
            await fetch(
              `/api/businesses/nearby?${params.toString()}`
            );

          const result =
            await response.json();

          if (result.success) {
            setBusinesses(
              result.data ?? []
            );

            setLocation({
              lat:
                position.coords.latitude,
              lng:
                position.coords.longitude,
            });
          }
        } catch (error) {
          console.error(
            "Nearby search:",
            error
          );
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

        <div className="mb-8">
          <Link
            href="/"
            className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-slate-900"
          >
            <ArrowRight className="h-4 w-4" />
            الرئيسية
          </Link>

          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <div className="mb-2 text-sm font-bold text-sky-600">
                البحث
              </div>

              <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                {searchTitle}
              </h1>

              <p className="mt-2 text-sm leading-7 text-slate-500">
                ابحث بالاسم أو الخدمة أو التصنيف أو
                العنوان.
              </p>
            </div>

            <button
              type="button"
              onClick={nearbySearch}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-black text-white transition hover:bg-sky-700"
            >
              <MapPin className="h-4 w-4" />
              أقرب أماكن ليا
            </button>
          </div>
        </div>

        <SearchFilters
          query={query}
          categoryId={categoryId}
          cityId={cityId}
          categories={categories}
          cities={cities}
          onQueryChange={setQuery}
          onCategoryChange={setCategoryId}
          onCityChange={setCityId}
          onSearch={() =>
            searchBusinesses()
          }
          onReset={resetSearch}
        />

        {location && (
          <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-xs font-semibold text-sky-700">
            تم استخدام موقعك للبحث عن الأماكن
            القريبة.
          </div>
        )}

        <div className="mt-8">
          <SearchResults
            businesses={businesses}
            loading={loading}
            query={query}
          />
        </div>

      </div>
    </div>
  );
}

function SearchLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="animate-pulse">

          <div className="mb-8">
            <div className="mb-5 h-5 w-24 rounded bg-slate-200" />

            <div className="mb-3 h-4 w-16 rounded bg-slate-200" />

            <div className="h-10 w-80 max-w-full rounded bg-slate-200" />

            <div className="mt-3 h-4 w-96 max-w-full rounded bg-slate-200" />
          </div>

          <div className="h-32 rounded-2xl bg-white shadow-sm" />

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(
              (item) => (
                <div
                  key={item}
                  className="h-80 rounded-2xl bg-white shadow-sm"
                />
              )
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchLoading />}>
      <SearchContent />
    </Suspense>
  );
}