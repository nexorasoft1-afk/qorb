"use client";

import {
  ArrowRight,
  Heart,
  LoaderCircle,
  MapPin,
  Phone,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Favorite {
  favoriteId: number;
  createdAt: string;
  businessId: number;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  categoryId: number;
  categoryName: string;
  cityId: number;
  cityName: string;
}

export default function FavoritesPage() {
  const [favorites, setFavorites] =
    useState<Favorite[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadFavorites();
  }, []);

  async function loadFavorites() {
    setLoading(true);
    setError("");

    try {
      const response =
        await fetch(
          "/api/favorites"
        );

      const result =
        await response.json();

      if (response.status === 401) {
        setError(
          "سجل دخولك الأول علشان تشوف المفضلة."
        );
        return;
      }

      if (!response.ok || !result.success) {
        setError(
          result.message ??
            "تعذر جلب المفضلة"
        );
        return;
      }

      setFavorites(
        result.data ?? []
      );
    } catch (error) {
      console.error(
        "Favorites:",
        error
      );

      setError(
        "حدث خطأ أثناء جلب المفضلة"
      );
    } finally {
      setLoading(false);
    }
  }

  async function removeFavorite(
    businessId: number
  ) {
    try {
      const response =
        await fetch(
          `/api/favorites?businessId=${businessId}`,
          {
            method: "DELETE",
          }
        );

      const result =
        await response.json();

      if (result.success) {
        setFavorites((current) =>
          current.filter(
            (item) =>
              item.businessId !==
              businessId
          )
        );
      }
    } catch (error) {
      console.error(
        "Remove favorite:",
        error
      );
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900"
        >
          <ArrowRight className="h-4 w-4" />
          الرئيسية
        </Link>

        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-rose-600">
            <Heart className="h-4 w-4 fill-current" />
            المفضلة
          </div>

          <h1 className="text-3xl font-black text-slate-900 sm:text-4xl">
            الأماكن المحفوظة
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            الأماكن اللي حبيت تحتفظ بيها للرجوع لها بعدين.
          </p>
        </div>

        {loading && (
          <div className="mt-8 flex min-h-56 items-center justify-center rounded-3xl border border-slate-200 bg-white">
            <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
              <LoaderCircle className="h-5 w-5 animate-spin" />
              جاري تحميل المفضلة...
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 text-center">
            <Heart className="mx-auto h-10 w-10 text-slate-300" />

            <h2 className="mt-4 text-lg font-black text-slate-800">
              {error}
            </h2>

            <Link
              href="/login"
              className="mt-5 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white"
            >
              تسجيل الدخول
            </Link>
          </div>
        )}

        {!loading &&
          !error &&
          favorites.length === 0 && (
            <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <Heart className="mx-auto h-10 w-10 text-slate-300" />

              <h2 className="mt-4 text-lg font-black text-slate-800">
                المفضلة فاضية
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                لما تعجبك حاجة اضغط ❤️ وهتلاقيها هنا.
              </p>

              <Link
                href="/businesses"
                className="mt-5 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white"
              >
                استكشف الأماكن
              </Link>
            </div>
          )}

        {!loading &&
          !error &&
          favorites.length > 0 && (
            <div className="mt-8 space-y-4">
              {favorites.map(
                (favorite) => (
                  <article
                    key={
                      favorite.favoriteId
                    }
                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                      <Link
                        href={`/businesses/${favorite.businessId}`}
                        className="min-w-0"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                            <MapPin className="h-6 w-6" />
                          </div>

                          <div className="min-w-0">
                            <h2 className="truncate text-lg font-black text-slate-900">
                              {favorite.name}
                            </h2>

                            <div className="mt-1 text-sm font-semibold text-sky-600">
                              {
                                favorite.categoryName
                              }
                            </div>

                            <div className="mt-2 text-sm text-slate-500">
                              {favorite.address
                                ? `${favorite.address}، ${favorite.cityName}`
                                : favorite.cityName}
                            </div>

                            {favorite.phone && (
                              <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                                <Phone className="h-4 w-4" />
                                <span dir="ltr">
                                  {
                                    favorite.phone
                                  }
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>

                      <button
                        type="button"
                        onClick={() =>
                          removeFavorite(
                            favorite.businessId
                          )
                        }
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        إزالة
                      </button>
                    </div>
                  </article>
                )
              )}
            </div>
          )}
      </div>
    </div>
  );
}