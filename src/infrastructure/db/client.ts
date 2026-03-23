import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

const url = process.env.TURSO_DATABASE_URL ?? "file:./local.db";

export const client = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN
});

export const db = drizzle(client);

let schemaReadyPromise: Promise<void> | null = null;

export async function ensureDatabaseReady(): Promise<void> {
  if (schemaReadyPromise) {
    return schemaReadyPromise;
  }

  schemaReadyPromise = (async () => {
    await client.batch(
      [
        `CREATE TABLE IF NOT EXISTS settings (
          id TEXT PRIMARY KEY NOT NULL,
          automation_mode TEXT NOT NULL,
          current_turn_id TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS turns (
          id TEXT PRIMARY KEY NOT NULL,
          turn_number INTEGER NOT NULL UNIQUE,
          opens_at TEXT NOT NULL,
          closes_at TEXT NOT NULL,
          status TEXT NOT NULL,
          winning_prompt_id TEXT,
          action_script_id TEXT,
          adjudication_mode TEXT NOT NULL,
          summary TEXT,
          closed_at TEXT,
          executed_at TEXT
        )`,
        `CREATE TABLE IF NOT EXISTS prompts (
          id TEXT PRIMARY KEY NOT NULL,
          turn_id TEXT NOT NULL,
          author_id TEXT NOT NULL,
          text TEXT NOT NULL,
          votes INTEGER NOT NULL DEFAULT 0,
          status TEXT NOT NULL,
          submitted_at TEXT NOT NULL,
          moderation_notes TEXT
        )`,
        `CREATE TABLE IF NOT EXISTS votes (
          id TEXT PRIMARY KEY NOT NULL,
          turn_id TEXT NOT NULL,
          prompt_id TEXT NOT NULL,
          voter_id TEXT NOT NULL,
          created_at TEXT NOT NULL
        )`,
        `CREATE UNIQUE INDEX IF NOT EXISTS votes_turn_voter_unique ON votes(turn_id, voter_id)`,
        `CREATE TABLE IF NOT EXISTS action_scripts (
          id TEXT PRIMARY KEY NOT NULL,
          prompt_id TEXT NOT NULL,
          summary TEXT NOT NULL,
          operations_json TEXT NOT NULL,
          created_at TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS lore_entries (
          id TEXT PRIMARY KEY NOT NULL,
          turn_id TEXT NOT NULL,
          title TEXT NOT NULL,
          summary TEXT NOT NULL,
          details TEXT NOT NULL,
          created_at TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS world_snapshots (
          turn_id TEXT PRIMARY KEY NOT NULL,
          snapshot_json TEXT NOT NULL,
          is_current INTEGER NOT NULL DEFAULT 0
        )`
      ].map((sql) => ({ sql }))
    );
  })();

  return schemaReadyPromise;
}
