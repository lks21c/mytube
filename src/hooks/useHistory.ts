"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { VideoItem } from "@/types/video";

export interface HistorySection {
  title: string;
  videos: VideoItem[];
}

export function useHistory() {
  const [sections, setSections] = useState<HistorySection[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(0);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch("/api/history?page=0");
        if (res.status === 401) {
          setError("시청 기록을 보려면 로그인이 필요합니다");
          return;
        }
        if (!res.ok) throw new Error("시청 기록 로딩 실패");
        const data = await res.json();
        setSections(data.sections);
        setHasMore(data.hasMore);
        pageRef.current = 0;
      } catch (err) {
        setError(err instanceof Error ? err.message : "알 수 없는 오류");
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = pageRef.current + 1;
      const res = await fetch(`/api/history?page=${nextPage}`);
      if (!res.ok) throw new Error("추가 로딩 실패");
      const data = await res.json();
      setSections((prev) => [...prev, ...data.sections]);
      setHasMore(data.hasMore);
      pageRef.current = nextPage;
    } catch {
      // silently fail
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore]);

  return { sections, loading, loadingMore, hasMore, error, loadMore };
}
