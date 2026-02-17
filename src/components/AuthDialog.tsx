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

export default function AuthDialog({ open, onClose, onAuthenticated }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isWebView, setIsWebView] = useState(false);
  const [cookieMode, setCookieMode] = useState(false);
  const [cookieText, setCookieText] = useState("");

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
    setCookieMode(false);
    setCookieText("");
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [open]);

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
        if (data.needsCookieMethod) {
          setCookieMode(true);
        } else {
          setError(data.error || "로그인 시작 실패");
        }
        setLoading(false);
        return;
      }

      pollingRef.current = setInterval(async () => {
        try {
          const r = await fetch("/api/auth/status");
          const status = await r.json();
          if (status.authenticated) {
            if (pollingRef.current) clearInterval(pollingRef.current);
            setLoading(false);
            onAuthenticated();
            onClose();
          }
          if (!status.loginInProgress && !status.authenticated) {
            if (pollingRef.current) clearInterval(pollingRef.current);
            setError("로그인이 취소되었습니다");
            setLoading(false);
          }
        } catch {
          // ignore
        }
      }, 2000);
    } catch {
      setError("로그인에 실패했습니다");
      setLoading(false);
    }
  }

  async function handleCookieSubmit() {
    if (!cookieText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/cookie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cookie: cookieText.trim() }),
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
        {!loading && !error && !cookieMode && (
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

        {cookieMode && !loading && (
          <div className="flex w-full flex-col gap-3">
            <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              <p className="font-medium">서버에 Chrome이 없어 수동 쿠키 입력이 필요합니다</p>
              <ol className="mt-1.5 list-inside list-decimal space-y-0.5">
                <li>PC 브라우저에서 <b>youtube.com</b>에 로그인</li>
                <li>F12 → Application → Cookies → youtube.com</li>
                <li>모든 쿠키를 복사하여 아래에 붙여넣기</li>
              </ol>
              <p className="mt-1.5 text-[11px] text-amber-600">
                형식: <code className="rounded bg-amber-100 px-1">NAME=VALUE; NAME2=VALUE2</code>
              </p>
            </div>
            <textarea
              value={cookieText}
              onChange={(e) => setCookieText(e.target.value)}
              placeholder="쿠키 문자열을 붙여넣으세요..."
              rows={4}
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-xs text-[var(--color-yt-text)] placeholder:text-gray-400 focus:border-blue-500 focus:outline-none"
            />
            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                {error}
              </div>
            )}
            <button
              onClick={handleCookieSubmit}
              disabled={!cookieText.trim()}
              className="rounded-full bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              적용
            </button>
            <button
              onClick={() => { setCookieMode(false); setError(null); }}
              className="text-xs text-[var(--color-yt-text-secondary)] underline hover:text-[var(--color-yt-text)]"
            >
              취소
            </button>
          </div>
        )}

        {loading && (
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

        {error && !cookieMode && (
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
            <button
              onClick={handleLogin}
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
