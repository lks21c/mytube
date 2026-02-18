import { NextRequest, NextResponse } from "next/server";
import { getInnertube, isAuthenticated, resetInstance } from "@/lib/innertube";
import { extractVideo, extractLockupView } from "@/lib/extractVideo";
import type { VideoItem } from "@/types/video";

let cachedFeed: any = null;
let cachedPage = 0;
let cachedAuthState = false;

function extractAllVideos(feed: any): VideoItem[] {
  const items: VideoItem[] = [];

  // 1) Try standard .videos (works for search, trending)
  const standardVideos = feed.videos ?? [];
  for (const v of standardVideos) {
    const extracted = extractVideo(v);
    if (extracted) items.push(extracted);
  }

  // 2) If no standard videos, try RichGrid > LockupView (authenticated homeFeed)
  if (items.length === 0) {
    const grid = feed.contents;
    if (grid?.contents) {
      for (const item of grid.contents) {
        const lockup = item?.content;
        if (lockup?.content_id) {
          const extracted = extractLockupView(lockup);
          if (extracted) items.push(extracted);
        }
      }
    }
  }

  return items;
}

export async function GET(request: NextRequest) {
  const page = parseInt(request.nextUrl.searchParams.get("page") ?? "0");

  try {
    const yt = await getInnertube();

    const currentAuth = isAuthenticated();
    if (currentAuth !== cachedAuthState) {
      cachedFeed = null;
      cachedAuthState = currentAuth;
    }

    if (page === 0 || !cachedFeed) {
      let feed: any = null;

      // 1) Try home feed
      try {
        const home = await yt.getHomeFeed();
        feed = home;
        const testItems = extractAllVideos(home);
        if (testItems.length > 0) {
          console.log("Feed: using homeFeed,", testItems.length, "videos");
        } else {
          feed = null;
        }
      } catch (e) {
        console.log("Feed: homeFeed failed:", (e as Error).message);
      }

      // 2) Try trending
      if (!feed) {
        try {
          const trending = await yt.getTrending();
          const testItems = extractAllVideos(trending);
          if (testItems.length > 0) {
            feed = trending;
            console.log("Feed: using trending,", testItems.length, "videos");
          }
        } catch (e) {
          console.log("Feed: trending failed:", (e as Error).message);
        }
      }

      // 3) Fallback to search
      if (!feed) {
        try {
          feed = await yt.search("한국 인기 영상 2025", { type: "video" });
          console.log("Feed: using search fallback");
        } catch (e) {
          console.log("Feed: search fallback failed:", (e as Error).message);
        }
      }

      // All sources failed — reset instance and retry unauthenticated
      if (!feed) {
        console.log("Feed: all sources failed, resetting Innertube instance...");
        resetInstance();
        const freshYt = await getInnertube();

        try {
          const trending = await freshYt.getTrending();
          const testItems = extractAllVideos(trending);
          if (testItems.length > 0) {
            feed = trending;
            console.log("Feed: recovery using trending,", testItems.length, "videos");
          }
        } catch (e) {
          console.log("Feed: recovery trending failed:", (e as Error).message);
        }

        if (!feed) {
          try {
            feed = await freshYt.search("한국 인기 영상 2025", { type: "video" });
            console.log("Feed: recovery using search fallback");
          } catch (e) {
            console.log("Feed: recovery search failed:", (e as Error).message);
          }
        }
      }

      if (!feed) {
        return NextResponse.json({ videos: [], hasMore: false });
      }

      const items = extractAllVideos(feed);
      cachedFeed = feed;
      cachedPage = 0;

      return NextResponse.json({
        videos: items,
        hasMore: !!cachedFeed.has_continuation,
      });
    }

    // Load next pages via continuation
    try {
      while (cachedPage < page && cachedFeed.has_continuation) {
        cachedFeed = await cachedFeed.getContinuation();
        cachedPage++;
      }
    } catch (e) {
      console.error("Feed continuation failed at page", cachedPage, ":", (e as Error).message);
      return NextResponse.json({ videos: [], hasMore: false });
    }

    let items = extractAllVideos(cachedFeed);

    // 빈 continuation 스킵 (최대 3회)
    let emptySkips = 0;
    while (items.length === 0 && cachedFeed.has_continuation && emptySkips < 3) {
      try {
        cachedFeed = await cachedFeed.getContinuation();
        cachedPage++;
        items = extractAllVideos(cachedFeed);
        emptySkips++;
      } catch {
        return NextResponse.json({ videos: [], hasMore: false });
      }
    }

    return NextResponse.json({
      videos: items,
      hasMore: !!cachedFeed.has_continuation,
    });
  } catch (error) {
    console.error("Feed error:", error);
    return NextResponse.json(
      { error: "피드를 불러올 수 없습니다" },
      { status: 500 }
    );
  }
}
