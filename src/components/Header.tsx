"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import AuthDialog from "./AuthDialog";
import Sidebar from "./Sidebar";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then((data) => setAuthenticated(data.authenticated))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (pathname === "/search") {
      setQuery(searchParams.get("q") ?? "");
    }
  }, [pathname, searchParams]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  async function handleSignOut() {
    await fetch("/api/auth", { method: "DELETE" });
    setAuthenticated(false);
    window.location.reload();
  }

  return (
    <>
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between gap-4 border-b border-[var(--color-yt-border)] bg-white px-4">
        {/* Hamburger + Logo */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="메뉴 열기"
            className="rounded-full p-2 hover:bg-[var(--color-yt-hover)]"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 6h18M3 12h18M3 18h18"
                stroke="#0f0f0f"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <a href="/" className="flex items-center gap-1">
          <svg viewBox="0 0 90 20" className="h-5 w-auto" aria-label="MyTube">
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
          </a>
        </div>

        {/* Search */}
        <form
          onSubmit={handleSubmit}
          className="flex max-w-[600px] flex-1 items-center"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="검색"
            className="h-10 w-full rounded-l-full border border-[var(--color-yt-border)] bg-white px-4 text-sm outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="flex h-10 w-16 shrink-0 items-center justify-center rounded-r-full border border-l-0 border-[var(--color-yt-border)] bg-[var(--color-yt-hover)]"
            aria-label="검색"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
                stroke="#606060"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </form>

        {/* Auth button */}
        {authenticated ? (
          <button
            onClick={handleSignOut}
            className="shrink-0 rounded-full border border-[var(--color-yt-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-yt-text-secondary)] hover:bg-[var(--color-yt-hover)]"
          >
            로그아웃
          </button>
        ) : (
          <button
            onClick={() => setAuthOpen(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            로그인
          </button>
        )}
      </header>

      <AuthDialog
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthenticated={() => {
          setAuthenticated(true);
          window.location.reload();
        }}
      />

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  );
}
