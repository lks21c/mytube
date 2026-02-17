import { NextResponse } from "next/server";
import { startCookieLogin, startOAuthLogin, signOut } from "@/lib/innertube";

export async function POST() {
  // Try Puppeteer (Chrome) login first
  try {
    await startCookieLogin();
    return NextResponse.json({ ok: true });
  } catch {
    // Chrome/Puppeteer not available — fall through to OAuth
  }

  // Fallback: OAuth2 Device Code Flow
  try {
    const oauthInfo = await startOAuthLogin();
    return NextResponse.json({
      ok: true,
      oauth: true,
      verificationUrl: oauthInfo.verificationUrl,
      userCode: oauthInfo.userCode,
    });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  await signOut();
  return NextResponse.json({ ok: true });
}
