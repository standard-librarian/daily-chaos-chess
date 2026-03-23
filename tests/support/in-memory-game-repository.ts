import { GameRepository } from "../../src/application/ports.ts";
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
} from "../../src/domain/model/types.ts";

export class InMemoryGameRepository implements GameRepository {
  private prompts = new Map<PromptId, Prompt>();
  private turns = new Map<TurnId, Turn>();
  private scripts = new Map<string, ActionScript>();
  private snapshots = new Map<TurnId, WorldState>();
  private currentSnapshotTurnId: TurnId | null = null;
  private votes = new Set<string>();
  private loreEntries = new Map<string, LoreEntry>();
  private automationMode: AutomationMode = "manual_assisted";
  private currentTurnId: TurnId | null = null;

  async getCurrentWorldView(): Promise<CurrentWorldView | null> {
    if (!this.currentTurnId || !this.currentSnapshotTurnId) {
      return null;
    }
    const currentTurn = this.turns.get(this.currentTurnId);
    const worldState = this.snapshots.get(this.currentSnapshotTurnId);
    if (!currentTurn || !worldState) {
      return null;
    }

    return {
      worldState,
      currentTurn,
      promptFeed: [...this.prompts.values()].filter((prompt) => prompt.turnId === currentTurn.id),
      latestLore: [...this.loreEntries.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0],
      automationMode: this.automationMode
    };
  }

  async bootstrap(worldState: WorldState, turn: Turn, loreEntry?: LoreEntry): Promise<void> {
    this.turns.set(turn.id, turn);
    this.currentTurnId = turn.id;
    this.snapshots.set(turn.id, worldState);
    this.currentSnapshotTurnId = turn.id;
    this.automationMode = turn.adjudicationMode;
    if (loreEntry) {
      this.loreEntries.set(loreEntry.id, loreEntry);
    }
  }

  async savePrompt(prompt: Prompt): Promise<void> {
    this.prompts.set(prompt.id, prompt);
  }

  async listPromptsByTurn(turnId: TurnId): Promise<Prompt[]> {
    return [...this.prompts.values()].filter((prompt) => prompt.turnId === turnId);
  }

  async getPrompt(promptId: PromptId): Promise<Prompt | null> {
    return this.prompts.get(promptId) ?? null;
  }

  async updatePrompt(prompt: Prompt): Promise<void> {
    this.prompts.set(prompt.id, prompt);
  }

  async saveVote(turnId: TurnId, promptId: PromptId, voterId: string): Promise<void> {
    this.votes.add(`${turnId}:${voterId}:${promptId}`);
  }

  async hasVote(turnId: TurnId, voterId: string): Promise<boolean> {
    return [...this.votes].some((vote) => vote.startsWith(`${turnId}:${voterId}:`));
  }

  async saveTurn(turn: Turn): Promise<void> {
    this.turns.set(turn.id, turn);
    if (turn.status === "open") {
      this.currentTurnId = turn.id;
      this.automationMode = turn.adjudicationMode;
    }
  }

  async getTurn(turnId: TurnId): Promise<Turn | null> {
    return this.turns.get(turnId) ?? null;
  }

  async getCurrentTurn(): Promise<Turn | null> {
    return this.currentTurnId ? (this.turns.get(this.currentTurnId) ?? null) : null;
  }

  async saveActionScript(actionScript: ActionScript): Promise<void> {
    this.scripts.set(actionScript.id, actionScript);
  }

  async getActionScript(actionScriptId: string): Promise<ActionScript | null> {
    return this.scripts.get(actionScriptId) ?? null;
  }

  async saveWorldSnapshot(turnId: TurnId, worldState: WorldState, setCurrent = false): Promise<void> {
    this.snapshots.set(turnId, worldState);
    if (setCurrent) {
      this.currentSnapshotTurnId = turnId;
    }
  }

  async getCurrentWorldState(): Promise<WorldState | null> {
    return this.currentSnapshotTurnId ? (this.snapshots.get(this.currentSnapshotTurnId) ?? null) : null;
  }

  async getWorldSnapshot(turnId: TurnId): Promise<WorldState | null> {
    return this.snapshots.get(turnId) ?? null;
  }

  async saveLoreEntry(loreEntry: LoreEntry): Promise<void> {
    this.loreEntries.set(loreEntry.id, loreEntry);
  }

  async getLatestLoreEntry(): Promise<LoreEntry | null> {
    return [...this.loreEntries.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
  }

  async listHistory(): Promise<HistoryEntry[]> {
    const entries = [...this.snapshots.entries()]
      .map<HistoryEntry | null>(([turnId, snapshot]) => {
        const turn = this.turns.get(turnId);
        if (!turn) {
          return null;
        }

        const loreEntry = [...this.loreEntries.values()].find((entry) => entry.turnId === turnId);
        const actionScript = turn.actionScriptId ? this.scripts.get(turn.actionScriptId) : undefined;
        return {
          turn,
          loreEntry,
          actionScript,
          snapshot
        } satisfies HistoryEntry;
      })
      .filter((entry): entry is HistoryEntry => entry !== null);

    return entries.sort((a, b) => b.turn.turnNumber - a.turn.turnNumber);
  }

  async setAutomationMode(mode: AutomationMode): Promise<void> {
    this.automationMode = mode;
  }

  async getAutomationMode(): Promise<AutomationMode> {
    return this.automationMode;
  }
}
