"use client";

import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
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

    if (
      !fullName.trim() ||
      !phone.trim() ||
      !password
    ) {
      setError(
        "من فضلك أكمل البيانات المطلوبة"
      );
      return;
    }

    if (password.length < 6) {
      setError(
        "كلمة المرور يجب ألا تقل عن 6 أحرف"
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        "كلمتا المرور غير متطابقتين"
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            fullName,
            email,
            phone,
            password,
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok || !result.success) {
        setError(
          result.message ??
            "تعذر إنشاء الحساب"
        );
        return;
      }

      router.push("/");
      router.refresh();
    } catch (error) {
      console.error(
        "Register:",
        error
      );

      setError(
        "حدث خطأ أثناء الاتصال بالخادم"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[75vh] bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-lg">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900"
        >
          <ArrowRight className="h-4 w-4" />
          الرئيسية
        </Link>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-lg shadow-sky-600/20">
              <UserPlus className="h-7 w-7" />
            </div>

            <h1 className="mt-5 text-2xl font-black text-slate-900">
              إنشاء حساب
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              اعمل حساب مجاني على قُرب
            </p>
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold leading-6 text-rose-700">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="mt-7 space-y-4"
          >
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                الاسم بالكامل
              </label>

              <input
                value={fullName}
                onChange={(event) =>
                  setFullName(
                    event.target.value
                  )
                }
                placeholder="اسمك بالكامل"
                autoComplete="name"
                className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  رقم الهاتف
                </label>

                <input
                  value={phone}
                  onChange={(event) =>
                    setPhone(
                      event.target.value
                    )
                  }
                  placeholder="01xxxxxxxxx"
                  autoComplete="tel"
                  dir="ltr"
                  className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  البريد الإلكتروني
                  <span className="mr-1 text-xs font-normal text-slate-400">
                    اختياري
                  </span>
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  placeholder="name@example.com"
                  autoComplete="email"
                  dir="ltr"
                  className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
                />
              </div>
            </div>

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
                  autoComplete="new-password"
                  placeholder="6 أحرف على الأقل"
                  className="h-12 w-full rounded-2xl border border-slate-200 px-4 pl-12 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (value) =>
                        !value
                    )
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                تأكيد كلمة المرور
              </label>

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={
                  confirmPassword
                }
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                autoComplete="new-password"
                placeholder="كرر كلمة المرور"
                className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
              />
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 text-xs leading-6 text-slate-500">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
              بعد إنشاء الحساب تقدر تحفظ الأماكن
              وتكتب تقييمات وتضيف نشاط جديد.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60"
            >
              {loading ? (
                <LoaderCircle className="h-5 w-5 animate-spin" />
              ) : (
                <UserPlus className="h-5 w-5" />
              )}

              {loading
                ? "جاري إنشاء الحساب..."
                : "إنشاء الحساب"}
            </button>
          </form>

          <div className="my-6 h-px bg-slate-100" />

          <div className="text-center text-sm text-slate-500">
            عندك حساب بالفعل؟

            <Link
              href="/login"
              className="mr-1 font-black text-sky-600 hover:text-sky-700"
            >
              تسجيل الدخول
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}