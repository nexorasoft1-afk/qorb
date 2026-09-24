"use client";

import Link from "next/link";
import {
  BriefcaseBusiness,
  Car,
  Dumbbell,
  GraduationCap,
  HeartPulse,
  Hotel,
  House,
  Palmtree,
  ShoppingBag,
  Sparkles,
  Utensils,
  Wrench,
  type LucideIcon,
} from "lucide-react";

interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  image: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface CategoryGridProps {
  categories: Category[];
}

const iconMap: Record<
  string,
  LucideIcon
> = {
  Utensils,
  Hotel,
  Palmtree,
  Car,
  HeartPulse,
  Sparkles,
  ShoppingBag,
  House,
  Wrench,
  BriefcaseBusiness,
  GraduationCap,
  Dumbbell,
};

export default function CategoryGrid({
  categories,
}: CategoryGridProps) {
  if (!categories.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
        لا توجد تصنيفات حاليًا.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {categories.map((category) => {
        const Icon =
          iconMap[category.icon ?? ""] ??
          MapPinFallback;

        return (
          <Link
            key={category.id}
            href={`/businesses?categoryId=${category.id}`}
            className="group rounded-2xl border border-slate-200 bg-white p-5 text-center transition hover:-translate-y-1 hover:border-sky-200 hover:shadow-lg"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 transition group-hover:bg-sky-600 group-hover:text-white">
              <Icon className="h-6 w-6" />
            </div>

            <div className="mt-3 text-sm font-bold leading-6 text-slate-800">
              {category.name}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function MapPinFallback(
  props: React.SVGProps<SVGSVGElement>
) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...props}
    >
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}