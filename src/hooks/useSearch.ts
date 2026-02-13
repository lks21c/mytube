"use client";

import { useState, useCallback, useRef } from "react";
import type { VideoItem } from "@/types/video";

export function useSearch() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(0);
  const queryRef = useRef("");

  const search = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&page=0`
      );
      if (!res.ok) throw new Error("검색 실패");
      const data = await res.json();
      setVideos(data.videos);
      setHasMore(data.hasMore);
      pageRef.current = 0;
      queryRef.current = query;
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !queryRef.current) return;
    setLoadingMore(true);
    try {
      const nextPage = pageRef.current + 1;
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(queryRef.current)}&page=${nextPage}`
      );
      if (!res.ok) throw new Error("추가 로딩 실패");
      const data = await res.json();
      setVideos((prev) => [...prev, ...data.videos]);
      setHasMore(data.hasMore);
      pageRef.current = nextPage;
    } catch {
      // silently fail
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore]);

  return { videos, loading, loadingMore, hasMore, error, search, loadMore };
}
