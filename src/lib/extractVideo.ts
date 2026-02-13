import type { VideoItem } from "@/types/video";

export function extractVideo(v: any): VideoItem | null {
  const id = v.video_id ?? v.id;
  if (!id) return null;
  return {
    id,
    title: v.title?.toString?.() ?? "",
    thumbnail:
      v.best_thumbnail?.url ??
      v.thumbnails?.[0]?.url ??
      `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    channelName: v.author?.name ?? "",
    channelThumbnail: v.author?.best_thumbnail?.url ?? "",
    viewCount: v.short_view_count?.toString?.() ?? "",
    publishedTime: v.published?.toString?.() ?? "",
    duration:
      typeof v.duration === "object" ? v.duration.text ?? "" : "",
  };
}

/**
 * Extract video from LockupView (authenticated homeFeed in youtubei.js v16+)
 */
export function extractLockupView(lockup: any): VideoItem | null {
  const id = lockup.content_id;
  if (!id) return null;

  const meta = lockup.metadata;
  const title = meta?.title?.text ?? "";

  // Channel name is in metadata_rows[0].metadata_parts[0].text.text
  let channelName = "";
  let viewCount = "";
  let publishedTime = "";

  const rows = meta?.metadata?.metadata_rows ?? [];
  for (const row of rows) {
    for (const part of row.metadata_parts ?? []) {
      const text = part?.text?.text ?? "";
      if (!channelName && part?.text?.endpoint) {
        channelName = text;
      } else if (text.includes("조회수") || text.includes("회")) {
        viewCount = text;
      } else if (text.includes("전") || text.includes("ago")) {
        publishedTime = text;
      }
    }
  }

  // Thumbnail from content_image
  const thumbs = lockup.content_image?.image ?? [];
  const thumbnail =
    thumbs[0]?.url ?? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

  // Duration from ThumbnailBottomOverlayView badges or overlay text
  let duration = "";
  const overlays = lockup.content_image?.overlays ?? [];
  for (const overlay of overlays) {
    if (overlay.type === "ThumbnailBottomOverlayView") {
      for (const badge of overlay.badges ?? []) {
        if (badge?.text && /\d+:\d+/.test(badge.text)) {
          duration = badge.text;
          break;
        }
      }
    }
    if (!duration) {
      const dText = overlay?.text?.text;
      if (dText && /\d+:\d+/.test(dText)) {
        duration = dText;
      }
    }
    if (duration) break;
  }

  return {
    id,
    title,
    thumbnail,
    channelName,
    channelThumbnail: "",
    viewCount,
    publishedTime,
    duration,
  };
}
