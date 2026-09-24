"use client";

import Link from "next/link";
import {
  Heart,
  LoaderCircle,
  LogOut,
  MapPinned,
  Menu,
  ShieldCheck,
  Store,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface SessionUser {
  id: number;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: "User" | "BusinessOwner" | "Admin";
}

export default function Header() {
  const router = useRouter();

  const [open, setOpen] = useState(false);

  const [user, setUser] =
    useState<SessionUser | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [loggingOut, setLoggingOut] =
    useState(false);

  useEffect(() => {
    async function loadSession() {
      try {
        const response = await fetch(
          "/api/auth/me",
          {
            cache: "no-store",
            credentials: "include",
          }
        );

        if (!response.ok) {
          setUser(null);
          return;
        }

        const result =
          await response.json();

        if (
          result.success &&
          result.authenticated &&
          result.user
        ) {
          setUser(result.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error(
          "Load session:",
          error
        );

        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, []);

  async function handleLogout() {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      const response =
        await fetch(
          "/api/auth/logout",
          {
            method: "POST",
            credentials: "include",
          }
        );

      const result =
        await response.json();

      if (result.success) {
        setUser(null);
        setOpen(false);

        router.push("/");
        router.refresh();
      }
    } catch (error) {
      console.error(
        "Logout:",
        error
      );
    } finally {
      setLoggingOut(false);
    }
  }

  function closeMobileMenu() {
    setOpen(false);
  }

  // =========================================================
  // ROLE HELPERS
  // =========================================================

  const isAdmin =
    user?.role === "Admin";

  const isBusinessOwner =
    user?.role === "BusinessOwner";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* ================================================= */}
        {/* LOGO */}
        {/* ================================================= */}

        <Link
          href="/"
          onClick={closeMobileMenu}
          className="flex items-center gap-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-lg shadow-sky-600/20">
            <MapPinned className="h-6 w-6" />
          </div>

          <div>
            <div className="text-xl font-black tracking-tight text-slate-900">
              قُرب
            </div>

            <div className="text-[10px] font-medium text-slate-500">
              كل اللي حواليك
            </div>
          </div>
        </Link>

        {/* ================================================= */}
        {/* DESKTOP NAVIGATION */}
        {/* ================================================= */}

        <nav className="hidden items-center gap-2 md:flex">
          <Link
            href="/"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            الرئيسية
          </Link>

          <Link
            href="/map"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            الخريطة
          </Link>

          <Link
            href="/businesses"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            الأماكن
          </Link>

          {/* =============================================== */}
          {/* USER / OWNER → ADD BUSINESS */}
          {/* =============================================== */}

          {!isAdmin && (
            <Link
              href="/owner/register"
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <Store className="h-4 w-4" />

              {isBusinessOwner
                ? "أضف نشاط آخر"
                : "أضف نشاطك"}
            </Link>
          )}

          {/* =============================================== */}
          {/* BUSINESS OWNER */}
          {/* =============================================== */}

          {isBusinessOwner && (
            <Link
              href="/owner/dashboard"
              className="rounded-xl bg-violet-50 px-4 py-2 text-sm font-bold text-violet-700 transition hover:bg-violet-100"
            >
              لوحة نشاطي
            </Link>
          )}

          {/* =============================================== */}
          {/* ADMIN */}
          {/* =============================================== */}

          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              <ShieldCheck className="h-4 w-4" />
              لوحة الإدارة
            </Link>
          )}
        </nav>

        {/* ================================================= */}
        {/* DESKTOP USER AREA */}
        {/* ================================================= */}

        <div className="hidden items-center gap-2 md:flex">

          {/* Favorites */}
          <Link
            href="/favorites"
            className="flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-100"
          >
            <Heart className="h-4 w-4 fill-current" />
            المفضلة
          </Link>

          {/* Loading */}
          {loading ? (
            <div className="flex h-10 w-24 items-center justify-center rounded-xl bg-slate-100">
              <LoaderCircle className="h-4 w-4 animate-spin text-slate-400" />
            </div>
          ) : user ? (
            <div className="flex items-center gap-2">

              {/* Greeting */}
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                  <User className="h-4 w-4" />
                </div>

                <div className="leading-tight">
                  <div className="text-[11px] text-slate-400">
                    أهلاً بيك
                  </div>

                  <div className="max-w-32 truncate text-sm font-black text-slate-800">
                    {user.fullName}
                  </div>
                </div>
              </div>

              {/* Logout */}
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
              >
                {loggingOut ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}

                خروج
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">

              <Link
                href="/register"
                className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
              >
                إنشاء حساب
              </Link>

              <Link
                href="/login"
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                <User className="h-4 w-4" />
                دخول
              </Link>
            </div>
          )}
        </div>

        {/* ================================================= */}
        {/* MOBILE TOGGLE */}
        {/* ================================================= */}

        <button
          type="button"
          onClick={() =>
            setOpen(
              (value) => !value
            )
          }
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 md:hidden"
          aria-label="القائمة"
        >
          {open ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* =================================================== */}
      {/* MOBILE MENU */}
      {/* =================================================== */}

      {open && (
        <div className="border-t border-slate-100 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-2">

            {/* User information */}
            {user && !loading && (
              <div className="mb-2 rounded-2xl bg-sky-50 p-4">
                <div className="text-xs text-sky-600">
                  أهلاً بيك
                </div>

                <div className="mt-1 text-base font-black text-slate-900">
                  {user.fullName}
                </div>

                <div className="mt-1 text-xs font-semibold text-slate-500">
                  {isAdmin
                    ? "مدير النظام"
                    : isBusinessOwner
                      ? "صاحب نشاط"
                      : "مستخدم"}
                </div>
              </div>
            )}

            <Link
              href="/"
              onClick={closeMobileMenu}
              className="rounded-xl px-4 py-3 text-sm font-semibold hover:bg-slate-50"
            >
              الرئيسية
            </Link>

            <Link
              href="/map"
              onClick={closeMobileMenu}
              className="rounded-xl px-4 py-3 text-sm font-semibold hover:bg-slate-50"
            >
              الخريطة
            </Link>

            <Link
              href="/businesses"
              onClick={closeMobileMenu}
              className="rounded-xl px-4 py-3 text-sm font-semibold hover:bg-slate-50"
            >
              الأماكن
            </Link>

            {/* Favorites */}
            <Link
              href="/favorites"
              onClick={closeMobileMenu}
              className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600"
            >
              <Heart className="h-4 w-4 fill-current" />
              المفضلة
            </Link>

            {/* User / Owner */}
            {!isAdmin && (
              <Link
                href="/owner/register"
                onClick={closeMobileMenu}
                className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold hover:bg-slate-50"
              >
                <Store className="h-4 w-4" />

                {isBusinessOwner
                  ? "أضف نشاط آخر"
                  : "أضف نشاطك"}
              </Link>
            )}

            {/* Business Owner Dashboard */}
            {isBusinessOwner && (
              <Link
                href="/owner/dashboard"
                onClick={closeMobileMenu}
                className="rounded-xl bg-violet-50 px-4 py-3 text-sm font-bold text-violet-700"
              >
                لوحة نشاطي
              </Link>
            )}

            {/* Admin Dashboard */}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={closeMobileMenu}
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white"
              >
                <ShieldCheck className="h-4 w-4" />
                لوحة الإدارة
              </Link>
            )}

            {/* Logged out */}
            {!user && !loading && (
              <>
                <Link
                  href="/register"
                  onClick={closeMobileMenu}
                  className="rounded-xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  إنشاء حساب
                </Link>

                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className="rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-bold text-white"
                >
                  تسجيل الدخول
                </Link>
              </>
            )}

            {/* Logout */}
            {user && !loading && (
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600"
              >
                {loggingOut ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}

                تسجيل الخروج
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}