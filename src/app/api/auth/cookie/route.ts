import { NextRequest, NextResponse } from "next/server";
import { applyCookieString } from "@/lib/innertube";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cookie } = body;

    if (!cookie || typeof cookie !== "string" || cookie.trim().length < 10) {
      return NextResponse.json(
        { error: "유효한 쿠키 문자열이 필요합니다" },
        { status: 400 }
      );
    }

    const authenticated = await applyCookieString(cookie.trim());
    return NextResponse.json({ ok: true, authenticated });
  } catch {
    return NextResponse.json(
      { error: "쿠키 적용에 실패했습니다" },
      { status: 500 }
    );
  }
}
