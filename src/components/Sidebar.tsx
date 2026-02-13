"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { SummaryMode } from "@/hooks/useSummary";

interface Props {
  open: boolean;
  onClose: () => void;
  summaryMode: SummaryMode;
  onSummaryModeChange: (mode: SummaryMode) => void;
}

export default function Sidebar({ open, onClose, summaryMode, onSummaryModeChange }: Props) {
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/50 transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <nav
        className={`fixed left-0 top-0 z-[70] flex h-full w-60 flex-col bg-white transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex h-14 items-center gap-4 border-b border-[var(--color-yt-border)] px-4">
          <button onClick={onClose} aria-label="메뉴 닫기" className="p-1">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
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

        {/* Menu */}
        <ul className="flex-1 py-3">
          <li>
            <Link
              href="/"
              onClick={onClose}
              className="flex items-center gap-4 px-6 py-2.5 text-sm font-medium text-[var(--color-yt-text)] hover:bg-[var(--color-yt-hover)]"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              홈
            </Link>
          </li>
          <li>
            <Link
              href="/history"
              onClick={onClose}
              className="flex items-center gap-4 px-6 py-2.5 text-sm font-medium text-[var(--color-yt-text)] hover:bg-[var(--color-yt-hover)]"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              기록
            </Link>
          </li>
        </ul>

        {/* Settings */}
        <div className="border-t border-[var(--color-yt-border)] px-4 py-4">
          <p className="mb-2 px-2 text-xs font-semibold text-[var(--color-yt-text-secondary)]">
            설정
          </p>
          <div className="flex items-center justify-between px-2">
            <span className="text-sm text-[var(--color-yt-text)]">요약 방식</span>
            <div className="flex rounded-full bg-gray-100 p-0.5 text-xs">
              <button
                onClick={() => onSummaryModeChange("openrouter")}
                className={`rounded-full px-2.5 py-1 font-medium transition-colors ${
                  summaryMode === "openrouter"
                    ? "bg-white text-[var(--color-yt-text)] shadow-sm"
                    : "text-[var(--color-yt-text-secondary)] hover:text-[var(--color-yt-text)]"
                }`}
              >
                자막
              </button>
              <button
                onClick={() => onSummaryModeChange("gemini")}
                className={`rounded-full px-2.5 py-1 font-medium transition-colors ${
                  summaryMode === "gemini"
                    ? "bg-white text-[var(--color-yt-text)] shadow-sm"
                    : "text-[var(--color-yt-text-secondary)] hover:text-[var(--color-yt-text)]"
                }`}
              >
                Gemini
              </button>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
