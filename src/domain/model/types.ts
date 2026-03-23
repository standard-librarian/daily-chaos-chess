export type BoardId = string;
export type EntityId = string;
export type PromptId = string;
export type TurnId = string;
export type LoreEntryId = string;

export type AutomationMode = "manual_assisted" | "auto_execute";
export type TurnStatus = "open" | "closed" | "resolved" | "executed";
export type PromptStatus = "active" | "rejected" | "winner" | "archived";

export type EntityKind =
  | "king"
  | "queen"
  | "rook"
  | "bishop"
  | "knight"
  | "pawn"
  | "artifact"
  | "portal"
  | "marker";

export interface Coordinate {
  x: number;
  y: number;
  z?: number;
}

export interface Board {
  id: BoardId;
  name: string;
  width: number;
  height: number;
  elevation: number;
  rotationDeg: number;
  origin: Coordinate;
  theme: "classic" | "void" | "embers";
}

export interface WorldEntity {
  id: EntityId;
  boardId: BoardId;
  kind: EntityKind;
  label: string;
  side: "white" | "black" | "neutral";
  position: Coordinate;
  status: "active" | "captured" | "spectral";
}

export interface RuleModifier {
  id: string;
  label: string;
  description: string;
  expiresAtTurn?: number;
}

export interface Artifact {
  id: string;
  label: string;
  boardId: BoardId;
  position: Coordinate;
  effect: string;
}

export interface WorldState {
  turnNumber: number;
  boards: Board[];
  entities: WorldEntity[];
  artifacts: Artifact[];
  rules: RuleModifier[];
  currentLoreEntryId?: LoreEntryId;
}

export interface Prompt {
  id: PromptId;
  turnId: TurnId;
  authorId: string;
  text: string;
  votes: number;
  status: PromptStatus;
  submittedAt: string;
  moderationNotes?: string;
}

export interface ActionOperation {
  type: "move_entity" | "spawn_entity" | "add_artifact" | "add_rule" | "add_board" | "annotate";
  payload: Record<string, unknown>;
}

export interface ActionScript {
  id: string;
  promptId: PromptId;
  summary: string;
  operations: ActionOperation[];
  createdAt: string;
}

export interface LoreEntry {
  id: LoreEntryId;
  turnId: TurnId;
  title: string;
  summary: string;
  details: string;
  createdAt: string;
}

export interface Turn {
  id: TurnId;
  turnNumber: number;
  opensAt: string;
  closesAt: string;
  status: TurnStatus;
  winningPromptId?: PromptId;
  actionScriptId?: string;
  adjudicationMode: AutomationMode;
  summary?: string;
  closedAt?: string;
  executedAt?: string;
}

export interface HistoryEntry {
  turn: Turn;
  loreEntry?: LoreEntry;
  actionScript?: ActionScript;
  snapshot: WorldState;
}

export interface CurrentWorldView {
  worldState: WorldState;
  currentTurn: Turn;
  promptFeed: Prompt[];
  latestLore?: LoreEntry;
  automationMode: AutomationMode;
}
