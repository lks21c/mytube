"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, pw }),
      });

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "로그인에 실패했습니다.");
      }
    } catch {
      setError("서버에 연결할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-yt-hover)] px-4">
      <div className="w-full max-w-sm rounded-xl border border-[var(--color-yt-border)] bg-white p-8 shadow-sm">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <svg viewBox="0 0 90 20" className="h-6 w-auto" aria-label="MyTube">
            <rect width="28" height="20" rx="4" fill="#ff0000" />
            <polygon points="11,4 11,16 21,10" fill="white" />
            <text
              x="32"
              y="15"
              fontFamily="var(--font-sans), sans-serif"
              fontWeight="700"
              fontSize="14"
              fill="#0f0f0f"
            >
              MyTube
            </text>
          </svg>
        </div>

        <h1 className="mb-6 text-center text-lg font-semibold text-[var(--color-yt-text)]">
          로그인
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="아이디"
            autoFocus
            required
            className="h-10 rounded-lg border border-[var(--color-yt-border)] bg-white px-3 text-sm outline-none focus:border-blue-500"
          />
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="비밀번호"
            required
            className="h-10 rounded-lg border border-[var(--color-yt-border)] bg-white px-3 text-sm outline-none focus:border-blue-500"
          />

          {error && (
            <p className="text-center text-xs text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-10 rounded-lg bg-[var(--color-yt-red)] text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>
      </div>
    </div>
  );
}
