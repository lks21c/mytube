"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Header from "@/components/Header";
import VideoGrid from "@/components/VideoGrid";
import SummaryDialog from "@/components/SummaryDialog";
import { useSearch } from "@/hooks/useSearch";
import { useSummary } from "@/hooks/useSummary";

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const { videos, loading, loadingMore, hasMore, error, search, loadMore } =
    useSearch();
  const {
    summary,
    loading: summaryLoading,
    error: summaryError,
    summarize,
    reset,
  } = useSummary();
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (query) search(query);
  }, [query, search]);

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
        {query && (
          <h1 className="mb-6 text-lg font-medium text-[var(--color-yt-text)]">
            &ldquo;{query}&rdquo; 검색 결과
          </h1>
        )}

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

        {!loading && !error && videos.length === 0 && query && (
          <p className="py-12 text-center text-sm text-[var(--color-yt-text-secondary)]">
            검색 결과가 없습니다.
          </p>
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

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[var(--color-yt-red)]" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
