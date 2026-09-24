import {
  pgEnum,
  pgTable,
  serial,
  text,
  varchar,
  boolean,
  integer,
  smallint,
  numeric,
  timestamp,
  geometry,
  customType,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";

import { sql } from "drizzle-orm";

// =========================================================
// CUSTOM POSTGRES TYPES
// =========================================================
//
// إصدار Drizzle الموجود في المشروع لا يصدّر bytea مباشرة.
// لذلك نستخدم customType مع PostgreSQL bytea.
// الصور سيتم تخزينها فعليًا داخل قاعدة البيانات.
//

const postgresBytea = customType<{
  data: Buffer;
  driverData: Buffer;
}>({
  dataType() {
    return "bytea";
  },
});

// =========================================================
// ENUMS
// =========================================================

// المستخدم
export const userRoleEnum = pgEnum("user_role", [
  "User",
  "BusinessOwner",
  "Admin",
]);

// حالة النشاط
export const businessStatusEnum = pgEnum("business_status", [
  "Pending",
  "Approved",
  "Rejected",
  "Suspended",
]);

// حالة التقييم
export const reviewStatusEnum = pgEnum("review_status", [
  "Pending",
  "Approved",
  "Rejected",
]);

// حالة اقتراح النشاط
export const suggestionStatusEnum = pgEnum("suggestion_status", [
  "Pending",
  "Approved",
  "Rejected",
]);

// حالة البلاغ
export const reportStatusEnum = pgEnum("report_status", [
  "Pending",
  "Reviewed",
  "Resolved",
  "Rejected",
]);

// نوع الخصم
export const discountTypeEnum = pgEnum("discount_type", [
  "Percentage",
  "Fixed",
]);

// =========================================================
// ANALYTICS EVENT TYPES
// =========================================================
//
// خاص بالإحصائيات والتتبع فقط:
// View
// PhoneClick
// WhatsAppClick
// DirectionsClick
// WebsiteClick
//

export const businessEventTypeEnum = pgEnum("business_event_type", [
  "View",
  "PhoneClick",
  "WhatsAppClick",
  "DirectionsClick",
  "WebsiteClick",
]);

// =========================================================
// OWNERSHIP REQUEST
// =========================================================

export const ownershipRequestTypeEnum = pgEnum(
  "ownership_request_type",
  [
    "Create",
    "Claim",
  ]
);

export const ownershipRequestStatusEnum = pgEnum(
  "ownership_request_status",
  [
    "Pending",
    "Approved",
    "Rejected",
  ]
);

// =========================================================
// AREA SUGGESTION
// =========================================================

export const areaSuggestionStatusEnum = pgEnum(
  "area_suggestion_status",
  [
    "Pending",
    "Approved",
    "Rejected",
  ]
);

// =========================================================
// USERS
// =========================================================

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),

    fullName: varchar("full_name", {
      length: 150,
    }).notNull(),

    email: varchar("email", {
      length: 255,
    }),

    phone: varchar("phone", {
      length: 30,
    }),

    passwordHash: text(
      "password_hash"
    ),

    role: userRoleEnum("role")
      .notNull()
      .default("User"),

    isActive: boolean("is_active")
      .notNull()
      .default(true),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex(
      "users_email_unique"
    ).on(table.email),

    index(
      "users_phone_idx"
    ).on(table.phone),

    index(
      "users_role_idx"
    ).on(table.role),
  ]
);

// =========================================================
// GOVERNORATES
// =========================================================

export const governorates = pgTable(
  "governorates",
  {
    id: serial("id").primaryKey(),

    name: varchar("name", {
      length: 100,
    }).notNull(),

    isActive: boolean("is_active")
      .notNull()
      .default(true),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex(
      "governorates_name_unique"
    ).on(table.name),
  ]
);

// =========================================================
// CITIES
// =========================================================

export const cities = pgTable(
  "cities",
  {
    id: serial("id").primaryKey(),

    governorateId: integer(
      "governorate_id"
    )
      .notNull()
      .references(
        () => governorates.id,
        {
          onDelete: "cascade",
        }
      ),

    name: varchar("name", {
      length: 100,
    }).notNull(),

    isActive: boolean("is_active")
      .notNull()
      .default(true),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex(
      "cities_governorate_name_unique"
    ).on(
      table.governorateId,
      table.name
    ),

    index(
      "cities_governorate_idx"
    ).on(table.governorateId),
  ]
);

// =========================================================
// AREAS
// =========================================================

export const areas = pgTable(
  "areas",
  {
    id: serial("id").primaryKey(),

    cityId: integer("city_id")
      .notNull()
      .references(
        () => cities.id,
        {
          onDelete: "cascade",
        }
      ),

    name: varchar("name", {
      length: 150,
    }).notNull(),

    isActive: boolean("is_active")
      .notNull()
      .default(true),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex(
      "areas_city_name_unique"
    ).on(
      table.cityId,
      table.name
    ),

    index(
      "areas_city_idx"
    ).on(table.cityId),
  ]
);

// =========================================================
// CATEGORIES
// =========================================================

export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),

    name: varchar("name", {
      length: 100,
    }).notNull(),

    slug: varchar("slug", {
      length: 120,
    }).notNull(),

    icon: varchar("icon", {
      length: 100,
    }),

    image: text("image"),

    sortOrder: integer("sort_order")
      .notNull()
      .default(0),

    isActive: boolean("is_active")
      .notNull()
      .default(true),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex(
      "categories_slug_unique"
    ).on(table.slug),

    index(
      "categories_sort_idx"
    ).on(table.sortOrder),
  ]
);

// =========================================================
// SUB CATEGORIES
// =========================================================

export const subCategories = pgTable(
  "sub_categories",
  {
    id: serial("id").primaryKey(),

    categoryId: integer(
      "category_id"
    )
      .notNull()
      .references(
        () => categories.id,
        {
          onDelete: "cascade",
        }
      ),

    name: varchar("name", {
      length: 100,
    }).notNull(),

    slug: varchar("slug", {
      length: 120,
    }).notNull(),

    sortOrder: integer("sort_order")
      .notNull()
      .default(0),

    isActive: boolean("is_active")
      .notNull()
      .default(true),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex(
      "sub_categories_category_slug_unique"
    ).on(
      table.categoryId,
      table.slug
    ),

    index(
      "sub_categories_category_idx"
    ).on(table.categoryId),
  ]
);

// =========================================================
// BUSINESSES
// =========================================================

export const businesses = pgTable(
  "businesses",
  {
    id: serial("id").primaryKey(),

    ownerId: integer("owner_id").references(
      () => users.id,
      {
        onDelete: "set null",
      }
    ),

    name: varchar("name", {
      length: 200,
    }).notNull(),

    slug: varchar("slug", {
      length: 220,
    })
      .notNull()
      .unique(),

    description: text("description"),

    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id),

    subCategoryId: integer(
      "sub_category_id"
    ).references(
      () => subCategories.id
    ),

    governorateId: integer(
      "governorate_id"
    )
      .notNull()
      .references(() => governorates.id),

    cityId: integer("city_id")
      .notNull()
      .references(() => cities.id),

    areaId: integer("area_id").references(
      () => areas.id
    ),

    address: text("address"),

    latitude: numeric("latitude", {
      precision: 9,
      scale: 6,
    }),

    longitude: numeric("longitude", {
      precision: 9,
      scale: 6,
    }),

    location: geometry("location", {
      type: "point",
      srid: 4326,
    }),

    phone: varchar("phone", {
      length: 30,
    }),

    whatsapp: varchar("whatsapp", {
      length: 30,
    }),

    website: varchar("website", {
      length: 500,
    }),

    priceRange: varchar("price_range", {
      length: 20,
    }),

    status: businessStatusEnum("status")
      .notNull()
      .default("Pending"),

    isVerified: boolean("is_verified")
      .notNull()
      .default(false),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    ownerIdx: index(
      "businesses_owner_idx"
    ).on(table.ownerId),

    slugIdx: index(
      "businesses_slug_idx"
    ).on(table.slug),

    categoryIdx: index(
      "businesses_category_idx"
    ).on(table.categoryId),

    subCategoryIdx: index(
      "businesses_subcategory_idx"
    ).on(table.subCategoryId),

    governorateIdx: index(
      "businesses_governorate_idx"
    ).on(table.governorateId),

    cityIdx: index(
      "businesses_city_idx"
    ).on(table.cityId),

    areaIdx: index(
      "businesses_area_idx"
    ).on(table.areaId),

    statusIdx: index(
      "businesses_status_idx"
    ).on(table.status),

    locationIdx: index(
      "businesses_location_idx"
    ).using(
      "gist",
      table.location
    ),
  })
);

// =========================================================
// BUSINESS IMAGES
// =========================================================
//
// الصور الجديدة ستُخزن داخل PostgreSQL.
// imageUrl nullable للحفاظ على التوافق مع أي بيانات قديمة.
//

export const businessImages = pgTable(
  "business_images",
  {
    id: serial("id").primaryKey(),

    businessId: integer(
      "business_id"
    )
      .notNull()
      .references(
        () => businesses.id,
        {
          onDelete: "cascade",
        }
      ),

    // موجود للتوافق مع البيانات القديمة
    imageUrl: text(
      "image_url"
    ),

    // البيانات الثنائية للصورة داخل PostgreSQL
    imageData: postgresBytea(
      "image_data"
    ),

    // MIME type
    mimeType: varchar(
      "mime_type",
      {
        length: 100,
      }
    ),

    // الاسم الأصلي للملف
    fileName: varchar(
      "file_name",
      {
        length: 255,
      }
    ),

    // حجم الملف بالبايت
    fileSize: integer(
      "file_size"
    ),

    isCover: boolean(
      "is_cover"
    )
      .notNull()
      .default(false),

    sortOrder: integer(
      "sort_order"
    )
      .notNull()
      .default(0),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index(
      "business_images_business_idx"
    ).on(table.businessId),

    index(
      "business_images_sort_idx"
    ).on(
      table.businessId,
      table.sortOrder
    ),

    check(
      "business_images_file_size_check",
      sql`
        ${table.fileSize} IS NULL
        OR ${table.fileSize} > 0
      `
    ),
  ]
);

// =========================================================
// BUSINESS SERVICES
// =========================================================

export const businessServices = pgTable(
  "business_services",
  {
    id: serial("id").primaryKey(),

    businessId: integer(
      "business_id"
    )
      .notNull()
      .references(
        () => businesses.id,
        {
          onDelete: "cascade",
        }
      ),

    name: varchar("name", {
      length: 150,
    }).notNull(),

    description: text(
      "description"
    ),

    price: numeric("price", {
      precision: 10,
      scale: 2,
    }),

    durationMinutes: integer(
      "duration_minutes"
    ),

    isActive: boolean(
      "is_active"
    )
      .notNull()
      .default(true),

    sortOrder: integer(
      "sort_order"
    )
      .notNull()
      .default(0),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index(
      "business_services_business_idx"
    ).on(table.businessId),

    check(
      "business_services_price_check",
      sql`
        ${table.price} IS NULL
        OR ${table.price} >= 0
      `
    ),

    check(
      "business_services_duration_check",
      sql`
        ${table.durationMinutes} IS NULL
        OR ${table.durationMinutes} > 0
      `
    ),
  ]
);

// =========================================================
// BUSINESS HOURS
// =========================================================

export const businessHours = pgTable(
  "business_hours",
  {
    id: serial("id").primaryKey(),

    businessId: integer(
      "business_id"
    )
      .notNull()
      .references(
        () => businesses.id,
        {
          onDelete: "cascade",
        }
      ),

    // 0 الأحد
    // 1 الإثنين
    // 2 الثلاثاء
    // 3 الأربعاء
    // 4 الخميس
    // 5 الجمعة
    // 6 السبت
    dayOfWeek: smallint(
      "day_of_week"
    ).notNull(),

    openTime: varchar(
      "open_time",
      {
        length: 5,
      }
    ),

    closeTime: varchar(
      "close_time",
      {
        length: 5,
      }
    ),

    isClosed: boolean(
      "is_closed"
    )
      .notNull()
      .default(false),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex(
      "business_hours_business_day_unique"
    ).on(
      table.businessId,
      table.dayOfWeek
    ),

    index(
      "business_hours_business_idx"
    ).on(table.businessId),

    check(
      "business_hours_day_check",
      sql`
        ${table.dayOfWeek}
        BETWEEN 0 AND 6
      `
    ),
  ]
);

// =========================================================
// REVIEWS
// =========================================================

export const reviews = pgTable(
  "reviews",
  {
    id: serial("id").primaryKey(),

    businessId: integer(
      "business_id"
    )
      .notNull()
      .references(
        () => businesses.id,
        {
          onDelete: "cascade",
        }
      ),

    userId: integer("user_id")
      .notNull()
      .references(
        () => users.id,
        {
          onDelete: "cascade",
        }
      ),

    rating: smallint(
      "rating"
    ).notNull(),

    comment: text("comment"),

    status: reviewStatusEnum(
      "status"
    )
      .notNull()
      .default("Pending"),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),

    updatedAt: timestamp(
      "updated_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index(
      "reviews_business_idx"
    ).on(table.businessId),

    index(
      "reviews_user_idx"
    ).on(table.userId),

    index(
      "reviews_status_idx"
    ).on(table.status),

    check(
      "reviews_rating_check",
      sql`
        ${table.rating} BETWEEN 1 AND 5
      `
    ),
  ]
);

// =========================================================
// FAVORITES
// =========================================================

export const favorites = pgTable(
  "favorites",
  {
    id: serial("id").primaryKey(),

    userId: integer("user_id")
      .notNull()
      .references(
        () => users.id,
        {
          onDelete: "cascade",
        }
      ),

    businessId: integer(
      "business_id"
    )
      .notNull()
      .references(
        () => businesses.id,
        {
          onDelete: "cascade",
        }
      ),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex(
      "favorites_user_business_unique"
    ).on(
      table.userId,
      table.businessId
    ),

    index(
      "favorites_user_idx"
    ).on(table.userId),

    index(
      "favorites_business_idx"
    ).on(table.businessId),
  ]
);

// =========================================================
// OFFERS
// =========================================================

export const offers = pgTable(
  "offers",
  {
    id: serial("id").primaryKey(),

    businessId: integer(
      "business_id"
    )
      .notNull()
      .references(
        () => businesses.id,
        {
          onDelete: "cascade",
        }
      ),

    title: varchar("title", {
      length: 200,
    }).notNull(),

    description: text(
      "description"
    ),

    discountType: discountTypeEnum(
      "discount_type"
    ).notNull(),

    discountValue: numeric(
      "discount_value",
      {
        precision: 10,
        scale: 2,
      }
    ).notNull(),

    startDate: timestamp(
      "start_date",
      {
        withTimezone: true,
      }
    ).notNull(),

    endDate: timestamp(
      "end_date",
      {
        withTimezone: true,
      }
    ).notNull(),

    isActive: boolean(
      "is_active"
    )
      .notNull()
      .default(true),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index(
      "offers_business_idx"
    ).on(table.businessId),

    index(
      "offers_dates_idx"
    ).on(
      table.startDate,
      table.endDate
    ),

    check(
      "offers_discount_value_check",
      sql`
        ${table.discountValue} >= 0
      `
    ),

    check(
      "offers_dates_check",
      sql`
        ${table.endDate} > ${table.startDate}
      `
    ),
  ]
);

// =========================================================
// BUSINESS SUGGESTIONS
// =========================================================

export const businessSuggestions =
  pgTable(
    "business_suggestions",
    {
      id: serial("id").primaryKey(),

      suggestedByUserId:
        integer(
          "suggested_by_user_id"
        ).references(
          () => users.id,
          {
            onDelete: "set null",
          }
        ),

      name: varchar("name", {
        length: 200,
      }).notNull(),

      categoryId:
        integer(
          "category_id"
        ).references(
          () => categories.id,
          {
            onDelete: "set null",
          }
        ),

      cityId:
        integer("city_id").references(
          () => cities.id,
          {
            onDelete: "set null",
          }
        ),

      areaId:
        integer("area_id").references(
          () => areas.id,
          {
            onDelete: "set null",
          }
        ),

      address: text("address"),

      latitude: numeric(
        "latitude",
        {
          precision: 9,
          scale: 6,
        }
      ),

      longitude: numeric(
        "longitude",
        {
          precision: 9,
          scale: 6,
        }
      ),

      phone: varchar("phone", {
        length: 30,
      }),

      notes: text("notes"),

      status:
        suggestionStatusEnum(
          "status"
        )
          .notNull()
          .default("Pending"),

      createdAt: timestamp(
        "created_at",
        {
          withTimezone: true,
        }
      )
        .notNull()
        .defaultNow(),

      reviewedAt:
        timestamp(
          "reviewed_at",
          {
            withTimezone: true,
          }
        ),

      reviewedBy:
        integer(
          "reviewed_by"
        ).references(
          () => users.id,
          {
            onDelete: "set null",
          }
        ),
    },
    (table) => [
      index(
        "business_suggestions_status_idx"
      ).on(table.status),

      index(
        "business_suggestions_city_idx"
      ).on(table.cityId),

      index(
        "business_suggestions_user_idx"
      ).on(
        table.suggestedByUserId
      ),
    ]
  );

// =========================================================
// REPORTS
// =========================================================

export const reports = pgTable(
  "reports",
  {
    id: serial("id").primaryKey(),

    userId: integer("user_id")
      .notNull()
      .references(
        () => users.id,
        {
          onDelete: "cascade",
        }
      ),

    businessId: integer(
      "business_id"
    )
      .notNull()
      .references(
        () => businesses.id,
        {
          onDelete: "cascade",
        }
      ),

    type: varchar("type", {
      length: 100,
    }).notNull(),

    message: text(
      "message"
    ).notNull(),

    status: reportStatusEnum(
      "status"
    )
      .notNull()
      .default("Pending"),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),

    resolvedAt:
      timestamp(
        "resolved_at",
        {
          withTimezone: true,
        }
      ),
  },
  (table) => [
    index(
      "reports_business_idx"
    ).on(table.businessId),

    index(
      "reports_user_idx"
    ).on(table.userId),

    index(
      "reports_status_idx"
    ).on(table.status),
  ]
);

// =========================================================
// BUSINESS ANALYTICS EVENTS
// =========================================================

export const businessEvents = pgTable(
  "business_events",
  {
    id: serial("id").primaryKey(),

    businessId: integer(
      "business_id"
    )
      .notNull()
      .references(
        () => businesses.id,
        {
          onDelete: "cascade",
        }
      ),

    userId: integer(
      "user_id"
    ).references(
      () => users.id,
      {
        onDelete: "set null",
      }
    ),

    eventType:
      businessEventTypeEnum(
        "event_type"
      ).notNull(),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index(
      "business_events_business_idx"
    ).on(table.businessId),

    index(
      "business_events_user_idx"
    ).on(table.userId),

    index(
      "business_events_type_idx"
    ).on(table.eventType),

    index(
      "business_events_created_idx"
    ).on(table.createdAt),
  ]
);

// =========================================================
// BUSINESS PUBLIC EVENTS
// =========================================================
//
// فعاليات تظهر للزوار.
// مختلفة تمامًا عن business_events الخاص بالإحصائيات.
//

export const businessPublicEvents = pgTable(
  "business_public_events",
  {
    id: serial("id").primaryKey(),

    businessId: integer(
      "business_id"
    )
      .notNull()
      .references(
        () => businesses.id,
        {
          onDelete: "cascade",
        }
      ),

    title: varchar("title", {
      length: 200,
    }).notNull(),

    description: text(
      "description"
    ),

    startAt: timestamp(
      "start_at",
      {
        withTimezone: true,
      }
    ).notNull(),

    endAt: timestamp(
      "end_at",
      {
        withTimezone: true,
      }
    ).notNull(),

    isActive: boolean(
      "is_active"
    )
      .notNull()
      .default(true),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),

    updatedAt: timestamp(
      "updated_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index(
      "business_public_events_business_idx"
    ).on(table.businessId),

    index(
      "business_public_events_dates_idx"
    ).on(
      table.startAt,
      table.endAt
    ),

    index(
      "business_public_events_active_idx"
    ).on(table.isActive),

    check(
      "business_public_events_dates_check",
      sql`
        ${table.endAt} > ${table.startAt}
      `
    ),
  ]
);

// =========================================================
// BUSINESS OWNERSHIP REQUESTS
// =========================================================

export const businessOwnershipRequests =
  pgTable(
    "business_ownership_requests",
    {
      id: serial("id").primaryKey(),

      userId: integer("user_id")
        .notNull()
        .references(
          () => users.id,
          {
            onDelete: "cascade",
          }
        ),

      businessId: integer(
        "business_id"
      ).references(
        () => businesses.id,
        {
          onDelete: "cascade",
        }
      ),

      requestType:
        ownershipRequestTypeEnum(
          "request_type"
        ).notNull(),

      name: varchar("name", {
        length: 200,
      }),

      description: text(
        "description"
      ),

      categoryId: integer(
        "category_id"
      ).references(
        () => categories.id,
        {
          onDelete: "set null",
        }
      ),

      subCategoryId: integer(
        "sub_category_id"
      ).references(
        () => subCategories.id,
        {
          onDelete: "set null",
        }
      ),

      governorateId: integer(
        "governorate_id"
      ).references(
        () => governorates.id,
        {
          onDelete: "set null",
        }
      ),

      cityId: integer(
        "city_id"
      ).references(
        () => cities.id,
        {
          onDelete: "set null",
        }
      ),

      areaId: integer(
        "area_id"
      ).references(
        () => areas.id,
        {
          onDelete: "set null",
        }
      ),

      address: text(
        "address"
      ),

      latitude: numeric(
        "latitude",
        {
          precision: 9,
          scale: 6,
        }
      ),

      longitude: numeric(
        "longitude",
        {
          precision: 9,
          scale: 6,
        }
      ),

      phone: varchar("phone", {
        length: 30,
      }),

      whatsapp: varchar("whatsapp", {
        length: 30,
      }),

      website: text(
        "website"
      ),

      priceRange: varchar(
        "price_range",
        {
          length: 20,
        }
      ),

      notes: text(
        "notes"
      ),

      status:
        ownershipRequestStatusEnum(
          "status"
        )
          .notNull()
          .default("Pending"),

      createdAt: timestamp(
        "created_at",
        {
          withTimezone: true,
        }
      )
        .notNull()
        .defaultNow(),

      reviewedAt:
        timestamp(
          "reviewed_at",
          {
            withTimezone: true,
          }
        ),

      reviewedBy:
        integer(
          "reviewed_by"
        ).references(
          () => users.id,
          {
            onDelete: "set null",
          }
        ),
    },
    (table) => [
      index(
        "ownership_requests_user_idx"
      ).on(table.userId),

      index(
        "ownership_requests_business_idx"
      ).on(table.businessId),

      index(
        "ownership_requests_status_idx"
      ).on(table.status),

      index(
        "ownership_requests_type_idx"
      ).on(table.requestType),

      index(
        "ownership_requests_created_idx"
      ).on(table.createdAt),
    ]
  );

// =========================================================
// AREA SUGGESTIONS
// =========================================================

export const areaSuggestions = pgTable(
  "area_suggestions",
  {
    id: serial("id").primaryKey(),

    userId: integer("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    cityId: integer("city_id")
      .notNull()
      .references(() => cities.id, {
        onDelete: "cascade",
      }),

    name: varchar("name", {
      length: 150,
    }).notNull(),

    notes: text("notes"),

    status: areaSuggestionStatusEnum(
      "status"
    )
      .notNull()
      .default("Pending"),

    createdAt: timestamp(
      "created_at",
      {
        withTimezone: true,
      }
    )
      .notNull()
      .defaultNow(),

    reviewedAt: timestamp(
      "reviewed_at",
      {
        withTimezone: true,
      }
    ),

    reviewedBy: integer(
      "reviewed_by"
    ).references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    index(
      "area_suggestions_user_idx"
    ).on(table.userId),

    index(
      "area_suggestions_city_idx"
    ).on(table.cityId),

    index(
      "area_suggestions_status_idx"
    ).on(table.status),

    index(
      "area_suggestions_created_idx"
    ).on(table.createdAt),
  ]
);