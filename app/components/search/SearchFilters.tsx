"use client";

import { RotateCcw, Search } from "lucide-react";

interface Category {
  id: number;
  name: string;
}

interface City {
  id: number;
  name: string;
}

interface SearchFiltersProps {
  query: string;
  categoryId: string;
  cityId: string;
  categories: Category[];
  cities: City[];
  onQueryChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onSearch: () => void;
  onReset: () => void;
}

export default function SearchFilters({
  query,
  categoryId,
  cityId,
  categories,
  cities,
  onQueryChange,
  onCategoryChange,
  onCityChange,
  onSearch,
  onReset,
}: SearchFiltersProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px_auto_auto]">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4">
          <Search className="h-5 w-5 shrink-0 text-slate-400" />

          <input
            value={query}
            onChange={(event) =>
              onQueryChange(event.target.value)
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onSearch();
              }
            }}
            placeholder="ابحث عن مطعم، كافيه، مغسلة، صيدلية..."
            className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </div>

        <select
          value={categoryId}
          onChange={(event) =>
            onCategoryChange(event.target.value)
          }
          className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-sky-500"
        >
          <option value="">كل التصنيفات</option>

          {categories.map((category) => (
            <option
              key={category.id}
              value={category.id}
            >
              {category.name}
            </option>
          ))}
        </select>

        <select
          value={cityId}
          onChange={(event) =>
            onCityChange(event.target.value)
          }
          className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-sky-500"
        >
          <option value="">كل المدن</option>

          {cities.map((city) => (
            <option
              key={city.id}
              value={city.id}
            >
              {city.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={onSearch}
          className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 text-sm font-bold text-white transition hover:bg-slate-800"
        >
          <Search className="h-4 w-4" />
          بحث
        </button>

        <button
          type="button"
          onClick={onReset}
          className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
        >
          <RotateCcw className="h-4 w-4" />
          إعادة
        </button>
      </div>
    </div>
  );
}