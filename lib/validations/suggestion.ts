import { z } from "zod";

export const suggestionSchema = z.object({
  name: z
    .string()
    .min(2, "اسم النشاط مطلوب")
    .max(200),

  categoryId: z.coerce
    .number()
    .int()
    .positive()
    .nullable()
    .optional(),

  cityId: z.coerce
    .number()
    .int()
    .positive()
    .nullable()
    .optional(),

  areaId: z.coerce
    .number()
    .int()
    .positive()
    .nullable()
    .optional(),

  address: z
    .string()
    .max(1000)
    .optional()
    .or(z.literal("")),

  latitude: z
    .number()
    .min(-90)
    .max(90)
    .nullable()
    .optional(),

  longitude: z
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

  notes: z
    .string()
    .max(3000)
    .optional()
    .or(z.literal("")),
});

export type SuggestionInput = z.infer<
  typeof suggestionSchema
>;