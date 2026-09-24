import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          authenticated: false,
          user: null,
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      user,
    });
  } catch (error) {
    console.error("Me API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "حدث خطأ",
      },
      { status: 500 }
    );
  }
}