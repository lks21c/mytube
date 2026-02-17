import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "mytube_default_secret"
);

export async function POST(req: NextRequest) {
  const { id, pw } = await req.json();

  const validId = process.env.LOGIN_ID;
  const validPw = process.env.LOGIN_PW;

  if (!validId || !validPw) {
    return NextResponse.json(
      { error: "서버에 로그인 설정이 없습니다." },
      { status: 500 }
    );
  }

  if (id !== validId || pw !== validPw) {
    return NextResponse.json(
      { error: "아이디 또는 비밀번호가 틀렸습니다." },
      { status: 401 }
    );
  }

  const token = await new SignJWT({ sub: id })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);

  const res = NextResponse.json({ ok: true });
  res.cookies.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
