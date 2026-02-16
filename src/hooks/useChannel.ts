"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { VideoItem } from "@/types/video";

interface ChannelInfo {
  name: string;
  avatar: string;
  banner: string;
  subscriberCount: string;
}

export function useChannel(channelId: string) {
  const [channel, setChannel] = useState<ChannelInfo | null>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(0);

  useEffect(() => {
    if (!channelId) return;
    let cancelled = false;

    async function fetchChannel() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/channel?id=${encodeURIComponent(channelId)}&page=0`
        );
        if (!res.ok) throw new Error("채널 로딩 실패");
        const data = await res.json();
        if (cancelled) return;
        setChannel(data.channel);
        // Fill channel info into each video
        const info = data.channel;
        const enriched = (data.videos as VideoItem[]).map((v) => ({
          ...v,
          channelName: v.channelName || info?.name || "",
          channelThumbnail: v.channelThumbnail || info?.avatar || "",
          channelUrl: v.channelUrl || `/channel/${channelId}`,
        }));
        setVideos(enriched);
        setHasMore(data.hasMore);
        pageRef.current = 0;
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "알 수 없는 오류");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchChannel();
    return () => { cancelled = true; };
  }, [channelId]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = pageRef.current + 1;
      const res = await fetch(
        `/api/channel?id=${encodeURIComponent(channelId)}&page=${nextPage}`
      );
      if (!res.ok) throw new Error("추가 로딩 실패");
      const data = await res.json();
      const enriched = (data.videos as VideoItem[]).map((v) => ({
        ...v,
        channelName: v.channelName || channel?.name || "",
        channelThumbnail: v.channelThumbnail || channel?.avatar || "",
        channelUrl: v.channelUrl || `/channel/${channelId}`,
      }));
      setVideos((prev) => [...prev, ...enriched]);
      setHasMore(data.hasMore);
      pageRef.current = nextPage;
    } catch {
      // silently fail
    } finally {
      setLoadingMore(false);
    }
  }, [channelId, channel, loadingMore, hasMore]);

  return { channel, videos, loading, loadingMore, hasMore, error, loadMore };
}
