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

export interface CurrentUser {
  id: string;
  displayName: string;
  isAdmin: boolean;
}

export interface ViewerContext {
  user?: CurrentUser;
}

export interface GameRepository {
  getCurrentWorldView(): Promise<CurrentWorldView | null>;
  bootstrap(worldState: WorldState, turn: Turn, loreEntry?: LoreEntry): Promise<void>;
  savePrompt(prompt: Prompt): Promise<void>;
  listPromptsByTurn(turnId: TurnId): Promise<Prompt[]>;
  getPrompt(promptId: PromptId): Promise<Prompt | null>;
  updatePrompt(prompt: Prompt): Promise<void>;
  saveVote(turnId: TurnId, promptId: PromptId, voterId: string): Promise<void>;
  hasVote(turnId: TurnId, voterId: string): Promise<boolean>;
  saveTurn(turn: Turn): Promise<void>;
  getTurn(turnId: TurnId): Promise<Turn | null>;
  getCurrentTurn(): Promise<Turn | null>;
  saveActionScript(actionScript: ActionScript): Promise<void>;
  getActionScript(actionScriptId: string): Promise<ActionScript | null>;
  saveWorldSnapshot(turnId: TurnId, worldState: WorldState, setCurrent?: boolean): Promise<void>;
  getCurrentWorldState(): Promise<WorldState | null>;
  getWorldSnapshot(turnId: TurnId): Promise<WorldState | null>;
  saveLoreEntry(loreEntry: LoreEntry): Promise<void>;
  getLatestLoreEntry(): Promise<LoreEntry | null>;
  listHistory(): Promise<HistoryEntry[]>;
  setAutomationMode(mode: AutomationMode): Promise<void>;
  getAutomationMode(): Promise<AutomationMode>;
}

export interface PromptModerator {
  moderate(promptText: string): Promise<{ accepted: boolean; notes?: string }>;
}
