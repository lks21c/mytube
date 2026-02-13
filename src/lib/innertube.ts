import { Innertube } from "youtubei.js";
import puppeteer, { Browser } from "puppeteer";
import path from "path";
import os from "os";
import fs from "fs";

let instance: Innertube | null = null;
let authenticated = false;
let savedCookie: string | null = null;
let loginInProgress = false;
let loginBrowser: Browser | null = null;

const LOGIN_USER_DATA_DIR = path.join(os.tmpdir(), "mytube-chrome-login");
const COOKIE_FILE = path.join(os.tmpdir(), "mytube-cookies.json");

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
 * Launch Chrome for Google login, extract YouTube cookies automatically.
 * Returns immediately - poll getAuthStatus() to check completion.
 */
export async function startCookieLogin(): Promise<void> {
  if (loginInProgress) return;
  loginInProgress = true;

  (async () => {
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

      const page = await loginBrowser.newPage();
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

      await loginBrowser.close();
      loginBrowser = null;

      // Apply & persist cookies
      savedCookie = cookieStr;
      saveCookieToDisk(cookieStr);
      instance = null;
      await getInnertube();

      try {
        const yt = await getInnertube();
        const home = await yt.getHomeFeed();
        if ((home.videos?.length ?? 0) > 0) {
          authenticated = true;
          console.log("Cookie login success!");
        }
      } catch (e) {
        console.log("Home feed test failed, but cookies applied:", (e as Error).message);
        authenticated = true;
      }
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
