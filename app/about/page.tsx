import Link from "next/link";
import {
  ArrowRight,
  Code2,
  MapPin,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

export default function AboutPage() {
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

          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-sky-300 backdrop-blur">
              <Sparkles className="h-4 w-4" />
              Nexora Soft للبرمجيات
            </div>

            <h1 className="text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
              من نحن
            </h1>

            <p className="mt-6 text-lg leading-8 text-slate-300 sm:text-xl">
              نحن شركة Nexora Soft للبرمجيات، نعمل على تطوير
              حلول وبرمجيات رقمية حديثة تساعد الأفراد والشركات
              وأصحاب الأنشطة على الوصول إلى خدمات أفضل وتجارب
              رقمية أكثر سهولة واحترافية.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
              <Code2 className="h-7 w-7" />
            </div>

            <h2 className="mt-6 text-xl font-black text-slate-900">
              حلول برمجية
            </h2>

            <p className="mt-3 leading-7 text-slate-600">
              نصمم ونطور تطبيقات ومنصات رقمية حديثة تهدف إلى
              حل المشكلات الحقيقية وتسهيل استخدام التكنولوجيا.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Users className="h-7 w-7" />
            </div>

            <h2 className="mt-6 text-xl font-black text-slate-900">
              نهتم بالمستخدم
            </h2>

            <p className="mt-3 leading-7 text-slate-600">
              نركز على تقديم تجربة بسيطة وواضحة وسريعة، بحيث
              تكون التكنولوجيا في خدمة المستخدم وليست عائقًا أمامه.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Target className="h-7 w-7" />
            </div>

            <h2 className="mt-6 text-xl font-black text-slate-900">
              رؤيتنا
            </h2>

            <p className="mt-3 leading-7 text-slate-600">
              بناء منتجات رقمية عملية وموثوقة تساعد على ربط الناس
              بالخدمات والأماكن والأنشطة من حولهم بصورة أفضل.
            </p>
          </div>
        </div>

        {/* Qorb */}
        <div className="mt-8 rounded-3xl border border-sky-100 bg-linear-to-br from-sky-50 to-white p-8 sm:p-10">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-lg shadow-sky-600/20">
              <MapPin className="h-7 w-7" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900">
                قُرب
              </h2>

              <p className="mt-3 max-w-3xl leading-8 text-slate-600">
                قُرب هو أحد منتجاتنا، وهو منصة تساعدك على اكتشاف
                الأنشطة والخدمات والأماكن القريبة منك بسهولة، مع
                إمكانية الوصول إلى بيانات النشاط والتواصل معه
                ومعرفة موقعه وعروضه وخدماته.
              </p>

              <Link
                href="/"
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                اكتشف قُرب
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}