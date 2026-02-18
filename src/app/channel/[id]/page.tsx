"use client";

import { use, useState, Suspense } from "react";
import Image from "next/image";
import Header from "@/components/Header";
import VideoGrid from "@/components/VideoGrid";
import SummaryDialog from "@/components/SummaryDialog";
import { useChannel } from "@/hooks/useChannel";
import { useSummary } from "@/hooks/useSummary";

function ChannelContent({ channelId }: { channelId: string }) {
  const { channel, videos, loading, loadingMore, hasMore, error, loadMore } =
    useChannel(channelId);
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

      <main className="flex-1 overflow-y-auto">
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

        {!loading && channel && (
          <>
            {/* Channel Header */}
            <div className="border-b border-gray-200 px-4 py-6 sm:px-6 lg:px-8">
              <div className="mx-auto flex max-w-5xl items-center gap-4">
                {channel.avatar ? (
                  <Image
                    src={channel.avatar}
                    alt={channel.name}
                    width={80}
                    height={80}
                    className="h-20 w-20 rounded-full"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-gray-300" />
                )}
                <div>
                  <h1 className="text-xl font-bold text-[var(--color-yt-text)]">
                    {channel.name}
                  </h1>
                  {channel.subscriberCount && (
                    <p className="mt-1 text-sm text-[var(--color-yt-text-secondary)]">
                      {channel.subscriberCount}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Video list */}
            <div className="px-4 py-6 sm:px-6 lg:px-8">
              <VideoGrid
                videos={videos}
                onSummarize={handleSummarize}
                isCached={isCached}
                loadingMore={loadingMore}
                hasMore={hasMore}
                onLoadMore={loadMore}
              />

              {!loading && videos.length === 0 && (
                <p className="py-12 text-center text-sm text-[var(--color-yt-text-secondary)]">
                  동영상이 없습니다.
                </p>
              )}
            </div>
          </>
        )}
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

export default function ChannelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[var(--color-yt-red)]" />
        </div>
      }
    >
      <ChannelContent channelId={id} />
    </Suspense>
  );
}
