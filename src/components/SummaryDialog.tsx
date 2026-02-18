"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  open: boolean;
  loading: boolean;
  summary: string | null;
  error: string | null;
  onClose: () => void;
}

export default function SummaryDialog({
  open,
  loading,
  summary,
  error,
  onClose,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }, [summary]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="fixed inset-0 m-auto h-auto max-h-[80vh] w-[90vw] max-w-lg overflow-hidden rounded-2xl border-none bg-white p-0 shadow-2xl backdrop:bg-black/50"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-yt-border)] px-5 py-3">
        <h2 className="text-base font-semibold text-[var(--color-yt-text)]">
          AI 요약
        </h2>
        <div className="flex items-center gap-1">
          {summary && (
            <button
              onClick={handleCopy}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--color-yt-hover)]"
              aria-label="복사"
              title={copied ? "복사됨!" : "복사"}
            >
              {copied ? (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="#16a34a"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <rect
                    x="9"
                    y="9"
                    width="11"
                    height="11"
                    rx="2"
                    stroke="#606060"
                    strokeWidth="2"
                  />
                  <path
                    d="M5 15V5a2 2 0 012-2h10"
                    stroke="#606060"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </button>
          )}
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--color-yt-hover)]"
            aria-label="닫기"
          >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="#606060"
              strokeWidth="2"
              strokeLinecap="round"
            />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="overflow-y-auto px-5 py-4" style={{ maxHeight: "calc(80vh - 56px)" }}>
        {loading && (
          <div className="flex flex-col items-center gap-3 py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[var(--color-yt-red)]" />
            <p className="text-sm text-[var(--color-yt-text-secondary)]">
              요약 중...
            </p>
          </div>
        )}
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}
        {summary && (
          <div
            className="summary-content text-sm leading-relaxed text-[var(--color-yt-text)]"
            dangerouslySetInnerHTML={{ __html: formatSummary(summary) }}
          />
        )}
      </div>
    </dialog>
  );
}

/** Simple markdown-like formatting for the summary text */
function formatSummary(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/^#### (.+)$/gm, "<h4>$1</h4>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^[-*] (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>")
    .replace(/^/, "<p>")
    .replace(/$/, "</p>");
}
