"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import AuthDialog from "./AuthDialog";
import Sidebar from "./Sidebar";
import type { SummaryMode } from "@/hooks/useSummary";

interface Props {
  summaryMode: SummaryMode;
  onSummaryModeChange: (mode: SummaryMode) => void;
}

export default function Header({ summaryMode, onSummaryModeChange }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then((data) => setAuthenticated(data.authenticated))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (pathname === "/search" && inputRef.current) {
      inputRef.current.value = searchParams.get("q") ?? "";
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchOpen]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const q = inputRef.current?.value.trim() ?? "";
    if (!q) return;
    setSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  async function handleSignOut() {
    await fetch("/api/auth", { method: "DELETE" });
    setAuthenticated(false);
    window.location.reload();
  }

  async function handleSiteLogout() {
    await fetch("/api/login", { method: "DELETE" });
    window.location.href = "/login";
  }

  return (
    <>
      <header className="relative sticky top-0 z-50 flex h-14 items-center justify-between gap-4 border-b border-[var(--color-yt-border)] bg-white px-4">
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
        <div
          className={
            searchOpen
              ? "absolute inset-0 z-10 flex items-center gap-2 bg-white px-2 sm:static sm:inset-auto sm:z-auto sm:flex sm:max-w-[600px] sm:flex-1 sm:items-center sm:gap-0 sm:bg-transparent sm:px-0"
              : "hidden sm:flex sm:max-w-[600px] sm:flex-1 sm:items-center"
          }
        >
          {searchOpen && (
            <button
              onClick={() => setSearchOpen(false)}
              className="shrink-0 rounded-full p-2 hover:bg-[var(--color-yt-hover)] sm:hidden"
              aria-label="검색 닫기"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                <path
                  d="M19 12H5M12 19l-7-7 7-7"
                  stroke="#0f0f0f"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
          <form
            onSubmit={handleSubmit}
            className="flex flex-1 items-center"
          >
            <input
              ref={inputRef}
              type="text"
              defaultValue=""
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
        </div>

        {/* Mobile search icon */}
        <button
          onClick={() => setSearchOpen(true)}
          className="rounded-full p-2 hover:bg-[var(--color-yt-hover)] sm:hidden"
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

        {/* Auth buttons */}
        <div className="flex shrink-0 items-center gap-2">
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
          <button
            onClick={handleSiteLogout}
            title="사이트 로그아웃"
            className="rounded-full p-2 text-[var(--color-yt-text-secondary)] hover:bg-[var(--color-yt-hover)]"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </header>

      <AuthDialog
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthenticated={() => {
          setAuthenticated(true);
          window.location.reload();
        }}
      />

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        summaryMode={summaryMode}
        onSummaryModeChange={onSummaryModeChange}
      />
    </>
  );
}
