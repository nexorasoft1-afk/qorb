"use client";

import Link from "next/link";
import {
  BadgeCheck,
  MapPin,
  Phone,
  Star,
  MessageCircle,
} from "lucide-react";

export interface BusinessCardData {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  category_name?: string | null;
  city_name?: string | null;
  cover_image?: string | null;
  rating?: number | string | null;
  reviews_count?: number | string | null;
  is_verified?: boolean;
  distance_meters?: number | string | null;
}

interface BusinessCardProps {
  business: BusinessCardData;
}

function formatDistance(
  value: number | string | null | undefined
) {
  if (value === null || value === undefined) {
    return null;
  }

  const meters = Number(value);

  if (!Number.isFinite(meters)) {
    return null;
  }

  if (meters < 1000) {
    return `${Math.round(meters)} م`;
  }

  return `${(meters / 1000).toFixed(1)} كم`;
}

export default function BusinessCard({
  business,
}: BusinessCardProps) {
  const rating = Number(business.rating ?? 0);
  const reviews = Number(
    business.reviews_count ?? 0
  );

  const distance = formatDistance(
    business.distance_meters
  );

  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-xl">
      <Link
        href={`/businesses/${business.id}`}
        className="block"
      >
        <div className="relative h-48 overflow-hidden bg-slate-100">
  {(
    business.cover_image ||
    (business as any).coverImageUrl ||
    (business as any).imageUrl ||
    (business as any).image ||
    null
  ) ? (
    <img
      src={
        business.cover_image ||
        (business as any).coverImageUrl ||
        (business as any).imageUrl ||
        (business as any).image
      }
      alt={business.name}
      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
      onError={(event) => {
        console.error(
          "[BusinessCard] Image failed:",
          event.currentTarget.src
        );

        event.currentTarget.style.display = "none";
      }}
    />
  ) : (
    <div className="flex h-full items-center justify-center bg-linear-to-br from-sky-50 to-slate-100 text-5xl font-black text-sky-200">
      قُرب
    </div>
  )}

  {business.is_verified && (
    <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-sky-700 shadow">
      <BadgeCheck className="h-4 w-4" />
      موثق
    </div>
  )}
</div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-black text-slate-900">
                {business.name}
              </h3>

              {business.category_name && (
                <div className="mt-1 text-sm text-slate-500">
                  {business.category_name}
                </div>
              )}
            </div>

            {distance && (
              <span className="shrink-0 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700">
                {distance}
              </span>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-sm font-black text-amber-700">
              <Star className="h-4 w-4 fill-current" />
              {rating.toFixed(1)}
            </div>

            <span className="text-xs text-slate-400">
              ({reviews} تقييم)
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-2 text-sm text-slate-500">
            {business.city_name && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" />

                <span>
                  {business.address
                    ? `${business.address}، ${business.city_name}`
                    : business.city_name}
                </span>
              </div>
            )}

            {business.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" />

                <span dir="ltr">
                  {business.phone}
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>

      <div className="flex gap-2 border-t border-slate-100 p-4">
        {business.phone && (
          <a
            href={`tel:${business.phone}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <Phone className="h-4 w-4" />
            اتصال
          </a>
        )}

        {business.whatsapp && (
          <a
            href={`https://wa.me/${business.whatsapp.replace(
              /\D/g,
              ""
            )}`}
            target="_blank"
            rel="noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-50 py-2.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <MessageCircle className="h-4 w-4" />
            واتساب
          </a>
        )}
      </div>
    </article>
  );
}

