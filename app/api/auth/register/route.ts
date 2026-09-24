import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { or, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { users } from "@/app/db/schema";
import { registerSchema } from "@/lib/validations/auth";
import { createSession } from "@/lib/auth";
import { emptyToNull, normalizeText } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "بيانات التسجيل غير صحيحة",
          errors: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const fullName = normalizeText(
      parsed.data.fullName
    );

    const email =
      emptyToNull(parsed.data.email)?.toLowerCase() ??
      null;

    const phone = emptyToNull(parsed.data.phone);

    const existingConditions = [];

    if (email) {
      existingConditions.push(eq(users.email, email));
    }

    if (phone) {
      existingConditions.push(eq(users.phone, phone));
    }

    if (existingConditions.length) {
      const existing = await db
        .select({
          id: users.id,
        })
        .from(users)
        .where(or(...existingConditions))
        .limit(1);

      if (existing.length) {
        return NextResponse.json(
          {
            success: false,
            message:
              "البريد الإلكتروني أو رقم الهاتف مستخدم بالفعل",
          },
          { status: 409 }
        );
      }
    }

    const passwordHash = await bcrypt.hash(
      parsed.data.password,
      12
    );

    const inserted = await db
      .insert(users)
      .values({
        fullName,
        email,
        phone,
        passwordHash,
        role: "User",
        isActive: true,
      })
      .returning({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
        role: users.role,
      });

    const user = inserted[0];

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "تعذر إنشاء الحساب",
        },
        { status: 500 }
      );
    }

    await createSession({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
    });

    return NextResponse.json(
      {
        success: true,
        message: "تم إنشاء الحساب بنجاح",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "حدث خطأ أثناء إنشاء الحساب",
      },
      { status: 500 }
    );
  }
}