import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq, or } from "drizzle-orm";

import { db } from "@/lib/db";
import { users } from "@/app/db/schema";
import { loginSchema } from "@/lib/validations/auth";
import { createSession } from "@/lib/auth";
import { normalizeText } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "بيانات الدخول غير صحيحة",
        },
        { status: 400 }
      );
    }

    const identifier = normalizeText(
      parsed.data.emailOrPhone
    );

    const user = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
        passwordHash: users.passwordHash,
        role: users.role,
        isActive: users.isActive,
      })
      .from(users)
      .where(
        or(
          eq(
            users.email,
            identifier.toLowerCase()
          ),
          eq(users.phone, identifier)
        )
      )
      .limit(1);

    const currentUser = user[0];

    if (
      !currentUser ||
      !currentUser.passwordHash ||
      !currentUser.isActive
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "البريد الإلكتروني/رقم الهاتف أو كلمة المرور غير صحيحة",
        },
        { status: 401 }
      );
    }

    const validPassword = await bcrypt.compare(
      parsed.data.password,
      currentUser.passwordHash
    );

    if (!validPassword) {
      return NextResponse.json(
        {
          success: false,
          message:
            "البريد الإلكتروني/رقم الهاتف أو كلمة المرور غير صحيحة",
        },
        { status: 401 }
      );
    }

    await createSession({
      id: currentUser.id,
      fullName: currentUser.fullName,
      email: currentUser.email,
      phone: currentUser.phone,
      role: currentUser.role,
    });

    return NextResponse.json({
      success: true,
      message: "تم تسجيل الدخول بنجاح",
      user: {
        id: currentUser.id,
        fullName: currentUser.fullName,
        email: currentUser.email,
        phone: currentUser.phone,
        role: currentUser.role,
      },
    });
  } catch (error) {
    console.error("Login API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "حدث خطأ أثناء تسجيل الدخول",
      },
      { status: 500 }
    );
  }
}