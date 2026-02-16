import { NextRequest, NextResponse } from "next/server";
import { getInnertube } from "@/lib/innertube";
import type { VideoItem } from "@/types/video";

let cachedContinuation: any = null;
let cachedChannelId = "";
let cachedPage = 0;

function extractChannelMeta(data: any) {
  let name = "";
  let avatar = "";
  let banner = "";
  let subscriberCount = "";

  // Try C4TabbedHeaderRenderer
  if (data?.header?.c4TabbedHeaderRenderer) {
    const h = data.header.c4TabbedHeaderRenderer;
    name = h.title ?? "";
    subscriberCount = h.subscriberCountText?.simpleText ?? "";
    avatar = h.avatar?.thumbnails?.slice(-1)[0]?.url ?? "";
    banner = h.banner?.thumbnails?.slice(-1)[0]?.url ?? "";
  }

  // Fallback: metadata renderer
  if (!name) {
    const meta = data?.metadata?.channelMetadataRenderer;
    name = meta?.title ?? "";
    avatar = meta?.avatar?.thumbnails?.slice(-1)[0]?.url ?? "";
  }

  // PageHeaderRenderer (newer format)
  if (data?.header?.pageHeaderRenderer) {
    const ph = data.header.pageHeaderRenderer;
    const vm = ph?.content?.pageHeaderViewModel;

    if (!name) {
      name = ph?.pageTitle ?? vm?.title?.dynamicTextViewModel?.text?.content ?? "";
    }

    if (!avatar && vm?.image) {
      const sources =
        vm.image.decoratedAvatarViewModel?.avatar?.avatarViewModel?.image?.sources;
      if (sources?.length) avatar = sources[sources.length - 1].url;
    }

    if (!banner && vm?.banner) {
      const sources = vm.banner.imageBannerViewModel?.image?.sources;
      if (sources?.length) banner = sources[sources.length - 1].url;
    }

    if (!subscriberCount) {
      const rows = vm?.metadata?.contentMetadataViewModel?.metadataRows ?? [];
      // Row 0 = handle (@name), Row 1 = subscriber count + video count
      const subPart = rows[1]?.metadataParts?.[0]?.text?.content;
      if (subPart) subscriberCount = subPart;
    }
  }

  return { name, avatar, banner, subscriberCount };
}

function extractVideosFromTab(data: any): {
  videos: VideoItem[];
  continuation: string | null;
} {
  const videos: VideoItem[] = [];
  let continuation: string | null = null;

  // Find the "Videos" tab contents
  const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs ?? [];
  let tabContent: any = null;

  for (const tab of tabs) {
    const tabRenderer = tab.tabRenderer;
    if (!tabRenderer) continue;
    // "Videos" tab or first selected tab
    if (
      tabRenderer.title === "동영상" ||
      tabRenderer.title === "Videos" ||
      tabRenderer.selected
    ) {
      tabContent =
        tabRenderer.content?.richGridRenderer ??
        tabRenderer.content?.sectionListRenderer;
      break;
    }
  }

  if (!tabContent) return { videos, continuation };

  // richGridRenderer
  const contents = tabContent.contents ?? [];
  for (const item of contents) {
    const renderer =
      item.richItemRenderer?.content?.videoRenderer ??
      item.gridVideoRenderer;
    if (!renderer?.videoId) continue;

    const thumbs = renderer.thumbnail?.thumbnails ?? [];
    videos.push({
      id: renderer.videoId,
      title:
        renderer.title?.runs?.[0]?.text ??
        renderer.title?.simpleText ??
        "",
      thumbnail:
        thumbs[thumbs.length - 1]?.url ??
        `https://i.ytimg.com/vi/${renderer.videoId}/hqdefault.jpg`,
      channelName: "",
      channelThumbnail: "",
      channelUrl: "",
      viewCount:
        renderer.shortViewCountText?.simpleText ??
        renderer.viewCountText?.simpleText ??
        "",
      publishedTime: renderer.publishedTimeText?.simpleText ?? "",
      duration:
        renderer.lengthText?.simpleText ??
        renderer.thumbnailOverlays?.[0]?.thumbnailOverlayTimeStatusRenderer
          ?.text?.simpleText ??
        "",
    });
  }

  // continuation token
  for (const item of contents) {
    const token =
      item.continuationItemRenderer?.continuationEndpoint?.continuationCommand
        ?.token;
    if (token) {
      continuation = token;
      break;
    }
  }

  return { videos, continuation };
}

function extractVideosFromContinuation(data: any): {
  videos: VideoItem[];
  continuation: string | null;
} {
  const videos: VideoItem[] = [];
  let continuation: string | null = null;

  const actions =
    data?.onResponseReceivedActions ?? [];
  for (const action of actions) {
    const items =
      action.appendContinuationItemsAction?.continuationItems ?? [];
    for (const item of items) {
      const renderer =
        item.richItemRenderer?.content?.videoRenderer ??
        item.gridVideoRenderer;
      if (!renderer?.videoId) continue;

      const thumbs = renderer.thumbnail?.thumbnails ?? [];
      videos.push({
        id: renderer.videoId,
        title:
          renderer.title?.runs?.[0]?.text ??
          renderer.title?.simpleText ??
          "",
        thumbnail:
          thumbs[thumbs.length - 1]?.url ??
          `https://i.ytimg.com/vi/${renderer.videoId}/hqdefault.jpg`,
        channelName: "",
        channelThumbnail: "",
        channelUrl: "",
        viewCount:
          renderer.shortViewCountText?.simpleText ??
          renderer.viewCountText?.simpleText ??
          "",
        publishedTime: renderer.publishedTimeText?.simpleText ?? "",
        duration:
          renderer.lengthText?.simpleText ??
          renderer.thumbnailOverlays?.[0]
            ?.thumbnailOverlayTimeStatusRenderer?.text?.simpleText ??
          "",
      });
    }
    // continuation token
    for (const item of items) {
      const token =
        item.continuationItemRenderer?.continuationEndpoint
          ?.continuationCommand?.token;
      if (token) {
        continuation = token;
        break;
      }
    }
  }

  return { videos, continuation };
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  const page = parseInt(request.nextUrl.searchParams.get("page") ?? "0");

  if (!id) {
    return NextResponse.json(
      { error: "채널 ID가 필요합니다" },
      { status: 400 }
    );
  }

  try {
    const yt = await getInnertube();

    if (page === 0 || id !== cachedChannelId || !cachedContinuation) {
      // Use raw browse API to avoid parser crash
      const response = await yt.actions.execute("/browse", {
        browseId: id,
        params: "EgZ2aWRlb3PyBgQKAjoA", // "Videos" tab param
      });
      const data = response.data;

      const meta = extractChannelMeta(data);
      const { videos, continuation } = extractVideosFromTab(data);

      cachedContinuation = continuation;
      cachedChannelId = id;
      cachedPage = 0;

      return NextResponse.json({
        channel: meta,
        videos,
        hasMore: !!continuation,
      });
    }

    // Continuation pages
    if (cachedContinuation) {
      const response = await yt.actions.execute("/browse", {
        continuation: cachedContinuation,
      });
      const data = response.data;
      const { videos, continuation } =
        extractVideosFromContinuation(data);

      cachedContinuation = continuation;
      cachedPage = page;

      return NextResponse.json({
        videos,
        hasMore: !!continuation,
      });
    }

    return NextResponse.json({ videos: [], hasMore: false });
  } catch (error) {
    console.error("Channel error:", error);
    return NextResponse.json(
      { error: "채널 정보를 불러올 수 없습니다" },
      { status: 500 }
    );
  }
}
