import { config } from "dotenv";
config({ path: ".env.local" });
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq } from "drizzle-orm";

import {
  governorates,
  cities,
  categories,
  subCategories,
} from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const pool = new Pool({
  connectionString,
});

const db = drizzle(pool);

async function getGovernorateId(name: string) {
  const result = await db
    .select({ id: governorates.id })
    .from(governorates)
    .where(eq(governorates.name, name))
    .limit(1);

  return result[0]?.id;
}

async function getCityId(governorateId: number, name: string) {
  const result = await db
    .select({ id: cities.id })
    .from(cities)
    .where(eq(cities.name, name))
    .limit(1);

  return result[0]?.id;
}

async function getCategoryId(slug: string) {
  const result = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);

  return result[0]?.id;
}

async function seed() {
  console.log("🌱 Starting Qorb seed...");

  // =====================================================
  // Governorate
  // =====================================================

  await db
    .insert(governorates)
    .values({
      name: "جنوب سيناء",
      isActive: true,
    })
    .onConflictDoNothing();

  const governorateId = await getGovernorateId("جنوب سيناء");

  if (!governorateId) {
    throw new Error("Failed to create/find South Sinai governorate");
  }

  console.log("✅ Governorate ready:", governorateId);

  // =====================================================
  // Cities
  // =====================================================

  const cityNames = [
    "الطور",
    "شرم الشيخ",
    "دهب",
    "نويبع",
    "طابا",
    "سانت كاترين",
    "رأس سدر",
    "أبو زنيمة",
    "أبو رديس",
  ];

  for (const name of cityNames) {
    await db
      .insert(cities)
      .values({
        governorateId,
        name,
        isActive: true,
      })
      .onConflictDoNothing();
  }

  console.log(`✅ Cities ready: ${cityNames.length}`);

  // =====================================================
  // Categories
  // =====================================================

  const categoryData = [
    {
      name: "مطاعم وكافيهات",
      slug: "restaurants-cafes",
      icon: "Utensils",
      sortOrder: 1,
    },
    {
      name: "فنادق وإقامة",
      slug: "hotels-stays",
      icon: "Hotel",
      sortOrder: 2,
    },
    {
      name: "سياحة وترفيه",
      slug: "tourism-entertainment",
      icon: "Palmtree",
      sortOrder: 3,
    },
    {
      name: "سيارات",
      slug: "cars",
      icon: "Car",
      sortOrder: 4,
    },
    {
      name: "صحة",
      slug: "health",
      icon: "HeartPulse",
      sortOrder: 5,
    },
    {
      name: "تجميل وعناية",
      slug: "beauty-care",
      icon: "Sparkles",
      sortOrder: 6,
    },
    {
      name: "تسوق",
      slug: "shopping",
      icon: "ShoppingBag",
      sortOrder: 7,
    },
    {
      name: "خدمات منزلية",
      slug: "home-services",
      icon: "House",
      sortOrder: 8,
    },
    {
      name: "صيانة وإصلاح",
      slug: "repair-maintenance",
      icon: "Wrench",
      sortOrder: 9,
    },
    {
      name: "خدمات مهنية",
      slug: "professional-services",
      icon: "BriefcaseBusiness",
      sortOrder: 10,
    },
    {
      name: "تعليم وتدريب",
      slug: "education-training",
      icon: "GraduationCap",
      sortOrder: 11,
    },
    {
      name: "رياضة ولياقة",
      slug: "sports-fitness",
      icon: "Dumbbell",
      sortOrder: 12,
    },
  ];

  for (const category of categoryData) {
    await db
      .insert(categories)
      .values({
        name: category.name,
        slug: category.slug,
        icon: category.icon,
        sortOrder: category.sortOrder,
        isActive: true,
      })
      .onConflictDoNothing();
  }

  console.log(`✅ Categories ready: ${categoryData.length}`);

  // =====================================================
  // Sub Categories
  // =====================================================

  const subCategoryData = [
    // Restaurants
    {
      categorySlug: "restaurants-cafes",
      name: "مطاعم",
      slug: "restaurants",
      sortOrder: 1,
    },
    {
      categorySlug: "restaurants-cafes",
      name: "كافيهات",
      slug: "cafes",
      sortOrder: 2,
    },
    {
      categorySlug: "restaurants-cafes",
      name: "مخبوزات وحلويات",
      slug: "bakery-desserts",
      sortOrder: 3,
    },
    {
      categorySlug: "restaurants-cafes",
      name: "وجبات سريعة",
      slug: "fast-food",
      sortOrder: 4,
    },

    // Hotels
    {
      categorySlug: "hotels-stays",
      name: "فنادق",
      slug: "hotels",
      sortOrder: 1,
    },
    {
      categorySlug: "hotels-stays",
      name: "منتجعات وشاليهات",
      slug: "resorts-chalets",
      sortOrder: 2,
    },
    {
      categorySlug: "hotels-stays",
      name: "بيوت ضيافة",
      slug: "guest-houses",
      sortOrder: 3,
    },

    // Tourism
    {
      categorySlug: "tourism-entertainment",
      name: "رحلات بحرية",
      slug: "boat-trips",
      sortOrder: 1,
    },
    {
      categorySlug: "tourism-entertainment",
      name: "غوص وأنشطة مائية",
      slug: "diving-water-activities",
      sortOrder: 2,
    },
    {
      categorySlug: "tourism-entertainment",
      name: "سفاري ورحلات صحراوية",
      slug: "safari-desert-trips",
      sortOrder: 3,
    },
    {
      categorySlug: "tourism-entertainment",
      name: "مزارات وأماكن سياحية",
      slug: "tourist-attractions",
      sortOrder: 4,
    },

    // Cars
    {
      categorySlug: "cars",
      name: "غسيل سيارات",
      slug: "car-wash",
      sortOrder: 1,
    },
    {
      categorySlug: "cars",
      name: "تأجير سيارات",
      slug: "car-rental",
      sortOrder: 2,
    },
    {
      categorySlug: "cars",
      name: "صيانة سيارات",
      slug: "car-maintenance",
      sortOrder: 3,
    },
    {
      categorySlug: "cars",
      name: "إطارات وبطاريات",
      slug: "tires-batteries",
      sortOrder: 4,
    },

    // Health
    {
      categorySlug: "health",
      name: "أطباء",
      slug: "doctors",
      sortOrder: 1,
    },
    {
      categorySlug: "health",
      name: "صيدليات",
      slug: "pharmacies",
      sortOrder: 2,
    },
    {
      categorySlug: "health",
      name: "معامل تحاليل",
      slug: "medical-labs",
      sortOrder: 3,
    },
    {
      categorySlug: "health",
      name: "مراكز طبية",
      slug: "medical-centers",
      sortOrder: 4,
    },

    // Beauty
    {
      categorySlug: "beauty-care",
      name: "حلاق رجالي",
      slug: "barbers",
      sortOrder: 1,
    },
    {
      categorySlug: "beauty-care",
      name: "صالونات نسائية",
      slug: "women-salons",
      sortOrder: 2,
    },
    {
      categorySlug: "beauty-care",
      name: "سبا وعناية",
      slug: "spa-care",
      sortOrder: 3,
    },

    // Shopping
    {
      categorySlug: "shopping",
      name: "سوبر ماركت",
      slug: "supermarkets",
      sortOrder: 1,
    },
    {
      categorySlug: "shopping",
      name: "ملابس",
      slug: "clothing",
      sortOrder: 2,
    },
    {
      categorySlug: "shopping",
      name: "إلكترونيات",
      slug: "electronics",
      sortOrder: 3,
    },
    {
      categorySlug: "shopping",
      name: "هدايا وتذكارات",
      slug: "gifts-souvenirs",
      sortOrder: 4,
    },

    // Home Services
    {
      categorySlug: "home-services",
      name: "سباكة",
      slug: "plumbing",
      sortOrder: 1,
    },
    {
      categorySlug: "home-services",
      name: "كهرباء",
      slug: "electricity",
      sortOrder: 2,
    },
    {
      categorySlug: "home-services",
      name: "نظافة",
      slug: "cleaning",
      sortOrder: 3,
    },
    {
      categorySlug: "home-services",
      name: "نقل وأثاث",
      slug: "moving-furniture",
      sortOrder: 4,
    },

    // Repair
    {
      categorySlug: "repair-maintenance",
      name: "أجهزة كهربائية",
      slug: "electrical-appliances",
      sortOrder: 1,
    },
    {
      categorySlug: "repair-maintenance",
      name: "موبايلات",
      slug: "mobile-repair",
      sortOrder: 2,
    },
    {
      categorySlug: "repair-maintenance",
      name: "تكييف وتبريد",
      slug: "ac-repair",
      sortOrder: 3,
    },

    // Professional
    {
      categorySlug: "professional-services",
      name: "محاماة",
      slug: "lawyers",
      sortOrder: 1,
    },
    {
      categorySlug: "professional-services",
      name: "محاسبة",
      slug: "accounting",
      sortOrder: 2,
    },
    {
      categorySlug: "professional-services",
      name: "خدمات أعمال",
      slug: "business-services",
      sortOrder: 3,
    },

    // Education
    {
      categorySlug: "education-training",
      name: "مراكز تعليم",
      slug: "education-centers",
      sortOrder: 1,
    },
    {
      categorySlug: "education-training",
      name: "لغات",
      slug: "languages",
      sortOrder: 2,
    },
    {
      categorySlug: "education-training",
      name: "تدريب مهني",
      slug: "vocational-training",
      sortOrder: 3,
    },

    // Sports
    {
      categorySlug: "sports-fitness",
      name: "جيم",
      slug: "gyms",
      sortOrder: 1,
    },
    {
      categorySlug: "sports-fitness",
      name: "يوغا ولياقة",
      slug: "yoga-fitness",
      sortOrder: 2,
    },
    {
      categorySlug: "sports-fitness",
      name: "أنشطة رياضية",
      slug: "sports-activities",
      sortOrder: 3,
    },
  ];

  for (const item of subCategoryData) {
    const categoryId = await getCategoryId(item.categorySlug);

    if (!categoryId) {
      console.warn(
        `⚠️ Category not found: ${item.categorySlug}`
      );
      continue;
    }

    await db
      .insert(subCategories)
      .values({
        categoryId,
        name: item.name,
        slug: item.slug,
        sortOrder: item.sortOrder,
        isActive: true,
      })
      .onConflictDoNothing();
  }

  console.log(
    `✅ SubCategories processed: ${subCategoryData.length}`
  );

  console.log("🎉 Qorb seed completed successfully.");
}

seed()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });