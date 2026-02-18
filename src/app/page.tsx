"use client";

import Header from "@/components/Header";
import VideoGrid from "@/components/VideoGrid";
import SummaryDialog from "@/components/SummaryDialog";
import { useFeed } from "@/hooks/useFeed";
import { useSummary } from "@/hooks/useSummary";
import { useState, useEffect, Suspense } from "react";

function HomeContent() {
  const { videos, loading, loadingMore, hasMore, error, loadMore } = useFeed();
  const {
    summary,
    loading: summaryLoading,
    error: summaryError,
    summarize,
    reset,
    mode,
    setMode,
    isCached,
    loadCachedIds,
  } = useSummary();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [summaryVideoId, setSummaryVideoId] = useState<string>();
  const [summaryVideoTitle, setSummaryVideoTitle] = useState<string>();

  useEffect(() => {
    if (videos.length === 0) return;
    const ids = videos.map((v) => v.id).filter(Boolean);
    loadCachedIds(ids);
  }, [videos, loadCachedIds]);

  function handleSummarize(videoId: string, title: string) {
    setSummaryVideoId(videoId);
    setSummaryVideoTitle(title);
    setDialogOpen(true);
    summarize(videoId);
  }

  function handleClose() {
    setDialogOpen(false);
    reset();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header summaryMode={mode} onSummaryModeChange={setMode} />

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
          isCached={isCached}
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
        videoTitle={summaryVideoTitle}
        videoId={summaryVideoId}
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
