"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  open: boolean;
  loading: boolean;
  summary: string | null;
  error: string | null;
  onClose: () => void;
  videoTitle?: string;
  videoId?: string;
}

function buildShareText(
  summary: string,
  videoTitle?: string,
  videoId?: string,
): string {
  if (videoTitle && videoId) {
    return `📺 ${videoTitle}\n— MyTube AI 요약\n\n${summary}\n\n🔗 https://www.youtube.com/watch?v=${videoId}`;
  }
  return summary;
}

function getYoutubeUrl(videoId?: string): string {
  return videoId ? `https://www.youtube.com/watch?v=${videoId}` : "";
}

export default function SummaryDialog({
  open,
  loading,
  summary,
  error,
  onClose,
  videoTitle,
  videoId,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const shareMenuRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareToast, setShareToast] = useState(false);

  // 클릭 외부 감지로 공유 메뉴 닫기
  useEffect(() => {
    if (!showShareMenu) return;
    const handler = (e: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) {
        setShowShareMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showShareMenu]);

  const handleCopy = useCallback(async () => {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(
        buildShareText(summary, videoTitle, videoId),
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }, [summary, videoTitle, videoId]);

  const handleShareTo = useCallback(
    (service: string) => {
      if (!summary) return;
      const youtubeUrl = getYoutubeUrl(videoId);
      const shortText = videoTitle
        ? `📺 ${videoTitle} — MyTube AI 요약`
        : "MyTube AI 요약";
      const fullText = buildShareText(summary, videoTitle, videoId);

      switch (service) {
        case "kakao": {
          navigator.clipboard.writeText(fullText).then(() => {
            setShareToast(true);
            setTimeout(() => setShareToast(false), 2500);
          });
          break;
        }
        case "x":
          window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(shortText)}&url=${encodeURIComponent(youtubeUrl)}`,
            "_blank",
          );
          break;
        case "facebook":
          window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(youtubeUrl)}`,
            "_blank",
          );
          break;
        case "line":
          window.open(
            `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(youtubeUrl)}&text=${encodeURIComponent(shortText)}`,
            "_blank",
          );
          break;
        case "email":
          window.open(
            `mailto:?subject=${encodeURIComponent(shortText)}&body=${encodeURIComponent(fullText)}`,
          );
          break;
      }
      setShowShareMenu(false);
    },
    [summary, videoTitle, videoId],
  );

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
    if (!open) setShowShareMenu(false);
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="fixed inset-0 m-auto h-auto max-h-[80vh] w-[90vw] max-w-lg overflow-hidden rounded-2xl border-none bg-white p-0 shadow-2xl backdrop:bg-black/50"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-yt-border)] px-5 py-3">
        <h2 className="text-base font-semibold text-[var(--color-yt-text)]">
          AI 요약
        </h2>
        <div className="flex items-center gap-1">
          {summary && (
            <div className="relative" ref={shareMenuRef}>
              <button
                onClick={() => setShowShareMenu((v) => !v)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--color-yt-hover)]"
                aria-label="공유"
                title="공유"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 12v7a2 2 0 002 2h12a2 2 0 002-2v-7M16 6l-4-4-4 4M12 2v13"
                    stroke="#606060"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              {showShareMenu && (
                <div className="absolute right-0 top-10 z-50 rounded-xl bg-white p-3 shadow-lg ring-1 ring-black/5">
                  <div className="flex items-center gap-3">
                    {/* 카카오톡 */}
                    <button
                      onClick={() => handleShareTo("kakao")}
                      className="flex flex-col items-center gap-1"
                      title="카카오톡"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: "#FEE500" }}>
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#3C1E1E">
                          <path d="M12 3C6.48 3 2 6.58 2 10.9c0 2.78 1.8 5.22 4.51 6.6l-.96 3.53c-.08.28.25.5.49.33l4.09-2.72c.61.08 1.24.13 1.87.13 5.52 0 10-3.58 10-7.97C22 6.58 17.52 3 12 3z" />
                        </svg>
                      </span>
                      <span className="text-[10px] text-gray-500">카카오톡</span>
                    </button>
                    {/* X (Twitter) */}
                    <button
                      onClick={() => handleShareTo("x")}
                      className="flex flex-col items-center gap-1"
                      title="X"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white text-sm font-bold">
                        𝕏
                      </span>
                      <span className="text-[10px] text-gray-500">X</span>
                    </button>
                    {/* Facebook */}
                    <button
                      onClick={() => handleShareTo("facebook")}
                      className="flex flex-col items-center gap-1"
                      title="Facebook"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-full text-white text-lg font-bold" style={{ background: "#1877F2" }}>
                        f
                      </span>
                      <span className="text-[10px] text-gray-500">Facebook</span>
                    </button>
                    {/* LINE */}
                    <button
                      onClick={() => handleShareTo("line")}
                      className="flex flex-col items-center gap-1"
                      title="LINE"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-full text-white text-[10px] font-bold" style={{ background: "#06C755" }}>
                        LINE
                      </span>
                      <span className="text-[10px] text-gray-500">LINE</span>
                    </button>
                    {/* 이메일 */}
                    <button
                      onClick={() => handleShareTo("email")}
                      className="flex flex-col items-center gap-1"
                      title="이메일"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: "#606060" }}>
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                          <rect x="3" y="5" width="18" height="14" rx="2" stroke="white" strokeWidth="2" />
                          <path d="M3 7l9 6 9-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <span className="text-[10px] text-gray-500">이메일</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {summary && (
            <button
              onClick={handleCopy}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--color-yt-hover)]"
              aria-label="복사"
              title={copied ? "복사됨!" : "복사"}
            >
              {copied ? (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="#16a34a"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <rect
                    x="9"
                    y="9"
                    width="11"
                    height="11"
                    rx="2"
                    stroke="#606060"
                    strokeWidth="2"
                  />
                  <path
                    d="M5 15V5a2 2 0 012-2h10"
                    stroke="#606060"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </button>
          )}
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--color-yt-hover)]"
            aria-label="닫기"
          >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="#606060"
              strokeWidth="2"
              strokeLinecap="round"
            />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="overflow-y-auto px-5 py-4" style={{ maxHeight: "calc(80vh - 56px)" }}>
        {loading && (
          <div className="flex flex-col items-center gap-3 py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[var(--color-yt-red)]" />
            <p className="text-sm text-[var(--color-yt-text-secondary)]">
              요약 중...
            </p>
          </div>
        )}
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}
        {summary && (
          <>
            <div
              className="summary-content text-sm leading-relaxed text-[var(--color-yt-text)]"
              dangerouslySetInnerHTML={{ __html: formatSummary(summary) }}
            />
            {videoTitle && videoId && (
              <div className="mt-4 border-t border-[var(--color-yt-border)] pt-3 text-xs text-[var(--color-yt-text-secondary)]">
                참고:{" "}
                <a
                  href={`https://www.youtube.com/watch?v=${videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-yt-blue,#065fd4)] hover:underline"
                >
                  {videoTitle}
                </a>
              </div>
            )}
          </>
        )}
      </div>

      {/* 카카오톡 클립보드 복사 토스트 */}
      {shareToast && (
        <div className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-lg bg-gray-800 px-4 py-2.5 text-sm text-white shadow-lg">
          텍스트가 복사되었습니다. 카카오톡에 붙여넣기 해주세요
        </div>
      )}
    </dialog>
  );
}

/** Simple markdown-like formatting for the summary text */
function formatSummary(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/^#### (.+)$/gm, "<h4>$1</h4>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^[-*] (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>")
    .replace(/^/, "<p>")
    .replace(/$/, "</p>");
}
