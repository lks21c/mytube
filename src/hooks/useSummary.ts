"use client";

import { useState, useCallback } from "react";

const STORAGE_KEY_PREFIX = "mytube_summary_";

function getCached(videoId: string): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_PREFIX + videoId);
  } catch {
    return null;
  }
}

function setCache(videoId: string, summary: string) {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + videoId, summary);
  } catch {
    // storage full or unavailable
  }
}

export function useSummary() {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const summarize = useCallback(async (videoId: string) => {
    setError(null);

    const cached = getCached(videoId);
    if (cached) {
      setSummary(cached);
      return;
    }

    setLoading(true);
    setSummary(null);
    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
      });
      if (!res.ok) throw new Error("요약 실패");
      const data = await res.json();
      setSummary(data.summary);
      setCache(videoId, data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "요약 중 오류 발생");
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setSummary(null);
    setError(null);
    setLoading(false);
  }, []);

  return { summary, loading, error, summarize, reset };
}
