"use client";

import { useState, useCallback, useRef } from "react";
import type { VideoItem } from "@/types/video";
import type { SearchFilters } from "@/types/search";

function buildFilterParams(filters?: SearchFilters): string {
  if (!filters) return "";
  const params = new URLSearchParams();
  if (filters.sort_by && filters.sort_by !== "relevance")
    params.set("sort_by", filters.sort_by);
  if (filters.upload_date && filters.upload_date !== "all")
    params.set("upload_date", filters.upload_date);
  if (filters.duration && filters.duration !== "all")
    params.set("duration", filters.duration);
  const str = params.toString();
  return str ? `&${str}` : "";
}

export function useSearch() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(0);
  const queryRef = useRef("");
  const filtersRef = useRef<SearchFilters | undefined>(undefined);

  const search = useCallback(async (query: string, filters?: SearchFilters) => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    filtersRef.current = filters;
    try {
      const filterStr = buildFilterParams(filters);
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&page=0${filterStr}`
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
      const filterStr = buildFilterParams(filtersRef.current);
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(queryRef.current)}&page=${nextPage}${filterStr}`
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
