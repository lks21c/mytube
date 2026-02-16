import { NextRequest, NextResponse } from "next/server";
import { getInnertube } from "@/lib/innertube";
import { extractVideo } from "@/lib/extractVideo";
import type { VideoItem } from "@/types/video";

// Cache search results for continuation
let cachedSearch: any = null;
let cachedQuery = "";
let cachedPage = 0;
let cachedFilters = "";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  const page = parseInt(request.nextUrl.searchParams.get("page") ?? "0");

  const sortBy = request.nextUrl.searchParams.get("sort_by") || "";
  const uploadDate = request.nextUrl.searchParams.get("upload_date") || "";
  const duration = request.nextUrl.searchParams.get("duration") || "";

  const filtersKey = `${sortBy}|${uploadDate}|${duration}`;

  if (!query) {
    return NextResponse.json(
      { error: "검색어를 입력하세요" },
      { status: 400 }
    );
  }

  try {
    const yt = await getInnertube();

    const searchFilters: Record<string, string> = { type: "video" };
    if (sortBy && sortBy !== "relevance") searchFilters.sort_by = sortBy;
    if (uploadDate && uploadDate !== "all") searchFilters.upload_date = uploadDate;
    if (duration && duration !== "all") searchFilters.duration = duration;

    // New query, page 0, or filter change: fresh search
    if (
      page === 0 ||
      query !== cachedQuery ||
      filtersKey !== cachedFilters ||
      !cachedSearch
    ) {
      cachedSearch = await yt.search(query, searchFilters);
      cachedQuery = query;
      cachedFilters = filtersKey;
      cachedPage = 0;
    } else {
      // Load next page via continuation
      while (cachedPage < page && cachedSearch.has_continuation) {
        cachedSearch = await cachedSearch.getContinuation();
        cachedPage++;
      }
    }

    const videos = cachedSearch.videos ?? [];
    const items = videos
      .map(extractVideo)
      .filter((v: VideoItem | null): v is VideoItem => v !== null);

    return NextResponse.json({
      videos: items,
      hasMore: !!cachedSearch.has_continuation,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "검색에 실패했습니다" },
      { status: 500 }
    );
  }
}
