import {
  ArrowLeft,
  Building2,
  ClipboardCheck,
  LayoutDashboard,
  MapPin,
  ShieldCheck,
  Users,
} from "lucide-react";

import Link from "next/link";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";

export default async function AdminPage() {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "Admin") {
    redirect("/");
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-50"
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ================================================= */}
        {/* PAGE HEADER */}
        {/* ================================================= */}

        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
                <ShieldCheck size={28} />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-500">
                  لوحة إدارة قُرب
                </p>

                <h1 className="mt-1 text-2xl font-black text-slate-900">
                  أهلاً بيك، {user.fullName}
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  إدارة المنصة والأنشطة والمستخدمين
                </p>
              </div>
            </div>

            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              العودة للموقع
              <ArrowLeft size={16} />
            </Link>
          </div>
        </div>

        {/* ================================================= */}
        {/* TITLE */}
        {/* ================================================= */}

        <div className="mb-5">
          <h2 className="text-xl font-black text-slate-900">
            لوحة التحكم
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            اختر القسم الذي تريد إدارته
          </p>
        </div>

        {/* ================================================= */}
        {/* ADMIN CARDS */}
        {/* ================================================= */}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

          {/* طلبات ملكية الأنشطة */}

          <AdminCard
            href="/admin/ownership-requests"
            icon={
              <ClipboardCheck size={28} />
            }
            title="طلبات ملكية الأنشطة"
            description="مراجعة طلبات إنشاء الأنشطة وإثبات الملكية"
          />

          {/* اقتراحات المناطق */}

          <AdminCard
            href="/admin/area-suggestions"
            icon={
              <MapPin size={28} />
            }
            title="اقتراحات المناطق"
            description="مراجعة واعتماد المناطق الجديدة المقترحة من المستخدمين"
          />

          {/* الأنشطة */}

          <AdminCard
            href="/admin/businesses"
            icon={
              <Building2 size={28} />
            }
            title="الأنشطة"
            description="إدارة الأنشطة وحالات الاعتماد والنشر"
            disabled
          />

          {/* المستخدمون */}

          <AdminCard
            href="/admin/users"
            icon={
              <Users size={28} />
            }
            title="المستخدمون"
            description="إدارة المستخدمين والأدوار والحسابات"
            disabled
          />
        </div>

        {/* ================================================= */}
        {/* ACCOUNT INFO */}
        {/* ================================================= */}

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
              <LayoutDashboard size={22} />
            </div>

            <div>
              <h3 className="font-black text-slate-900">
                حساب الإدارة
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                الدور الحالي: مدير النظام
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminCard({
  href,
  icon,
  title,
  description,
  disabled = false,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <div className="relative rounded-3xl border border-slate-200 bg-white p-6 opacity-60 shadow-sm">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          {icon}
        </div>

        <h3 className="text-lg font-black text-slate-900">
          {title}
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          {description}
        </p>

        <span className="mt-5 inline-flex rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">
          قريبًا
        </span>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg"
    >
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white transition group-hover:scale-105">
        {icon}
      </div>

      <h3 className="text-lg font-black text-slate-900">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>

      <div className="mt-5 inline-flex items-center gap-2 text-sm font-black text-sky-600">
        فتح القسم

        <ArrowLeft
          size={16}
          className="transition group-hover:-translate-x-1"
        />
      </div>
    </Link>
  );
}