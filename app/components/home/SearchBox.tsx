"use client";

import { Search, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearch() {
    const value = query.trim();

    if (!value) {
      return;
    }

    router.push(
      `/search?q=${encodeURIComponent(value)}`
    );
  }

  return (
    <div className="w-full max-w-3xl">
      <div className="flex flex-col gap-3 rounded-3xl bg-white p-3 shadow-xl shadow-slate-900/10 sm:flex-row">
        <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-200 px-4">
          <Search className="h-5 w-5 shrink-0 text-slate-400" />

          <input
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleSearch();
              }
            }}
            placeholder="إيه اللي بتدور عليه؟"
            className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>

        <button
          type="button"
          onClick={handleSearch}
          className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-7 text-sm font-bold text-white transition hover:bg-slate-800"
        >
          <Search className="h-4 w-4" />
          بحث
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          if (!navigator.geolocation) {
            return;
          }

          navigator.geolocation.getCurrentPosition(
            (position) => {
              const params = new URLSearchParams({
                lat: position.coords.latitude.toString(),
                lng: position.coords.longitude.toString(),
              });

              router.push(
                `/search?${params.toString()}`
              );
            }
          );
        }}
        className="mt-3 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
      >
        <MapPin className="h-4 w-4" />
        استخدم موقعي الحالي
      </button>
    </div>
  );
}