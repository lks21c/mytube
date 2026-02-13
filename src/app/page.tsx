"use client";

import Header from "@/components/Header";
import VideoGrid from "@/components/VideoGrid";
import SummaryDialog from "@/components/SummaryDialog";
import { useFeed } from "@/hooks/useFeed";
import { useSummary } from "@/hooks/useSummary";
import { useState, Suspense } from "react";

function HomeContent() {
  const { videos, loading, loadingMore, hasMore, error, loadMore } = useFeed();
  const {
    summary,
    loading: summaryLoading,
    error: summaryError,
    summarize,
    reset,
  } = useSummary();
  const [dialogOpen, setDialogOpen] = useState(false);

  function handleSummarize(videoId: string) {
    setDialogOpen(true);
    summarize(videoId);
  }

  function handleClose() {
    setDialogOpen(false);
    reset();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
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

        <VideoGrid
          videos={videos}
          onSummarize={handleSummarize}
          loadingMore={loadingMore}
          hasMore={hasMore}
          onLoadMore={loadMore}
        />
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

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[var(--color-yt-red)]" />
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
