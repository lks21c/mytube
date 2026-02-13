import { GoogleGenAI } from "@google/genai";

export const GEMINI_MODEL =
  process.env.GEMINI_MODEL || "gemini-2.5-flash";

const keys: string[] = (process.env.GEMINI_API_KEYS ?? "")
  .split(",")
  .map((k) => k.trim())
  .filter(Boolean);

let currentIndex = 0;
const clients = new Map<string, GoogleGenAI>();

function getClient(apiKey: string): GoogleGenAI {
  let client = clients.get(apiKey);
  if (!client) {
    client = new GoogleGenAI({ apiKey });
    clients.set(apiKey, client);
  }
  return client;
}

function isRateLimitError(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return (
      msg.includes("429") ||
      msg.includes("rate limit") ||
      msg.includes("resource_exhausted") ||
      msg.includes("quota")
    );
  }
  return false;
}

/**
 * Execute a request with automatic key rotation on rate limit.
 * Tries each key once before giving up.
 */
export async function withGemini<T>(
  fn: (ai: GoogleGenAI) => Promise<T>
): Promise<T> {
  if (keys.length === 0) {
    throw new Error("GEMINI_API_KEYS 환경변수가 설정되지 않았습니다");
  }

  const tried = new Set<number>();

  while (tried.size < keys.length) {
    const idx = currentIndex % keys.length;
    tried.add(idx);

    const client = getClient(keys[idx]);
    try {
      const result = await fn(client);
      return result;
    } catch (err) {
      if (isRateLimitError(err)) {
        console.warn(
          `Gemini key #${idx + 1} rate limited, rotating to next...`
        );
        currentIndex = (idx + 1) % keys.length;
        continue;
      }
      throw err;
    }
  }

  throw new Error("모든 Gemini API 키가 rate limit 상태입니다");
}
