import { NextResponse } from "next/server";
import { startCookieLogin, signOut } from "@/lib/innertube";

export async function POST() {
  try {
    await startCookieLogin();
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = (e as Error).message;
    const isPuppeteerMissing = message.includes("Puppeteer") || message.includes("쿠키를 직접");
    return NextResponse.json(
      {
        error: isPuppeteerMissing
          ? "서버에서 브라우저를 실행할 수 없습니다. 쿠키를 직접 전달해주세요."
          : "로그인 시작에 실패했습니다",
        needsCookieMethod: isPuppeteerMissing,
      },
      { status: isPuppeteerMissing ? 501 : 500 }
    );
  }
}

export async function DELETE() {
  await signOut();
  return NextResponse.json({ ok: true });
}
