import { z } from "zod";

export const reviewSchema = z.object({
  businessId: z.coerce
    .number()
    .int()
    .positive("النشاط غير صحيح"),

  rating: z.coerce
    .number()
    .int()
    .min(1, "التقييم يجب أن يكون من 1 إلى 5")
    .max(5, "التقييم يجب أن يكون من 1 إلى 5"),

  comment: z
    .string()
    .max(2000, "التعليق طويل جدًا")
    .optional()
    .or(z.literal("")),
});

export type ReviewInput = z.infer<typeof reviewSchema>;