"use client";

import {
  LoaderCircle,
  SearchX,
} from "lucide-react";

import BusinessCard, {
  type BusinessCardData,
} from "@/app/components/business/BusinessCard";

interface SearchResultsProps {
  businesses: BusinessCardData[];
  loading: boolean;
  query: string;
}

export default function SearchResults({
  businesses,
  loading,
  query,
}: SearchResultsProps) {
  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-3xl border border-slate-200 bg-white">
        <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          بنبحث عن الأماكن...
        </div>
      </div>
    );
  }

  if (!businesses.length) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 text-center">
        <SearchX className="h-10 w-10 text-slate-300" />

        <h3 className="mt-4 text-lg font-black text-slate-800">
          مفيش نتائج لبحثك
        </h3>

        <p className="mt-2 max-w-md text-sm leading-7 text-slate-500">
          {query
            ? `مقدرناش نلاقي نشاط مطابق لـ "${query}" حاليًا.`
            : "جرّب تغيير كلمة البحث أو الفلاتر."}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 text-sm text-slate-500">
        وجدنا{" "}
        <span className="font-black text-slate-900">
          {businesses.length}
        </span>{" "}
        نتيجة
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {businesses.map((business) => (
          <BusinessCard
            key={business.id}
            business={business}
          />
        ))}
      </div>
    </div>
  );
}