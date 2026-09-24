"use client";

import {
  ArrowLeft,
  BadgeCheck,
  Clock3,
  LoaderCircle,
  MapPin,
  Plus,
  Store,
} from "lucide-react";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Business {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  categoryName: string;
  cityName: string;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  status:
    | "Pending"
    | "Approved"
    | "Rejected"
    | "Suspended";
  isVerified: boolean;
  isActive: boolean;
  latitude: string | null;
  longitude: string | null;
  createdAt: string;
  updatedAt: string;
  coverImage: string | null;
}

interface SessionUser {
  id: number;
  fullName: string;
  email: string | null;
  phone: string | null;
  role:
    | "User"
    | "BusinessOwner"
    | "Admin";
}

export default function OwnerDashboard() {
  const [user, setUser] =
    useState<SessionUser | null>(null);

  const [businesses, setBusinesses] =
    useState<Business[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const [
        userResponse,
        businessesResponse,
      ] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/owner/businesses"),
      ]);

      const userResult =
        await userResponse.json();

      const businessesResult =
        await businessesResponse.json();

      if (
        userResponse.ok &&
        userResult.success
      ) {
        setUser(
          userResult.user
        );
      }

      if (
        businessesResponse.ok &&
        businessesResult.success
      ) {
        setBusinesses(
          businessesResult.data ?? []
        );
      } else {
        setError(
          businessesResult.message ??
            "تعذر تحميل أنشطتك"
        );
      }
    } catch (error) {
      console.error(
        "Owner dashboard:",
        error
      );

      setError(
        "حدث خطأ أثناء تحميل لوحة التحكم"
      );
    } finally {
      setLoading(false);
    }
  }

  function statusLabel(
    status: Business["status"]
  ) {
    switch (status) {
      case "Approved":
        return "معتمد";

      case "Rejected":
        return "مرفوض";

      case "Suspended":
        return "موقوف";

      default:
        return "قيد المراجعة";
    }
  }

  function statusClass(
    status: Business["status"]
  ) {
    switch (status) {
      case "Approved":
        return "bg-emerald-50 text-emerald-700";

      case "Rejected":
        return "bg-rose-50 text-rose-700";

      case "Suspended":
        return "bg-amber-50 text-amber-700";

      default:
        return "bg-sky-50 text-sky-700";
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          جاري تحميل لوحة التحكم...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 text-sm font-bold text-sky-600">
              لوحة صاحب النشاط
            </div>

            <h1 className="text-3xl font-black text-slate-900 sm:text-4xl">
              أهلاً {user?.fullName}
            </h1>

            <p className="mt-2 text-sm leading-7 text-slate-500">
              من هنا تقدر تدير أنشطتك وتتابع حالة المراجعة.
            </p>
          </div>

          <Link
            href="/owner/register"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            إضافة نشاط جديد
          </Link>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="text-xs font-bold text-slate-400">
              إجمالي الأنشطة
            </div>

            <div className="mt-2 text-3xl font-black text-slate-900">
              {businesses.length}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="text-xs font-bold text-slate-400">
              المعتمدة
            </div>

            <div className="mt-2 text-3xl font-black text-emerald-600">
              {
                businesses.filter(
                  (business) =>
                    business.status ===
                    "Approved"
                ).length
              }
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="text-xs font-bold text-slate-400">
              قيد المراجعة
            </div>

            <div className="mt-2 text-3xl font-black text-sky-600">
              {
                businesses.filter(
                  (business) =>
                    business.status ===
                    "Pending"
                ).length
              }
            </div>
          </div>
        </div>

        <section className="mt-8">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">
                أنشطتك
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                كل الأنشطة المرتبطة بحسابك.
              </p>
            </div>
          </div>

          {!businesses.length ? (
            <div className="rounded-4xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <Store className="mx-auto h-10 w-10 text-slate-300" />

              <h3 className="mt-4 text-lg font-black text-slate-800">
                لسه مفيش أنشطة
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                أضف أول نشاط ليك وابدأ تظهر على قُرب.
              </p>

              <Link
                href="/owner/register"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-bold text-white"
              >
                <Plus className="h-4 w-4" />
                إضافة النشاط
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {businesses.map(
                (business) => (
                  <article
                    key={business.id}
                    className="overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="relative h-40 bg-slate-100">
                      {business.coverImage ? (
                        <img
                          src={
                            business.coverImage
                          }
                          alt={
                            business.name
                          }
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-5xl font-black text-sky-100">
                          قُرب
                        </div>
                      )}

                      <div
                        className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-xs font-black ${statusClass(
                          business.status
                        )}`}
                      >
                        {
                          statusLabel(
                            business.status
                          )
                        }
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-xl font-black text-slate-900">
                            {
                              business.name
                            }
                          </h3>

                          <div className="mt-1 text-sm font-semibold text-sky-600">
                            {
                              business.categoryName
                            }
                          </div>
                        </div>

                        {business.isVerified && (
                          <BadgeCheck className="h-6 w-6 shrink-0 text-sky-600" />
                        )}
                      </div>

                      <div className="mt-5 space-y-3 text-sm text-slate-500">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-sky-600" />
                          {
                            business.cityName
                          }

                          {business.address &&
                            ` — ${business.address}`}
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock3 className="h-4 w-4 text-sky-600" />

                          {new Date(
                            business.createdAt
                          ).toLocaleDateString(
                            "ar-EG"
                          )}
                        </div>
                      </div>

                      <div className="mt-5 flex gap-2">
                        <Link
                          href={`/businesses/${business.id}`}
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-bold text-white"
                        >
                          عرض النشاط
                          <ArrowLeft className="h-4 w-4" />
                        </Link>

                        <Link
                          href={`/owner/dashboard/businesses/${business.id}`}
                          className="rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-700"
                        >
                          إدارة
                        </Link>
                      </div>
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

