import { Innertube } from "youtubei.js";
import type { Browser } from "puppeteer";
import path from "path";
import os from "os";
import fs from "fs";

let instance: Innertube | null = null;
let authenticated = false;
let savedCookie: string | null = null;
let loginInProgress = false;
let loginBrowser: Browser | null = null;

// OAuth2 state
let oauthPending: { verificationUrl: string; userCode: string } | null = null;

const LOGIN_USER_DATA_DIR = path.join(os.tmpdir(), "mytube-chrome-login");
const COOKIE_FILE = path.join(os.tmpdir(), "mytube-cookies.json");
const OAUTH_FILE = path.join(os.tmpdir(), "mytube-oauth.json");

function loadCookieFromDisk(): string | null {
  try {
    if (fs.existsSync(COOKIE_FILE)) {
      const data = fs.readFileSync(COOKIE_FILE, "utf-8");
      console.log("Loaded cookies from disk");
      return data;
    }
  } catch {}
  return null;
}

function saveCookieToDisk(cookie: string): void {
  try {
    fs.writeFileSync(COOKIE_FILE, cookie, "utf-8");
    console.log("Saved cookies to disk");
  } catch (e) {
    console.error("Failed to save cookies:", (e as Error).message);
  }
}

interface OAuthTokens {
  access_token: string;
  refresh_token: string;
  expiry_date: string;
}

function loadOAuthTokens(): OAuthTokens | null {
  try {
    if (fs.existsSync(OAUTH_FILE)) {
      const data = JSON.parse(fs.readFileSync(OAUTH_FILE, "utf-8"));
      console.log("Loaded OAuth tokens from disk");
      return data;
    }
  } catch {}
  return null;
}

function saveOAuthTokens(credentials: OAuthTokens): void {
  try {
    fs.writeFileSync(OAUTH_FILE, JSON.stringify(credentials), "utf-8");
    console.log("Saved OAuth tokens to disk");
  } catch (e) {
    console.error("Failed to save OAuth tokens:", (e as Error).message);
  }
}

// Initialize from disk on module load
savedCookie = loadCookieFromDisk();
let savedOAuthTokens = loadOAuthTokens();
authenticated = !!(savedCookie || savedOAuthTokens);

export async function getInnertube(): Promise<Innertube> {
  if (!instance) {
    console.log("Creating Innertube instance...");
    instance = await Innertube.create({
      lang: "ko",
      location: "KR",
      ...(savedCookie ? { cookie: savedCookie } : {}),
    });

    // Restore OAuth session from saved tokens (when no cookie auth)
    if (!savedCookie && savedOAuthTokens) {
      try {
        console.log("Restoring OAuth session from saved tokens...");
        instance.session.on("update-credentials", ({ credentials }) => {
          saveOAuthTokens(credentials as OAuthTokens);
          console.log("OAuth tokens refreshed and saved");
        });
        instance.session.on("auth-error", (err) => {
          console.error("OAuth auth error during restore:", err.message);
          authenticated = false;
          savedOAuthTokens = null;
          try { fs.unlinkSync(OAUTH_FILE); } catch {}
        });
        await instance.session.signIn(savedOAuthTokens);
        authenticated = true;
        console.log("OAuth session restored successfully");
      } catch (e) {
        console.error("Failed to restore OAuth session:", (e as Error).message);
        savedOAuthTokens = null;
        try { fs.unlinkSync(OAUTH_FILE); } catch {}
        authenticated = false;
      }
    } else {
      authenticated = !!savedCookie;
    }

    console.log("Innertube ready, authenticated:", authenticated);
  }
  return instance;
}

/**
 * Apply a cookie string directly (from WebView or external source).
 * Persists to disk and re-creates the Innertube instance.
 */
export async function applyCookieString(cookieStr: string): Promise<boolean> {
  savedCookie = cookieStr;
  saveCookieToDisk(cookieStr);
  instance = null;
  await getInnertube();

  try {
    const yt = await getInnertube();
    const home = await yt.getHomeFeed();
    if ((home.videos?.length ?? 0) > 0) {
      authenticated = true;
      console.log("Cookie apply success!");
      return true;
    }
  } catch (e) {
    console.log("Home feed test failed, cookies invalid:", (e as Error).message);
    authenticated = false;
    savedCookie = null;
    instance = null;
    try { fs.unlinkSync(COOKIE_FILE); } catch {}
  }
  return authenticated;
}

/**
 * Start OAuth2 Device Code Flow.
 * Returns verification URL + user code immediately when auth-pending fires.
 * Authentication completes asynchronously when user enters the code.
 */
export async function startOAuthLogin(): Promise<{
  verificationUrl: string;
  userCode: string;
}> {
  if (loginInProgress) {
    if (oauthPending) return oauthPending;
    throw new Error("로그인이 이미 진행 중입니다");
  }

  loginInProgress = true;
  oauthPending = null;

  // Create a fresh instance for OAuth
  const yt = await Innertube.create({
    lang: "ko",
    location: "KR",
  });

  return new Promise((resolve, reject) => {
    // Fired when device code is ready for user
    yt.session.on("auth-pending", (data) => {
      console.log(`OAuth: Go to ${data.verification_url} and enter code: ${data.user_code}`);
      oauthPending = {
        verificationUrl: data.verification_url,
        userCode: data.user_code,
      };
      resolve(oauthPending);
    });

    // Fired when user completes authentication
    yt.session.on("auth", ({ credentials }) => {
      console.log("OAuth: Authentication successful!");
      saveOAuthTokens(credentials as OAuthTokens);
      savedOAuthTokens = credentials as OAuthTokens;
      instance = yt;
      authenticated = true;
      loginInProgress = false;
      oauthPending = null;
    });

    // Fired when tokens are refreshed
    yt.session.on("update-credentials", ({ credentials }) => {
      saveOAuthTokens(credentials as OAuthTokens);
      console.log("OAuth tokens refreshed and saved");
    });

    yt.session.on("auth-error", (err) => {
      console.error("OAuth auth error:", err.message);
      loginInProgress = false;
      oauthPending = null;
      reject(new Error("OAuth 인증에 실패했습니다: " + err.message));
    });

    // Start the sign-in flow (don't await — it blocks until user completes)
    yt.session.signIn().catch((e) => {
      console.error("OAuth signIn error:", e.message);
      loginInProgress = false;
      oauthPending = null;
    });
  });
}

/**
 * Launch Chrome for Google login, extract YouTube cookies automatically.
 * Returns immediately - poll getAuthStatus() to check completion.
 * Requires puppeteer to be installed; throws if unavailable.
 */
export async function startCookieLogin(): Promise<void> {
  if (loginInProgress) return;
  loginInProgress = true;

  let puppeteer;
  try {
    puppeteer = (await import("puppeteer")).default;
  } catch {
    loginInProgress = false;
    throw new Error("Puppeteer를 사용할 수 없습니다. 쿠키를 직접 전달해주세요.");
  }

  // Launch Chrome synchronously — fail fast if executable missing
  try {
    console.log("Launching Chrome for YouTube login...");
    loginBrowser = await puppeteer.launch({
      headless: false,
      channel: "chrome",
      userDataDir: LOGIN_USER_DATA_DIR,
      args: [
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-blink-features=AutomationControlled",
        "--window-size=500,700",
      ],
      ignoreDefaultArgs: ["--enable-automation"],
    });
  } catch (e) {
    loginInProgress = false;
    console.error("Chrome launch failed:", (e as Error).message);
    throw new Error("Chrome을 찾을 수 없습니다. 쿠키를 직접 전달해주세요.");
  }

  // Chrome launched — continue login flow in background
  (async () => {
    try {
      const page = await loginBrowser!.newPage();
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, "webdriver", { get: () => undefined });
      });
      await page.setViewport({ width: 480, height: 640 });
      await page.goto(
        "https://accounts.google.com/ServiceLogin?continue=https://www.youtube.com/",
        { waitUntil: "networkidle2" }
      );

      console.log("Waiting for user to complete Google login...");
      await page.waitForFunction(
        () => window.location.hostname === "www.youtube.com",
        { timeout: 300_000 }
      );

      await new Promise((r) => setTimeout(r, 2000));

      const cookies = await page.cookies("https://www.youtube.com");
      const cookieStr = cookies
        .map((c) => `${c.name}=${c.value}`)
        .join("; ");

      console.log("Got", cookies.length, "cookies from YouTube");

      await loginBrowser!.close();
      loginBrowser = null;

      await applyCookieString(cookieStr);
    } catch (e) {
      console.error("Cookie login failed:", (e as Error).message);
      if (loginBrowser) {
        await loginBrowser.close().catch(() => {});
        loginBrowser = null;
      }
    } finally {
      loginInProgress = false;
    }
  })();
}

export function resetInstance(): void {
  instance = null;
  authenticated = false;
  savedCookie = null;
  savedOAuthTokens = null;
  console.log("Innertube instance reset (unauthenticated)");
}

export function getAuthStatus(): {
  authenticated: boolean;
  loginInProgress: boolean;
  oauthPending: { verificationUrl: string; userCode: string } | null;
} {
  return { authenticated, loginInProgress, oauthPending };
}

export async function signOut(): Promise<void> {
  // Sign out from OAuth session if active
  if (instance && savedOAuthTokens) {
    try {
      await instance.session.signOut();
    } catch {}
  }

  savedCookie = null;
  savedOAuthTokens = null;
  authenticated = false;
  instance = null;
  oauthPending = null;
  try { fs.unlinkSync(COOKIE_FILE); } catch {}
  try { fs.unlinkSync(OAUTH_FILE); } catch {}
}

export function isAuthenticated(): boolean {
  return authenticated;
}
