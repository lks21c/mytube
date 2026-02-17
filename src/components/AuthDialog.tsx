"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    Android?: { startYouTubeLogin: () => void };
    onYouTubeCookies?: (cookie: string) => void;
  }
}

interface Props {
  open: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
}

interface OAuthInfo {
  verificationUrl: string;
  userCode: string;
}

export default function AuthDialog({ open, onClose, onAuthenticated }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isWebView, setIsWebView] = useState(false);
  const [oauthInfo, setOauthInfo] = useState<OAuthInfo | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setIsWebView(typeof window !== "undefined" && !!window.Android);
  }, []);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setLoading(false);
    setOauthInfo(null);
    setCopied(false);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [open]);

  function startPolling() {
    pollingRef.current = setInterval(async () => {
      try {
        const r = await fetch("/api/auth/status");
        const status = await r.json();
        if (status.authenticated) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setLoading(false);
          setOauthInfo(null);
          onAuthenticated();
          onClose();
        }
        if (!status.loginInProgress && !status.authenticated) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setError("로그인이 취소되었습니다");
          setLoading(false);
          setOauthInfo(null);
        }
      } catch {
        // ignore
      }
    }, 2000);
  }

  async function handleWebViewLogin() {
    setLoading(true);
    setError(null);

    window.onYouTubeCookies = async (cookie: string) => {
      try {
        const res = await fetch("/api/auth/cookie", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cookie }),
        });
        const data = await res.json();
        if (data.ok) {
          setLoading(false);
          onAuthenticated();
          onClose();
        } else {
          setError(data.error || "쿠키 적용에 실패했습니다");
          setLoading(false);
        }
      } catch {
        setError("쿠키 전송에 실패했습니다");
        setLoading(false);
      }
    };

    window.Android!.startYouTubeLogin();
  }

  async function handleDesktopLogin() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth", { method: "POST" });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "로그인 시작 실패");
        setLoading(false);
        return;
      }

      // OAuth device code flow
      if (data.oauth) {
        setOauthInfo({
          verificationUrl: data.verificationUrl,
          userCode: data.userCode,
        });
        setLoading(false);
        startPolling();
        return;
      }

      // Puppeteer flow — poll for completion
      startPolling();
    } catch {
      setError("로그인에 실패했습니다");
      setLoading(false);
    }
  }

  async function handleCopyCode() {
    if (!oauthInfo) return;
    try {
      await navigator.clipboard.writeText(oauthInfo.userCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text
    }
  }

  function handleLogin() {
    if (isWebView) {
      handleWebViewLogin();
    } else {
      handleDesktopLogin();
    }
  }

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="fixed inset-0 m-auto h-auto max-h-[80vh] w-[90vw] max-w-sm overflow-hidden rounded-2xl border-none bg-white p-0 shadow-2xl backdrop:bg-black/50"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-yt-border)] px-5 py-3">
        <h2 className="text-base font-semibold text-[var(--color-yt-text)]">
          YouTube 로그인
        </h2>
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

      {/* Content */}
      <div className="flex flex-col items-center gap-4 px-5 py-8">
        {/* Initial state — login button */}
        {!loading && !error && !oauthInfo && (
          <>
            <svg className="h-12 w-12 text-[var(--color-yt-text-secondary)]" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <p className="text-center text-sm text-[var(--color-yt-text)]">
              Google 계정으로 로그인하면<br />맞춤 추천 피드를 볼 수 있습니다
            </p>
            <button
              onClick={handleLogin}
              className="flex items-center gap-2 rounded-full bg-blue-600 px-8 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Google 로그인
            </button>
          </>
        )}

        {/* OAuth device code UI */}
        {oauthInfo && !error && (
          <div className="flex w-full flex-col items-center gap-4">
            <p className="text-center text-sm text-[var(--color-yt-text)]">
              아래 URL에서 코드를 입력하세요
            </p>

            <a
              href={oauthInfo.verificationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                <path
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {oauthInfo.verificationUrl}
            </a>

            <div className="flex items-center gap-2">
              <code className="rounded-lg bg-gray-100 px-4 py-2.5 text-xl font-bold tracking-widest text-[var(--color-yt-text)]">
                {oauthInfo.userCode}
              </code>
              <button
                onClick={handleCopyCode}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50"
                aria-label="코드 복사"
                title="코드 복사"
              >
                {copied ? (
                  <svg className="h-4 w-4 text-green-600" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none">
                    <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2" />
                  </svg>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-[var(--color-yt-text-secondary)]">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-blue-500" />
              인증 대기 중...
            </div>

            <button
              onClick={() => {
                if (pollingRef.current) clearInterval(pollingRef.current);
                setOauthInfo(null);
                setLoading(false);
              }}
              className="text-xs text-[var(--color-yt-text-secondary)] underline hover:text-[var(--color-yt-text)]"
            >
              취소
            </button>
          </div>
        )}

        {/* Puppeteer loading state */}
        {loading && !oauthInfo && (
          <>
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[var(--color-yt-red)]" />
            <p className="text-center text-sm text-[var(--color-yt-text)]">
              {isWebView
                ? <>YouTube 로그인 화면에서<br />Google 계정으로 로그인해주세요</>
                : <>Chrome 로그인 창에서<br />Google 계정으로 로그인해주세요</>
              }
            </p>
            <p className="text-xs text-[var(--color-yt-text-secondary)]">
              로그인 완료 시 자동으로 진행됩니다
            </p>
          </>
        )}

        {/* Error state */}
        {error && (
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
            <button
              onClick={() => {
                setError(null);
                handleLogin();
              }}
              className="text-sm text-blue-600 underline hover:text-blue-700"
            >
              다시 시도
            </button>
          </div>
        )}
      </div>
    </dialog>
  );
}
