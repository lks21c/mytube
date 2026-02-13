"use client";

import Image from "next/image";
import { useState } from "react";
import type { VideoItem } from "@/types/video";

interface Props {
  video: VideoItem;
  onSummarize: (videoId: string) => void;
  cached?: boolean;
}

export default function VideoCard({ video, onSummarize, cached }: Props) {
  const [errored, setErrored] = useState(false);

  return (
    <div className="group flex flex-col gap-3">
      {/* Thumbnail */}
      <a
        href={`https://www.youtube.com/watch?v=${video.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="relative aspect-video w-full overflow-hidden rounded-xl bg-gray-200"
      >
        {!errored ? (
          <Image
            src={video.thumbnail}
            alt={video.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            onError={() => setErrored(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gray-200 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {video.duration && (
          <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-xs font-medium text-white">
            {video.duration}
          </span>
        )}
      </a>

      {/* Info */}
      <div className="flex gap-3 px-1">
        {/* Channel avatar */}
        {video.channelThumbnail ? (
          <Image
            src={video.channelThumbnail}
            alt={video.channelName}
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 rounded-full"
          />
        ) : (
          <div className="h-9 w-9 shrink-0 rounded-full bg-gray-300" />
        )}

        {/* Text */}
        <div className="min-w-0 flex-1">
          <a
            href={`https://www.youtube.com/watch?v=${video.id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <h3 className="line-clamp-2 text-sm font-medium leading-5 text-[var(--color-yt-text)]">
              {video.title}
            </h3>
          </a>
          <p className="mt-0.5 text-xs text-[var(--color-yt-text-secondary)]">
            {video.channelName}
          </p>
          <p className="text-xs text-[var(--color-yt-text-secondary)]">
            {[video.viewCount, video.publishedTime].filter(Boolean).join(" · ")}
          </p>
        </div>

        {/* Summary button */}
        <button
          onClick={() => onSummarize(video.id)}
          className={`mt-0.5 h-8 shrink-0 rounded-full px-3 text-xs font-medium text-white ${
            cached
              ? "bg-gray-400 hover:bg-gray-500"
              : "bg-[var(--color-yt-red)] hover:bg-red-600"
          }`}
          title="AI 요약"
        >
          요약
        </button>
      </div>
    </div>
  );
}
