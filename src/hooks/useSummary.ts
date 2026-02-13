"use client";

import { useState, useCallback } from "react";

export type SummaryMode = "openrouter" | "gemini";

const MODE_KEY = "mytube_summary_mode";
const CACHE_PREFIX = "mytube_summary_v3_";

function getSavedMode(): SummaryMode {
  try {
    const v = localStorage.getItem(MODE_KEY);
    if (v === "openrouter" || v === "gemini") return v;
  } catch {}
  return "openrouter";
}

function getCached(mode: SummaryMode, videoId: string): string | null {
  try {
    return localStorage.getItem(CACHE_PREFIX + mode + "_" + videoId);
  } catch {
    return null;
  }
}

function setCache(mode: SummaryMode, videoId: string, summary: string) {
  try {
    localStorage.setItem(CACHE_PREFIX + mode + "_" + videoId, summary);
  } catch {}
}

export function useSummary() {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setModeState] = useState<SummaryMode>(getSavedMode);

  const setMode = useCallback((m: SummaryMode) => {
    setModeState(m);
    try {
      localStorage.setItem(MODE_KEY, m);
    } catch {}
  }, []);

  const summarize = useCallback(
    async (videoId: string) => {
      setError(null);

      const cached = getCached(mode, videoId);
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
          body: JSON.stringify({ videoId, mode }),
        });
        if (!res.ok) throw new Error("요약 실패");
        const data = await res.json();
        setSummary(data.summary);
        setCache(mode, videoId, data.summary);
      } catch (err) {
        setError(err instanceof Error ? err.message : "요약 중 오류 발생");
      } finally {
        setLoading(false);
      }
    },
    [mode]
  );

  const reset = useCallback(() => {
    setSummary(null);
    setError(null);
    setLoading(false);
  }, []);

  const isCached = useCallback(
    (videoId: string) => getCached(mode, videoId) !== null,
    [mode]
  );

  return { summary, loading, error, summarize, reset, mode, setMode, isCached };
}
