"use client";

import { useState, Suspense, useEffect, useRef } from "react";
import Header from "@/components/Header";
import VideoCard from "@/components/VideoCard";
import SummaryDialog from "@/components/SummaryDialog";
import { useHistory } from "@/hooks/useHistory";
import { useSummary } from "@/hooks/useSummary";

function HistoryContent() {
  const { sections, loading, loadingMore, hasMore, error, loadMore } =
    useHistory();
  const {
    summary,
    loading: summaryLoading,
    error: summaryError,
    summarize,
    reset,
  } = useSummary();
  const [dialogOpen, setDialogOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loadMore || !hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "400px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore, hasMore]);

  function handleSummarize(videoId: string) {
    setDialogOpen(true);
    summarize(videoId);
  }

  function handleClose() {
    setDialogOpen(false);
    reset();
  }

  const totalVideos = sections.reduce((n, s) => n + s.videos.length, 0);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-xl font-bold text-[var(--color-yt-text)]">
          시청 기록
        </h1>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[var(--color-yt-red)]" />
          </div>
        )}

        {error && (
          <div className="mx-auto max-w-md rounded-lg bg-red-50 px-4 py-3 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && totalVideos === 0 && (
          <p className="py-12 text-center text-sm text-[var(--color-yt-text-secondary)]">
            시청 기록이 없습니다
          </p>
        )}

        {sections.map((section, si) => (
          <section key={si} className="mb-8">
            {section.title && (
              <h2 className="mb-4 text-base font-semibold text-[var(--color-yt-text)]">
                {section.title}
              </h2>
            )}
            <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {section.videos.map((video, vi) => (
                <VideoCard
                  key={`${video.id}-${vi}`}
                  video={video}
                  onSummarize={handleSummarize}
                />
              ))}
            </div>
          </section>
        ))}

        {hasMore && (
          <div ref={sentinelRef} className="flex justify-center py-8">
            {loadingMore && (
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[var(--color-yt-red)]" />
            )}
          </div>
        )}
      </main>

      <SummaryDialog
        open={dialogOpen}
        loading={summaryLoading}
        summary={summary}
        error={summaryError}
        onClose={handleClose}
      />
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[var(--color-yt-red)]" />
        </div>
      }
    >
      <HistoryContent />
    </Suspense>
  );
}
