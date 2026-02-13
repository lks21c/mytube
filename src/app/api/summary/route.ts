import { NextRequest, NextResponse } from "next/server";
import { openrouter, MODEL } from "@/lib/openrouter";

export async function POST(request: NextRequest) {
  try {
    const { videoId } = await request.json();
    if (!videoId || typeof videoId !== "string") {
      return NextResponse.json(
        { error: "videoId가 필요합니다" },
        { status: 400 }
      );
    }

    const url = `https://www.youtube.com/watch?v=${videoId}`;

    const completion = await openrouter().chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "user",
          content: `다음 유튜브 영상을 한국어로 요약해줘: ${url}`,
        },
      ],
    });

    const summary = completion.choices[0]?.message?.content;
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
