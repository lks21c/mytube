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

const LOGIN_USER_DATA_DIR = path.join(os.tmpdir(), "mytube-chrome-login");
const COOKIE_FILE = path.join(process.cwd(), "mytube-cookies.json");

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

// Initialize from disk on module load
savedCookie = loadCookieFromDisk();
authenticated = !!savedCookie;

export async function getInnertube(): Promise<Innertube> {
  if (!instance) {
    console.log("Creating Innertube instance...");
    instance = await Innertube.create({
      lang: "ko",
      location: "KR",
      ...(savedCookie ? { cookie: savedCookie } : {}),
    });

    authenticated = !!savedCookie;
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
  console.log("Innertube instance reset (unauthenticated)");
}

export function getAuthStatus(): {
  authenticated: boolean;
  loginInProgress: boolean;
} {
  return { authenticated, loginInProgress };
}

export async function signOut(): Promise<void> {
  savedCookie = null;
  authenticated = false;
  instance = null;
  try { fs.unlinkSync(COOKIE_FILE); } catch {}
}

export function isAuthenticated(): boolean {
  return authenticated;
}
