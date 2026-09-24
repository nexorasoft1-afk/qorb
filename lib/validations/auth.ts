import { z } from "zod";

export const registerSchema = z.object({
  fullName: z
    .string()
    .min(2, "الاسم مطلوب")
    .max(150),

  email: z
    .string()
    .email("البريد الإلكتروني غير صحيح")
    .optional()
    .or(z.literal("")),

  phone: z
    .string()
    .min(8, "رقم الهاتف غير صحيح")
    .max(30),

  password: z
    .string()
    .min(6, "كلمة المرور يجب ألا تقل عن 6 أحرف")
    .max(100),
});

export const loginSchema = z.object({
  emailOrPhone: z
    .string()
    .min(3, "أدخل البريد أو رقم الهاتف"),

  password: z
    .string()
    .min(1, "كلمة المرور مطلوبة"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;