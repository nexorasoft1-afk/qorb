import Link from "next/link";
import {
  ArrowLeft,
  Compass,
  MapPinned,
  Search,
  Sparkles,
} from "lucide-react";

import SearchBox from "@/app/components/home/SearchBox";
import CategoryGrid from "@/app/components/home/CategoryGrid";
import NearbyBusinesses from "@/app/components/home/NearbyBusinesses";

interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  image: string | null;
  sortOrder: number;
  isActive: boolean;
  subCategories: {
    id: number;
    name: string;
    slug: string;
    sortOrder: number;
  }[];
}

async function getCategories(): Promise<Category[]> {
  try {
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL;

    // Vercel production / preview
    if (!baseUrl && process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`;
    }

    // Local development
    if (!baseUrl) {
      baseUrl = "http://localhost:3000";
    }

    const response = await fetch(
      `${baseUrl}/api/categories`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.error(
        "Categories API failed:",
        response.status,
        response.statusText
      );

      return [];
    }

    const result = await response.json();

    if (!result.success) {
      console.error(
        "Categories API returned unsuccessful response:",
        result
      );

      return [];
    }

    return Array.isArray(result.data)
      ? result.data
      : [];
  } catch (error) {
    console.error(
      "Failed to load categories:",
      error
    );

    return [];
  }
}

export default async function HomePage() {
  const categories =
    await getCategories();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.22),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.15),transparent_30%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-sky-200">
              <Sparkles className="h-4 w-4" />
              قُرب — اكتشف جنوب سيناء بطريقة جديدة
            </div>

            <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-7xl">
              إيه اللي محتاجه؟
              <span className="block text-sky-400">
                هنوصلك للي قُربك.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              مطاعم، كافيهات، فنادق، خدمات، صيانة، صحة،
              سياحة وكل اللي حواليك في مكان واحد.
            </p>

            <div className="mt-8">
              <SearchBox />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/businesses"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                <Search className="h-4 w-4" />
                استكشف الأماكن
              </Link>

              <Link
                href="/map"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                <MapPinned className="h-4 w-4" />
                افتح الخريطة
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <div className="mb-2 text-sm font-bold text-sky-600">
              اختار احتياجك
            </div>

            <h2 className="text-3xl font-black tracking-tight text-slate-900">
              تصفح حسب التصنيف
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              ابدأ من الحاجة اللي بتدور عليها.
            </p>
          </div>

          <Link
            href="/businesses"
            className="hidden items-center gap-2 text-sm font-bold text-sky-600 sm:flex"
          >
            كل التصنيفات
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>

        <CategoryGrid
          categories={categories}
        />
      </section>

      {/* Nearby */}
      <section className="bg-slate-100 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-sky-600">
              <Compass className="h-4 w-4" />
              حسب موقعك
            </div>

            <h2 className="text-3xl font-black tracking-tight text-slate-900">
              قريب منك
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              أقرب الأماكن والخدمات المتاحة حولك.
            </p>
          </div>

          <NearbyBusinesses />
        </div>
      </section>

      {/* Owner CTA */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] bg-sky-600 p-8 text-white sm:p-12">
          <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div>
              <div className="text-sm font-bold text-sky-100">
                عندك نشاط؟
              </div>

              <h2 className="mt-2 text-3xl font-black">
                خلي الناس تلاقيك على قُرب
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-sky-50">
                أضف نشاطك، خدماتك، مواعيدك وصورك وخلي العملاء
                يقدروا يوصلوا لك بسهولة.
              </p>
            </div>

            <Link
              href="/owner/register"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-black text-sky-700 transition hover:bg-sky-50"
            >
              أضف نشاطك الآن
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}