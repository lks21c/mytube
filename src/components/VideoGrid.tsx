"use client";

import { useEffect, useRef } from "react";
import VideoCard from "./VideoCard";
import type { VideoItem } from "@/types/video";

interface Props {
  videos: VideoItem[];
  onSummarize: (videoId: string, title: string) => void;
  isCached?: (videoId: string) => boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export default function VideoGrid({
  videos,
  onSummarize,
  isCached,
  loadingMore,
  hasMore,
  onLoadMore,
}: Props) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!onLoadMore || !hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) onLoadMore();
      },
      { rootMargin: "400px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [onLoadMore, hasMore]);

  if (videos.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {videos.map((video, i) => (
          <VideoCard
            key={`${video.id}-${i}`}
            video={video}
            onSummarize={onSummarize}
            cached={isCached?.(video.id)}
          />
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          {loadingMore && (
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[var(--color-yt-red)]" />
          )}
        </div>
      )}
    </>
  );
}
