import { z } from "zod";

export const businessSchema = z.object({
  name: z
    .string()
    .min(2, "اسم النشاط مطلوب")
    .max(200, "اسم النشاط طويل جدًا"),

  description: z
    .string()
    .max(5000, "الوصف طويل جدًا")
    .optional()
    .or(z.literal("")),

  categoryId: z.coerce
    .number()
    .int()
    .positive("التصنيف غير صحيح"),

  subCategoryId: z
    .union([
      z.coerce.number().int().positive(),
      z.null(),
      z.undefined(),
    ])
    .optional(),

  governorateId: z.coerce
    .number()
    .int()
    .positive("المحافظة غير صحيحة"),

  cityId: z.coerce
    .number()
    .int()
    .positive("المدينة غير صحيحة"),

  areaId: z
    .union([
      z.coerce.number().int().positive(),
      z.null(),
      z.undefined(),
    ])
    .optional(),

  address: z
    .string()
    .max(1000, "العنوان طويل جدًا")
    .optional()
    .or(z.literal("")),

  latitude: z.coerce
    .number()
    .min(-90)
    .max(90)
    .nullable()
    .optional(),

  longitude: z.coerce
    .number()
    .min(-180)
    .max(180)
    .nullable()
    .optional(),

  phone: z
    .string()
    .max(30)
    .optional()
    .or(z.literal("")),

  whatsapp: z
    .string()
    .max(30)
    .optional()
    .or(z.literal("")),

  website: z
    .string()
    .url("رابط الموقع غير صحيح")
    .optional()
    .or(z.literal("")),

  priceRange: z
    .string()
    .max(20)
    .optional()
    .or(z.literal("")),
});

export type BusinessInput = z.infer<typeof businessSchema>;