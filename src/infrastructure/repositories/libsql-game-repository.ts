import { and, desc, eq } from "drizzle-orm";

import { GameRepository } from "@/application/ports";
import {
  ActionScript,
  AutomationMode,
  CurrentWorldView,
  HistoryEntry,
  LoreEntry,
  Prompt,
  PromptId,
  Turn,
  TurnId,
  WorldState
} from "@/domain/model/types";
import { db, ensureDatabaseReady } from "@/infrastructure/db/client";
import {
  actionScriptsTable,
  loreEntriesTable,
  promptsTable,
  settingsTable,
  turnsTable,
  votesTable,
  worldSnapshotsTable
} from "@/infrastructure/db/schema";

function parseJson<T>(value: string): T {
  return JSON.parse(value) as T;
}

function serializeJson(value: unknown): string {
  return JSON.stringify(value);
}

export class LibsqlGameRepository implements GameRepository {
  async getCurrentWorldView(): Promise<CurrentWorldView | null> {
    await ensureDatabaseReady();

    const [settings] = await db.select().from(settingsTable).where(eq(settingsTable.id, "main"));
    if (!settings) {
      return null;
    }

    const currentTurn = await this.getTurn(settings.currentTurnId);
    const worldState = await this.getCurrentWorldState();
    if (!currentTurn || !worldState) {
      return null;
    }

    const promptFeed = await this.listPromptsByTurn(currentTurn.id);
    const latestLore = await this.getLatestLoreEntry();

    return {
      worldState,
      currentTurn,
      promptFeed,
      latestLore: latestLore ?? undefined,
      automationMode: settings.automationMode as AutomationMode
    };
  }

  async bootstrap(worldState: WorldState, turn: Turn, loreEntry?: LoreEntry): Promise<void> {
    await ensureDatabaseReady();
    await db.insert(turnsTable).values(this.toTurnRecord(turn)).onConflictDoNothing();
    await db
      .insert(settingsTable)
      .values({
        id: "main",
        automationMode: turn.adjudicationMode,
        currentTurnId: turn.id
      })
      .onConflictDoUpdate({
        target: settingsTable.id,
        set: {
          automationMode: turn.adjudicationMode,
          currentTurnId: turn.id
        }
      });
    await this.saveWorldSnapshot(turn.id, worldState, true);
    if (loreEntry) {
      await this.saveLoreEntry(loreEntry);
    }
  }

  async savePrompt(prompt: Prompt): Promise<void> {
    await ensureDatabaseReady();
    await db.insert(promptsTable).values(this.toPromptRecord(prompt));
  }

  async listPromptsByTurn(turnId: TurnId): Promise<Prompt[]> {
    await ensureDatabaseReady();
    const rows = await db.select().from(promptsTable).where(eq(promptsTable.turnId, turnId));
    return rows.map(this.fromPromptRecord);
  }

  async getPrompt(promptId: PromptId): Promise<Prompt | null> {
    await ensureDatabaseReady();
    const [row] = await db.select().from(promptsTable).where(eq(promptsTable.id, promptId));
    return row ? this.fromPromptRecord(row) : null;
  }

  async updatePrompt(prompt: Prompt): Promise<void> {
    await ensureDatabaseReady();
    await db
      .update(promptsTable)
      .set(this.toPromptRecord(prompt))
      .where(eq(promptsTable.id, prompt.id));
  }

  async saveVote(turnId: TurnId, promptId: PromptId, voterId: string): Promise<void> {
    await ensureDatabaseReady();
    await db.insert(votesTable).values({
      id: `${turnId}:${voterId}`,
      turnId,
      promptId,
      voterId,
      createdAt: new Date().toISOString()
    });
  }

  async hasVote(turnId: TurnId, voterId: string): Promise<boolean> {
    await ensureDatabaseReady();
    const [row] = await db
      .select()
      .from(votesTable)
      .where(and(eq(votesTable.turnId, turnId), eq(votesTable.voterId, voterId)));
    return Boolean(row);
  }

  async saveTurn(turn: Turn): Promise<void> {
    await ensureDatabaseReady();
    await db
      .insert(turnsTable)
      .values(this.toTurnRecord(turn))
      .onConflictDoUpdate({
        target: turnsTable.id,
        set: this.toTurnRecord(turn)
      });

    if (turn.status === "open") {
      await db
        .insert(settingsTable)
        .values({
          id: "main",
          automationMode: turn.adjudicationMode,
          currentTurnId: turn.id
        })
        .onConflictDoUpdate({
          target: settingsTable.id,
          set: {
            automationMode: turn.adjudicationMode,
            currentTurnId: turn.id
          }
        });
    }
  }

  async getTurn(turnId: TurnId): Promise<Turn | null> {
    await ensureDatabaseReady();
    const [row] = await db.select().from(turnsTable).where(eq(turnsTable.id, turnId));
    return row ? this.fromTurnRecord(row) : null;
  }

  async getCurrentTurn(): Promise<Turn | null> {
    await ensureDatabaseReady();
    const [settings] = await db.select().from(settingsTable).where(eq(settingsTable.id, "main"));
    if (!settings) {
      return null;
    }
    return this.getTurn(settings.currentTurnId);
  }

  async saveActionScript(actionScript: ActionScript): Promise<void> {
    await ensureDatabaseReady();
    await db
      .insert(actionScriptsTable)
      .values({
        id: actionScript.id,
        promptId: actionScript.promptId,
        summary: actionScript.summary,
        operationsJson: serializeJson(actionScript.operations),
        createdAt: actionScript.createdAt
      })
      .onConflictDoUpdate({
        target: actionScriptsTable.id,
        set: {
          promptId: actionScript.promptId,
          summary: actionScript.summary,
          operationsJson: serializeJson(actionScript.operations),
          createdAt: actionScript.createdAt
        }
      });
  }

  async getActionScript(actionScriptId: string): Promise<ActionScript | null> {
    await ensureDatabaseReady();
    const [row] = await db.select().from(actionScriptsTable).where(eq(actionScriptsTable.id, actionScriptId));
    return row
      ? {
          id: row.id,
          promptId: row.promptId,
          summary: row.summary,
          operations: parseJson(row.operationsJson),
          createdAt: row.createdAt
        }
      : null;
  }

  async saveWorldSnapshot(turnId: TurnId, worldState: WorldState, setCurrent = false): Promise<void> {
    await ensureDatabaseReady();
    if (setCurrent) {
      await db.update(worldSnapshotsTable).set({ isCurrent: false });
    }
    await db
      .insert(worldSnapshotsTable)
      .values({
        turnId,
        snapshotJson: serializeJson(worldState),
        isCurrent: setCurrent
      })
      .onConflictDoUpdate({
        target: worldSnapshotsTable.turnId,
        set: {
          snapshotJson: serializeJson(worldState),
          isCurrent: setCurrent
        }
      });
  }

  async getCurrentWorldState(): Promise<WorldState | null> {
    await ensureDatabaseReady();
    const [row] = await db
      .select()
      .from(worldSnapshotsTable)
      .where(eq(worldSnapshotsTable.isCurrent, true));
    return row ? parseJson<WorldState>(row.snapshotJson) : null;
  }

  async getWorldSnapshot(turnId: TurnId): Promise<WorldState | null> {
    await ensureDatabaseReady();
    const [row] = await db.select().from(worldSnapshotsTable).where(eq(worldSnapshotsTable.turnId, turnId));
    return row ? parseJson<WorldState>(row.snapshotJson) : null;
  }

  async saveLoreEntry(loreEntry: LoreEntry): Promise<void> {
    await ensureDatabaseReady();
    await db
      .insert(loreEntriesTable)
      .values({
        id: loreEntry.id,
        turnId: loreEntry.turnId,
        title: loreEntry.title,
        summary: loreEntry.summary,
        details: loreEntry.details,
        createdAt: loreEntry.createdAt
      })
      .onConflictDoUpdate({
        target: loreEntriesTable.id,
        set: {
          title: loreEntry.title,
          summary: loreEntry.summary,
          details: loreEntry.details,
          createdAt: loreEntry.createdAt
        }
      });
  }

  async getLatestLoreEntry(): Promise<LoreEntry | null> {
    await ensureDatabaseReady();
    const [row] = await db.select().from(loreEntriesTable).orderBy(desc(loreEntriesTable.createdAt)).limit(1);
    return row
      ? {
          id: row.id,
          turnId: row.turnId,
          title: row.title,
          summary: row.summary,
          details: row.details,
          createdAt: row.createdAt
        }
      : null;
  }

  async listHistory(): Promise<HistoryEntry[]> {
    await ensureDatabaseReady();
    const turns = (await db.select().from(turnsTable).orderBy(desc(turnsTable.turnNumber))).map(this.fromTurnRecord);
    const loreRows = await db.select().from(loreEntriesTable);
    const loreByTurnId = new Map(loreRows.map((row) => [row.turnId, row]));

    const result: HistoryEntry[] = [];
    for (const turn of turns) {
      const snapshot = await this.getWorldSnapshot(turn.id);
      if (!snapshot) {
        continue;
      }

      const loreRow = loreByTurnId.get(turn.id);
      const actionScript = turn.actionScriptId ? await this.getActionScript(turn.actionScriptId) : undefined;

      result.push({
        turn,
        loreEntry: loreRow
          ? {
              id: loreRow.id,
              turnId: loreRow.turnId,
              title: loreRow.title,
              summary: loreRow.summary,
              details: loreRow.details,
              createdAt: loreRow.createdAt
            }
          : undefined,
        actionScript: actionScript ?? undefined,
        snapshot
      });
    }

    return result;
  }

  async setAutomationMode(mode: AutomationMode): Promise<void> {
    await ensureDatabaseReady();
    const [settings] = await db.select().from(settingsTable).where(eq(settingsTable.id, "main"));
    if (!settings) {
      throw new Error("Settings are not initialized.");
    }
    await db
      .update(settingsTable)
      .set({ automationMode: mode })
      .where(eq(settingsTable.id, "main"));
  }

  async getAutomationMode(): Promise<AutomationMode> {
    await ensureDatabaseReady();
    const [settings] = await db.select().from(settingsTable).where(eq(settingsTable.id, "main"));
    return (settings?.automationMode ?? "manual_assisted") as AutomationMode;
  }

  private toPromptRecord(prompt: Prompt) {
    return {
      id: prompt.id,
      turnId: prompt.turnId,
      authorId: prompt.authorId,
      text: prompt.text,
      votes: prompt.votes,
      status: prompt.status,
      submittedAt: prompt.submittedAt,
      moderationNotes: prompt.moderationNotes ?? null
    };
  }

  private fromPromptRecord(row: typeof promptsTable.$inferSelect): Prompt {
    return {
      id: row.id,
      turnId: row.turnId,
      authorId: row.authorId,
      text: row.text,
      votes: row.votes,
      status: row.status as Prompt["status"],
      submittedAt: row.submittedAt,
      moderationNotes: row.moderationNotes ?? undefined
    };
  }

  private toTurnRecord(turn: Turn) {
    return {
      id: turn.id,
      turnNumber: turn.turnNumber,
      opensAt: turn.opensAt,
      closesAt: turn.closesAt,
      status: turn.status,
      winningPromptId: turn.winningPromptId ?? null,
      actionScriptId: turn.actionScriptId ?? null,
      adjudicationMode: turn.adjudicationMode,
      summary: turn.summary ?? null,
      closedAt: turn.closedAt ?? null,
      executedAt: turn.executedAt ?? null
    };
  }

  private fromTurnRecord(row: typeof turnsTable.$inferSelect): Turn {
    return {
      id: row.id,
      turnNumber: row.turnNumber,
      opensAt: row.opensAt,
      closesAt: row.closesAt,
      status: row.status as Turn["status"],
      winningPromptId: row.winningPromptId ?? undefined,
      actionScriptId: row.actionScriptId ?? undefined,
      adjudicationMode: row.adjudicationMode as AutomationMode,
      summary: row.summary ?? undefined,
      closedAt: row.closedAt ?? undefined,
      executedAt: row.executedAt ?? undefined
    };
  }
}
