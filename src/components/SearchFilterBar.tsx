"use client";

import { useState, useEffect, useRef } from "react";
import { FILTER_OPTIONS, DEFAULT_FILTERS } from "@/types/search";
import type { SearchFilters } from "@/types/search";

interface SearchFilterBarProps {
  query: string;
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
}

export default function SearchFilterBar({
  query,
  filters,
  onChange,
}: SearchFilterBarProps) {
  const [open, setOpen] = useState(false);
  const prevQueryRef = useRef(query);

  useEffect(() => {
    if (prevQueryRef.current !== query) {
      prevQueryRef.current = query;
      setOpen(false);
      onChange({ ...DEFAULT_FILTERS });
    }
  }, [query, onChange]);

  const activeCount = [
    filters.sort_by && filters.sort_by !== DEFAULT_FILTERS.sort_by,
    filters.upload_date && filters.upload_date !== DEFAULT_FILTERS.upload_date,
    filters.duration && filters.duration !== DEFAULT_FILTERS.duration,
  ].filter(Boolean).length;

  return (
    <div className="mb-4 flex flex-col items-end">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-yt-border)] px-4 py-2 text-sm font-medium text-[var(--color-yt-text)] transition-colors hover:bg-[var(--color-yt-hover)]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="8" y1="12" x2="20" y2="12" />
          <line x1="12" y1="18" x2="20" y2="18" />
        </svg>
        필터
        {activeCount > 0 && (
          <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--color-yt-red)] px-1.5 text-xs font-medium text-white">
            {activeCount}
          </span>
        )}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="mt-3 grid grid-cols-1 gap-6 rounded-lg border border-[var(--color-yt-border)] bg-[var(--color-yt-card)] p-4 sm:grid-cols-3">
          {FILTER_OPTIONS.map((category) => (
            <div key={category.key}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-yt-text-secondary)]">
                {category.label}
              </h3>
              <div className="flex flex-wrap gap-2">
                {category.options.map((option) => {
                  const isSelected =
                    (filters[category.key] || DEFAULT_FILTERS[category.key]) ===
                    option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() =>
                        onChange({ ...filters, [category.key]: option.value })
                      }
                      className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                        isSelected
                          ? "bg-[var(--color-yt-text)] text-[var(--color-yt-card)] font-medium"
                          : "bg-[var(--color-yt-hover)] text-[var(--color-yt-text)] hover:bg-[var(--color-yt-border)]"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
