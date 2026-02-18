"use client";

import { use, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSummary } from "@/hooks/useSummary";
import { formatSummary } from "@/lib/formatSummary";

function SummaryContent({ videoId }: { videoId: string }) {
  const { summary, loading, error, summarize } = useSummary();

  useEffect(() => {
    summarize(videoId);
  }, [videoId, summarize]);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-[var(--color-yt-border)] px-4 py-3">
        <Link
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[var(--color-yt-hover)]"
          aria-label="홈으로"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18l-6-6 6-6"
              stroke="#606060"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <h1 className="text-base font-semibold text-[var(--color-yt-text)]">
          AI 요약
        </h1>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-2xl">
          {loading && (
            <div className="flex flex-col items-center gap-3 py-20">
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
            <>
              <div
                className="summary-content text-sm leading-relaxed text-[var(--color-yt-text)]"
                dangerouslySetInnerHTML={{ __html: formatSummary(summary) }}
              />
              <div className="mt-6 border-t border-[var(--color-yt-border)] pt-4">
                <a
                  href={`https://www.youtube.com/watch?v=${videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[var(--color-yt-blue,#065fd4)] hover:underline"
                >
                  YouTube에서 보기
                </a>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function SummaryPage({
  params,
}: {
  params: Promise<{ videoId: string }>;
}) {
  const { videoId } = use(params);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[var(--color-yt-red)]" />
        </div>
      }
    >
      <SummaryContent videoId={videoId} />
    </Suspense>
  );
}
