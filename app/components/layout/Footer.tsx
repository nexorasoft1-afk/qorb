import Link from "next/link";
import {
  Globe,
  MapPinned,
  MessageCircle,
  Phone,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

        <div className="grid gap-10 md:grid-cols-4">

          {/* Brand */}
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

            <p className="mt-4 text-xs font-semibold text-slate-400">
              أحد منتجات Nexora Soft للبرمجيات
            </p>
          </div>

          {/* Links */}
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
                href="/about"
                className="transition hover:text-slate-900"
              >
                من نحن
              </Link>

              <Link
                href="/contact"
                className="transition hover:text-slate-900"
              >
                تواصل معنا
              </Link>

              <Link
                href="/owner/register"
                className="transition hover:text-slate-900"
              >
                أضف نشاطك
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-slate-900">
              تواصل معنا
            </h3>

            <div className="mt-4 flex flex-col gap-3">

              <a
                href="tel:01005460980"
                dir="ltr"
                className="flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-sky-600"
              >
                <Phone className="h-4 w-4" />
                01005460980
              </a>

              <Link
                href="/contact"
                className="flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
              >
                <MessageCircle className="h-4 w-4" />
                كل طرق التواصل
              </Link>

              <a
                href="https://nexora-soft-website.vercel.app/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-sky-600"
              >
                <Globe className="h-4 w-4" />
                موقع Nexora Soft
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-slate-100 pt-6 text-center text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:text-right">
          <div>
            © {new Date().getFullYear()} قُرب — جميع الحقوق محفوظة
          </div>

          <div>
            تطوير وإدارة{" "}
            <span className="font-bold text-slate-500">
              Nexora Soft للبرمجيات
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

