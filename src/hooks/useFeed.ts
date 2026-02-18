"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { VideoItem } from "@/types/video";

export function useFeed() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(0);
  const retryRef = useRef(0);
  const MAX_RETRIES = 2;

  useEffect(() => {
    async function fetchFeed() {
      try {
        const res = await fetch("/api/feed?page=0");
        if (!res.ok) throw new Error("피드 로딩 실패");
        const data = await res.json();
        setVideos(data.videos);
        setHasMore(data.hasMore);
        pageRef.current = 0;
      } catch (err) {
        setError(err instanceof Error ? err.message : "알 수 없는 오류");
      } finally {
        setLoading(false);
      }
    }
    fetchFeed();
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = pageRef.current + 1;
      const res = await fetch(`/api/feed?page=${nextPage}`);
      if (!res.ok) throw new Error("추가 로딩 실패");
      const data = await res.json();
      setVideos((prev) => [...prev, ...data.videos]);
      setHasMore(data.hasMore);
      pageRef.current = nextPage;
      retryRef.current = 0;
    } catch (err) {
      console.warn("Feed loadMore failed:", err);
      retryRef.current++;
      if (retryRef.current >= MAX_RETRIES) {
        setHasMore(false);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore]);

  return { videos, loading, loadingMore, hasMore, error, loadMore };
}
