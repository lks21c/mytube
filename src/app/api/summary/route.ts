import { NextRequest, NextResponse } from "next/server";
import {
  createPartFromUri,
  createUserContent,
  createPartFromText,
} from "@google/genai";
import { GEMINI_MODEL, withGemini } from "@/lib/gemini";
import { openrouter, MODEL } from "@/lib/openrouter";
import { getInnertube } from "@/lib/innertube";

type SummaryMode = "openrouter" | "gemini";

async function summarizeWithOpenRouter(videoId: string): Promise<string> {
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const yt = await getInnertube();
  const info = await yt.getInfo(videoId);

  const title = info.basic_info?.title ?? "";
  const author = info.basic_info?.author ?? "";

  // Extract captions
  let transcript = "";
  const tracks = info.captions?.caption_tracks ?? [];
  if (tracks.length > 0) {
    const koTrack = tracks.find((t) => t.language_code === "ko");
    const track = koTrack ?? tracks[0];

    if (track.base_url) {
      try {
        const captionUrl = track.base_url + "&fmt=json3";
        const res = await fetch(captionUrl);
        if (res.ok) {
          const json = await res.json();
          const events = json.events ?? [];
          const lines: string[] = [];
          for (const event of events) {
            if (event.segs) {
              const text = event.segs
                .map((s: { utf8?: string }) => s.utf8 ?? "")
                .join("");
              if (text.trim()) lines.push(text.trim());
            }
          }
          transcript = lines.join(" ");
        }
      } catch (e) {
        console.warn("Caption fetch failed:", (e as Error).message);
      }
    }
  }

  let prompt: string;
  if (transcript) {
    const trimmed = transcript.slice(0, 12000);
    prompt = `제목: ${title}\n채널: ${author}\n자막:\n${trimmed}\n\n위 자막을 기반으로 이 유튜브 영상의 핵심 내용을 한국어로 요약해줘.`;
  } else {
    prompt = `${url}\n제목: ${title}\n채널: ${author}\n\n이 유튜브 영상의 핵심 내용을 웹에서 검색해서 한국어로 요약해줘.`;
  }

  const completion = await openrouter().chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
  });

  return completion.choices?.[0]?.message?.content ?? "";
}

async function summarizeWithGemini(videoId: string): Promise<string> {
  const url = `https://www.youtube.com/watch?v=${videoId}`;

  return withGemini(async (ai) => {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: createUserContent([
        createPartFromUri(url, "video/mp4"),
        createPartFromText("이 유튜브 영상의 핵심 내용을 한국어로 요약해줘."),
      ]),
    });
    return response.text ?? "";
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoId, mode = "openrouter" } = body as {
      videoId?: string;
      mode?: SummaryMode;
    };

    if (!videoId || typeof videoId !== "string") {
      return NextResponse.json(
        { error: "videoId가 필요합니다" },
        { status: 400 }
      );
    }

    const summary =
      mode === "gemini"
        ? await summarizeWithGemini(videoId)
        : await summarizeWithOpenRouter(videoId);

    if (!summary) {
      return NextResponse.json(
        { error: "요약을 생성할 수 없습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json({ summary });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Summary error:", msg);
    return NextResponse.json(
      { error: "요약 중 오류가 발생했습니다", detail: msg },
      { status: 500 }
    );
  }
}
