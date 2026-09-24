import { NextResponse } from "next/server";

import { destroySession } from "@/lib/auth";

export async function POST() {
  try {
    await destroySession();

    return NextResponse.json({
      success: true,
      message: "تم تسجيل الخروج بنجاح",
    });
  } catch (error) {
    console.error("Logout API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "حدث خطأ أثناء تسجيل الخروج",
      },
      { status: 500 }
    );
  }
}