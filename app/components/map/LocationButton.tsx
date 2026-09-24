"use client";

import { LocateFixed } from "lucide-react";

interface LocationButtonProps {
  loading: boolean;
  onClick: () => void;
}

export default function LocationButton({
  loading,
  onClick,
}: LocationButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="absolute bottom-4 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-lg transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
      title="موقعي الحالي"
      aria-label="موقعي الحالي"
    >
      <LocateFixed
        className={`h-5 w-5 text-slate-700 ${
          loading ? "animate-spin" : ""
        }`}
      />
    </button>
  );
}