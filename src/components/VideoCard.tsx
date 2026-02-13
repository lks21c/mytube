"use client";

import Image from "next/image";
import type { VideoItem } from "@/types/video";

interface Props {
  video: VideoItem;
  onSummarize: (videoId: string) => void;
}

export default function VideoCard({ video, onSummarize }: Props) {
  return (
    <div className="group flex flex-col gap-3">
      {/* Thumbnail */}
      <a
        href={`https://www.youtube.com/watch?v=${video.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="relative aspect-video w-full overflow-hidden rounded-xl bg-gray-100"
      >
        <Image
          src={video.thumbnail}
          alt={video.title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
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
          className="mt-0.5 h-8 shrink-0 rounded-full bg-[var(--color-yt-red)] px-3 text-xs font-medium text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100 max-sm:opacity-100"
          title="AI 요약"
        >
          요약
        </button>
      </div>
    </div>
  );
}
