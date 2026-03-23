import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const settingsTable = sqliteTable("settings", {
  id: text("id").primaryKey(),
  automationMode: text("automation_mode").notNull(),
  currentTurnId: text("current_turn_id").notNull()
});

export const turnsTable = sqliteTable("turns", {
  id: text("id").primaryKey(),
  turnNumber: integer("turn_number").notNull().unique(),
  opensAt: text("opens_at").notNull(),
  closesAt: text("closes_at").notNull(),
  status: text("status").notNull(),
  winningPromptId: text("winning_prompt_id"),
  actionScriptId: text("action_script_id"),
  adjudicationMode: text("adjudication_mode").notNull(),
  summary: text("summary"),
  closedAt: text("closed_at"),
  executedAt: text("executed_at")
});

export const promptsTable = sqliteTable("prompts", {
  id: text("id").primaryKey(),
  turnId: text("turn_id").notNull(),
  authorId: text("author_id").notNull(),
  text: text("text").notNull(),
  votes: integer("votes").notNull().default(0),
  status: text("status").notNull(),
  submittedAt: text("submitted_at").notNull(),
  moderationNotes: text("moderation_notes")
});

export const votesTable = sqliteTable(
  "votes",
  {
    id: text("id").primaryKey(),
    turnId: text("turn_id").notNull(),
    promptId: text("prompt_id").notNull(),
    voterId: text("voter_id").notNull(),
    createdAt: text("created_at").notNull()
  },
  (table) => ({
    uniqueVotePerTurn: uniqueIndex("votes_turn_voter_unique").on(table.turnId, table.voterId)
  })
);

export const actionScriptsTable = sqliteTable("action_scripts", {
  id: text("id").primaryKey(),
  promptId: text("prompt_id").notNull(),
  summary: text("summary").notNull(),
  operationsJson: text("operations_json").notNull(),
  createdAt: text("created_at").notNull()
});

export const loreEntriesTable = sqliteTable("lore_entries", {
  id: text("id").primaryKey(),
  turnId: text("turn_id").notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  details: text("details").notNull(),
  createdAt: text("created_at").notNull()
});

export const worldSnapshotsTable = sqliteTable("world_snapshots", {
  turnId: text("turn_id").primaryKey(),
  snapshotJson: text("snapshot_json").notNull(),
  isCurrent: integer("is_current", { mode: "boolean" }).notNull().default(false)
});
