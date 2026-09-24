import Link from "next/link";
import {
  MapPinned,
  Globe,
  Share2,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-600 text-white">
                <MapPinned className="h-6 w-6" />
              </div>

              <div>
                <div className="text-xl font-black">
                  قُرب
                </div>

                <div className="text-xs text-slate-500">
                  كل اللي حواليك
                </div>
              </div>
            </div>

            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-500">
              منصة محلية تساعدك تكتشف الأماكن والخدمات
              القريبة منك في جنوب سيناء وتوصل لها بسهولة.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-slate-900">
              روابط
            </h3>

            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-500">
              <Link
                href="/"
                className="transition hover:text-slate-900"
              >
                الرئيسية
              </Link>

              <Link
                href="/businesses"
                className="transition hover:text-slate-900"
              >
                الأماكن
              </Link>

              <Link
                href="/map"
                className="transition hover:text-slate-900"
              >
                الخريطة
              </Link>

              <Link
                href="/owner/register"
                className="transition hover:text-slate-900"
              >
                أضف نشاطك
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-slate-900">
              تواصل معنا
            </h3>

            <div className="mt-4 flex gap-2">
              <a
                href="#"
                aria-label="الموقع"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
              >
                <Globe className="h-4 w-4" />
              </a>

              <a
                href="#"
                aria-label="مشاركة"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
              >
                <Share2 className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-100 pt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} قُرب — جميع الحقوق محفوظة
        </div>
      </div>
    </footer>
  );
}

