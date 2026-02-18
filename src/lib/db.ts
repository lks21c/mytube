import Database from "better-sqlite3";
import path from "path";

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(path.join(process.cwd(), "dev.db"));
    db.pragma("journal_mode = WAL");
    db.exec(`
      CREATE TABLE IF NOT EXISTS summaries (
        videoId   TEXT NOT NULL,
        mode      TEXT NOT NULL,
        summary   TEXT NOT NULL,
        createdAt TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (videoId, mode)
      )
    `);
  }
  return db;
}

export function getCachedSummary(
  videoId: string,
  mode: string
): string | null {
  const row = getDb()
    .prepare("SELECT summary FROM summaries WHERE videoId = ? AND mode = ?")
    .get(videoId, mode) as { summary: string } | undefined;
  return row?.summary ?? null;
}

export function setCachedSummary(
  videoId: string,
  mode: string,
  summary: string
): void {
  getDb()
    .prepare(
      "INSERT OR REPLACE INTO summaries (videoId, mode, summary) VALUES (?, ?, ?)"
    )
    .run(videoId, mode, summary);
}
