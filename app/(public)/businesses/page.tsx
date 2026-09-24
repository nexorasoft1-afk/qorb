"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

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

function BusinessesContent() {
  const searchParams = useSearchParams();

  const initialCategory =
    searchParams.get("categoryId") ?? "";

  const [categoryId, setCategoryId] =
    useState(initialCategory);

  const [cityId, setCityId] =
    useState("");

  const [query, setQuery] =
    useState("");

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [cities, setCities] =
    useState<City[]>([]);

  const [businesses, setBusinesses] =
    useState<BusinessCardData[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function loadFilters() {
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
          "Load filters:",
          error
        );
      }
    }

    loadFilters();
  }, []);

  useEffect(() => {
    loadBusinesses();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadBusinesses() {
    setLoading(true);

    try {
      const params =
        new URLSearchParams();

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
        `/api/businesses?${params.toString()}`
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
        "Load businesses:",
        error
      );

      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch() {
    const value =
      query.trim();

    if (!value) {
      loadBusinesses();
      return;
    }

    window.location.href =
      `/search?q=${encodeURIComponent(
        value
      )}${
        categoryId
          ? `&categoryId=${categoryId}`
          : ""
      }${
        cityId
          ? `&cityId=${cityId}`
          : ""
      }`;
  }

  function resetFilters() {
    setQuery("");
    setCategoryId("");
    setCityId("");

    setTimeout(() => {
      loadBusinesses();
    }, 0);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

        <div className="mb-8">
          <Link
            href="/"
            className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900"
          >
            <ArrowRight className="h-4 w-4" />
            الرئيسية
          </Link>

          <div className="mb-2 text-sm font-bold text-sky-600">
            دليل قُرب
          </div>

          <h1 className="text-3xl font-black text-slate-900 sm:text-4xl">
            الأماكن والخدمات
          </h1>

          <p className="mt-2 text-sm leading-7 text-slate-500">
            استكشف الأنشطة المسجلة في جنوب سيناء.
          </p>
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
          onSearch={handleSearch}
          onReset={resetFilters}
        />

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

function BusinessesLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="mb-8">
            <div className="mb-5 h-5 w-24 rounded bg-slate-200" />

            <div className="mb-3 h-4 w-24 rounded bg-slate-200" />

            <div className="h-10 w-72 rounded bg-slate-200" />

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

export default function BusinessesPage() {
  return (
    <Suspense fallback={<BusinessesLoading />}>
      <BusinessesContent />
    </Suspense>
  );
}