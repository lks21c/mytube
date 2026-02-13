import { NextResponse } from "next/server";
import { startCookieLogin, signOut } from "@/lib/innertube";

export async function POST() {
  try {
    await startCookieLogin();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "로그인 시작에 실패했습니다" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  await signOut();
  return NextResponse.json({ ok: true });
}
