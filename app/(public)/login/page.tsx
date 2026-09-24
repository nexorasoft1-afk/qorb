"use client";

import {
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  LogIn,
  MapPinned,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type UserRole =
  | "User"
  | "BusinessOwner"
  | "Admin";

export default function LoginPage() {
  const [emailOrPhone, setEmailOrPhone] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!emailOrPhone.trim()) {
      setError(
        "أدخل البريد الإلكتروني أو رقم الهاتف"
      );
      return;
    }

    if (!password) {
      setError("أدخل كلمة المرور");
      return;
    }

    setLoading(true);

    try {
      // ===================================================
      // LOGIN
      // ===================================================

      const response = await fetch(
        "/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            emailOrPhone:
              emailOrPhone.trim(),
            password,
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok || !result.success) {
        setError(
          result.message ??
            "تعذر تسجيل الدخول"
        );
        setLoading(false);
        return;
      }

      // ===================================================
      // GET CURRENT SESSION
      // ===================================================

      const meResponse = await fetch(
        "/api/auth/me",
        {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        }
      );

      const meResult =
        await meResponse.json();

      if (
        !meResponse.ok ||
        !meResult.success ||
        !meResult.authenticated
      ) {
        setError(
          "تم تسجيل الدخول ولكن تعذر تحديد صلاحيات الحساب"
        );
        setLoading(false);
        return;
      }

      // ===================================================
      // استخراج الـRole
      // ===================================================

      const role: UserRole | undefined =
        meResult?.user?.role ??
        meResult?.data?.role ??
        meResult?.data?.user?.role ??
        meResult?.role;

      // ===================================================
      // REDIRECT BY ROLE
      // ===================================================

      if (role === "Admin") {
        window.location.href = "/admin";
        return;
      }

      if (role === "BusinessOwner") {
        window.location.href =
          "/owner/dashboard";
        return;
      }

      if (role === "User") {
        window.location.href = "/";
        return;
      }

      // ===================================================
      // ROLE غير معروف
      // ===================================================

      setError(
        "تم تسجيل الدخول ولكن نوع الحساب غير معروف"
      );
      setLoading(false);
    } catch (error) {
      console.error(
        "Login:",
        error
      );

      setError(
        "حدث خطأ أثناء الاتصال بالخادم"
      );

      setLoading(false);
    }
  }

  return (
    <div className="min-h-[75vh] bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-md">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900"
        >
          <ArrowRight className="h-4 w-4" />
          الرئيسية
        </Link>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {/* ================================================= */}
          {/* LOGO / TITLE */}
          {/* ================================================= */}

          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-lg shadow-sky-600/20">
              <MapPinned className="h-7 w-7" />
            </div>

            <h1 className="mt-5 text-2xl font-black text-slate-900">
              أهلاً بيك في قُرب
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              سجّل دخولك علشان تكمل
            </p>
          </div>

          {/* ================================================= */}
          {/* ERROR */}
          {/* ================================================= */}

          {error && (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold leading-6 text-rose-700">
              {error}
            </div>
          )}

          {/* ================================================= */}
          {/* FORM */}
          {/* ================================================= */}

          <form
            onSubmit={handleSubmit}
            className="mt-7 space-y-4"
          >
            {/* Email / Phone */}
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                البريد الإلكتروني أو الهاتف
              </label>

              <input
                value={emailOrPhone}
                onChange={(event) =>
                  setEmailOrPhone(
                    event.target.value
                  )
                }
                autoComplete="username"
                placeholder="example@email.com"
                disabled={loading}
                className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                كلمة المرور
              </label>

              <div className="relative">
                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  autoComplete="current-password"
                  placeholder="••••••••"
                  disabled={loading}
                  className="h-12 w-full rounded-2xl border border-slate-200 px-4 pl-12 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (value) =>
                        !value
                    )
                  }
                  disabled={loading}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={
                    showPassword
                      ? "إخفاء كلمة المرور"
                      : "إظهار كلمة المرور"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60"
            >
              {loading ? (
                <LoaderCircle className="h-5 w-5 animate-spin" />
              ) : (
                <LogIn className="h-5 w-5" />
              )}

              {loading
                ? "جاري الدخول..."
                : "تسجيل الدخول"}
            </button>
          </form>

          {/* ================================================= */}
          {/* REGISTER */}
          {/* ================================================= */}

          <div className="my-6 h-px bg-slate-100" />

          <div className="text-center text-sm text-slate-500">
            معندكش حساب؟

            <Link
              href="/register"
              className="mr-1 font-black text-sky-600 hover:text-sky-700"
            >
              إنشاء حساب
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}