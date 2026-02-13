import { NextRequest, NextResponse } from "next/server";
import { getInnertube, isAuthenticated } from "@/lib/innertube";
import { extractLockupView } from "@/lib/extractVideo";
import type { VideoItem } from "@/types/video";

export interface HistorySection {
  title: string;
  videos: VideoItem[];
}

let cachedHistory: any = null;
let cachedPage = 0;

function extractShort(item: any): VideoItem | null {
  const id = item.entity_id?.replace("history-shorts-shelf-item-", "");
  if (!id) return null;

  const title = item.overlay_metadata?.primary_text?.text ?? "";
  const viewCount = item.overlay_metadata?.secondary_text?.text ?? "";

  // Thumbnail from on_tap_endpoint
  let thumbnail = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  try {
    const thumbs = item.on_tap_endpoint?.payload?.thumbnail?.thumbnails;
    if (thumbs?.[0]?.url) thumbnail = thumbs[0].url;
  } catch {}

  return {
    id,
    title,
    thumbnail,
    channelName: "",
    channelThumbnail: "",
    viewCount,
    publishedTime: "",
    duration: "Shorts",
  };
}

function extractHistoryLockup(lockup: any): VideoItem | null {
  const id = lockup.content_id;
  if (!id) return null;

  const meta = lockup.metadata;
  const title = meta?.title?.text ?? "";

  let channelName = "";
  let viewCount = "";

  const rows = meta?.metadata?.metadata_rows ?? [];
  // row[0] contains channel name (part[0]) and view count (part[1])
  const firstRow = rows[0]?.metadata_parts ?? [];
  if (firstRow[0]?.text?.text) channelName = firstRow[0].text.text;
  if (firstRow[1]?.text?.text) viewCount = firstRow[1].text.text;

  const thumbs = lockup.content_image?.image ?? [];
  const thumbnail =
    thumbs[0]?.url ?? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

  // Duration from ThumbnailBottomOverlayView badges
  let duration = "";
  const overlays = lockup.content_image?.overlays ?? [];
  for (const overlay of overlays) {
    if (overlay.type === "ThumbnailBottomOverlayView") {
      for (const badge of overlay.badges ?? []) {
        const badgeText = badge?.text;
        if (badgeText && /\d+:\d+/.test(badgeText)) {
          duration = badgeText;
          break;
        }
      }
    }
  }

  // Channel thumbnail from DecoratedAvatarView → avatar → image
  const channelThumbnail =
    meta?.image?.avatar?.image?.[0]?.url ??
    meta?.image?.image?.[0]?.url ??
    "";

  return {
    id,
    title,
    thumbnail,
    channelName,
    channelThumbnail,
    viewCount,
    publishedTime: "",
    duration,
  };
}

function extractSections(history: any): HistorySection[] {
  const sections: HistorySection[] = [];

  for (const section of history.sections ?? []) {
    const title = section.header?.title?.text ?? "";
    const videos: VideoItem[] = [];

    for (const content of section.contents ?? []) {
      if (content.type === "ReelShelf") {
        // Shorts shelf
        for (const item of content.items ?? []) {
          const short = extractShort(item);
          if (short) videos.push(short);
        }
      } else if (content.type === "LockupView") {
        const video = extractHistoryLockup(content);
        if (video) videos.push(video);
      } else {
        // Fallback: try extractLockupView
        const video = extractLockupView(content);
        if (video) videos.push(video);
      }
    }

    if (videos.length > 0) {
      sections.push({ title, videos });
    }
  }

  return sections;
}

export async function GET(request: NextRequest) {
  if (!isAuthenticated()) {
    return NextResponse.json(
      { error: "시청 기록을 보려면 로그인이 필요합니다" },
      { status: 401 }
    );
  }

  const page = parseInt(request.nextUrl.searchParams.get("page") ?? "0");

  try {
    const yt = await getInnertube();

    if (page === 0 || !cachedHistory) {
      const history = await yt.getHistory();
      cachedHistory = history;
      cachedPage = 0;

      const sections = extractSections(history);
      const totalVideos = sections.reduce((n, s) => n + s.videos.length, 0);
      console.log(
        "History: loaded",
        sections.length,
        "sections,",
        totalVideos,
        "videos"
      );

      return NextResponse.json({
        sections,
        hasMore: !!cachedHistory.has_continuation,
      });
    }

    // Load next pages via continuation
    while (cachedPage < page && cachedHistory.has_continuation) {
      cachedHistory = await cachedHistory.getContinuation();
      cachedPage++;
    }

    const sections = extractSections(cachedHistory);

    return NextResponse.json({
      sections,
      hasMore: !!cachedHistory.has_continuation,
    });
  } catch (error) {
    console.error("History error:", error);
    return NextResponse.json(
      { error: "시청 기록을 불러올 수 없습니다" },
      { status: 500 }
    );
  }
}
