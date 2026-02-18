import { NextResponse } from "next/server";
import { startCookieLogin, signOut } from "@/lib/innertube";

export async function POST() {
  try {
    await startCookieLogin();
    return NextResponse.json({ ok: true });
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
