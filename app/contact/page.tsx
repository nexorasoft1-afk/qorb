import Link from "next/link";
import {
  ArrowRight,
  ExternalLink,
  Globe,
  MessageCircle,
  Phone,
} from "lucide-react";

export default function ContactPage() {
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-50"
    >
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-6 py-20">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-white"
          >
            <ArrowRight className="h-4 w-4" />
            العودة للرئيسية
          </Link>

          <h1 className="text-4xl font-black sm:text-5xl">
            تواصل معنا
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            يسعدنا تواصلك معنا للاستفسار عن خدماتنا ومنتجاتنا
            أو لمعرفة المزيد عن قُرب و Nexora Soft.
          </p>
        </div>
      </section>

      {/* Contact cards */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-2">

          {/* Phone */}
          <a
            href="tel:01005460980"
            className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Phone className="h-7 w-7" />
            </div>

            <h2 className="mt-6 text-xl font-black text-slate-900">
              الهاتف
            </h2>

            <p
              dir="ltr"
              className="mt-3 text-2xl font-black tracking-wide text-slate-800"
            >
              01005460980
            </p>

            <p className="mt-3 text-sm text-slate-500">
              اضغط للاتصال مباشرة
            </p>
          </a>

          {/* Website */}
          <a
            href="https://nexora-soft-website.vercel.app/"
            target="_blank"
            rel="noreferrer"
            className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
              <Globe className="h-7 w-7" />
            </div>

            <h2 className="mt-6 text-xl font-black text-slate-900">
              موقعنا الرسمي
            </h2>

            <p
              dir="ltr"
              className="mt-3 break-all text-lg font-bold text-sky-600"
            >
              nexora-soft-website.vercel.app
            </p>

            <div className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-slate-500">
              زيارة الموقع
              <ExternalLink className="h-4 w-4" />
            </div>
          </a>

          {/* Facebook - Elgharbawy */}
          <a
            href="https://www.facebook.com/search/pages/?q=%D8%A7%D9%84%D8%BA%D8%B1%D8%A8%D8%A7%D9%88%D9%8A%20%D9%84%D9%84%D8%A8%D8%B1%D9%85%D8%AC%D9%8A%D8%A7%D8%AA"
            target="_blank"
            rel="noreferrer"
            className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <MessageCircle className="h-7 w-7" />
            </div>

            <h2 className="mt-6 text-xl font-black text-slate-900">
              صفحتنا على فيسبوك
            </h2>

            <p className="mt-3 text-lg font-bold text-slate-700">
              الغرباوي للبرمجيات
            </p>

            <div className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-slate-500">
              زيارة الصفحة
              <ExternalLink className="h-4 w-4" />
            </div>
          </a>

          {/* Facebook - Nexora Soft */}
          <a
            href="https://www.facebook.com/profile.php?id=61594275501371"
            target="_blank"
            rel="noreferrer"
            className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <MessageCircle className="h-7 w-7" />
            </div>

            <h2 className="mt-6 text-xl font-black text-slate-900">
              تابعنا على فيسبوك
            </h2>

            <p className="mt-3 text-lg font-bold text-slate-700">
              Nexora Soft
            </p>

            <div className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-slate-500">
              متابعة الصفحة
              <ExternalLink className="h-4 w-4" />
            </div>
          </a>
        </div>

        {/* Bottom */}
        <div className="mt-8 rounded-3xl bg-slate-900 px-6 py-10 text-center text-white">
          <h2 className="text-2xl font-black">
            Nexora Soft للبرمجيات
          </h2>

          <p className="mx-auto mt-3 max-w-2xl leading-8 text-slate-300">
            نطور حلولًا رقمية تساعد على تحويل الأفكار إلى
            منتجات وخدمات حقيقية.
          </p>

          <Link
            href="/"
            className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 font-bold text-slate-900 transition hover:bg-slate-100"
          >
            العودة إلى قُرب
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}

