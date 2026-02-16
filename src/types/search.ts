export interface SearchFilters {
  sort_by?: string;
  upload_date?: string;
  duration?: string;
}

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterCategory {
  key: keyof SearchFilters;
  label: string;
  options: FilterOption[];
}

export const FILTER_OPTIONS: FilterCategory[] = [
  {
    key: "sort_by",
    label: "정렬 기준",
    options: [
      { value: "relevance", label: "관련성" },
      { value: "upload_date", label: "업로드 날짜" },
      { value: "view_count", label: "조회수" },
      { value: "rating", label: "평점" },
    ],
  },
  {
    key: "upload_date",
    label: "업로드 날짜",
    options: [
      { value: "all", label: "전체" },
      { value: "hour", label: "1시간 이내" },
      { value: "today", label: "오늘" },
      { value: "week", label: "이번 주" },
      { value: "month", label: "이번 달" },
      { value: "year", label: "올해" },
    ],
  },
  {
    key: "duration",
    label: "길이",
    options: [
      { value: "all", label: "전체" },
      { value: "short", label: "4분 미만" },
      { value: "medium", label: "4~20분" },
      { value: "long", label: "20분 초과" },
    ],
  },
];

export const DEFAULT_FILTERS: SearchFilters = {
  sort_by: "relevance",
  upload_date: "all",
  duration: "all",
};
