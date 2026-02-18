"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense, useMemo } from "react";
import Header from "@/components/Header";
import VideoGrid from "@/components/VideoGrid";
import SummaryDialog from "@/components/SummaryDialog";
import SearchFilterBar from "@/components/SearchFilterBar";
import { useSearch } from "@/hooks/useSearch";
import { useSummary } from "@/hooks/useSummary";
import { DEFAULT_FILTERS } from "@/types/search";
import type { SearchFilters } from "@/types/search";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";

  const filters: SearchFilters = useMemo(
    () => ({
      sort_by: searchParams.get("sort_by") || DEFAULT_FILTERS.sort_by,
      upload_date: searchParams.get("upload_date") || DEFAULT_FILTERS.upload_date,
      duration: searchParams.get("duration") || DEFAULT_FILTERS.duration,
    }),
    [searchParams]
  );

  const { videos, loading, loadingMore, hasMore, error, search, loadMore } =
    useSearch();
  const {
    summary,
    loading: summaryLoading,
    error: summaryError,
    summarize,
    reset,
    mode,
    setMode,
    isCached,
  } = useSummary();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [summaryVideoId, setSummaryVideoId] = useState<string>();
  const [summaryVideoTitle, setSummaryVideoTitle] = useState<string>();

  useEffect(() => {
    if (query) search(query, filters);
  }, [query, filters, search]);

  function handleFilterChange(newFilters: SearchFilters) {
    const params = new URLSearchParams();
    params.set("q", query);
    if (newFilters.sort_by && newFilters.sort_by !== DEFAULT_FILTERS.sort_by)
      params.set("sort_by", newFilters.sort_by);
    if (newFilters.upload_date && newFilters.upload_date !== DEFAULT_FILTERS.upload_date)
      params.set("upload_date", newFilters.upload_date);
    if (newFilters.duration && newFilters.duration !== DEFAULT_FILTERS.duration)
      params.set("duration", newFilters.duration);
    router.push(`/search?${params.toString()}`);
  }

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
        {query && (
          <h1 className="mb-4 text-lg font-medium text-[var(--color-yt-text)]">
            &ldquo;{query}&rdquo; 검색 결과
          </h1>
        )}

        {query && (
          <SearchFilterBar query={query} filters={filters} onChange={handleFilterChange} />
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
