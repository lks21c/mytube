import { NextRequest, NextResponse } from "next/server";
import { getInnertube } from "@/lib/innertube";
import { extractVideo } from "@/lib/extractVideo";
import type { VideoItem } from "@/types/video";

// Cache search results for continuation
let cachedSearch: any = null;
let cachedQuery = "";
let cachedPage = 0;

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  const page = parseInt(request.nextUrl.searchParams.get("page") ?? "0");

  if (!query) {
    return NextResponse.json(
      { error: "검색어를 입력하세요" },
      { status: 400 }
    );
  }

  try {
    const yt = await getInnertube();

    // New query or page 0: fresh search
    if (page === 0 || query !== cachedQuery || !cachedSearch) {
      cachedSearch = await yt.search(query, { type: "video" });
      cachedQuery = query;
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
