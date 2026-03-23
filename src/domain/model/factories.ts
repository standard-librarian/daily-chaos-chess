import { Artifact, Board, RuleModifier, Turn, WorldEntity, WorldState } from "@/domain/model/types";

const nowIso = () => new Date().toISOString();

export function createInitialBoard(): Board {
  return {
    id: "main-board",
    name: "Main Board",
    width: 8,
    height: 8,
    elevation: 0,
    rotationDeg: 0,
    origin: { x: 0, y: 0, z: 0 },
    theme: "classic"
  };
}

export function createInitialEntities(boardId = "main-board"): WorldEntity[] {
  const pieces: Array<{ kind: WorldEntity["kind"]; side: WorldEntity["side"]; positions: [number, number][] }> = [
    { kind: "rook", side: "white", positions: [[0, 0], [7, 0]] },
    { kind: "knight", side: "white", positions: [[1, 0], [6, 0]] },
    { kind: "bishop", side: "white", positions: [[2, 0], [5, 0]] },
    { kind: "queen", side: "white", positions: [[3, 0]] },
    { kind: "king", side: "white", positions: [[4, 0]] },
    { kind: "pawn", side: "white", positions: Array.from({ length: 8 }, (_, file) => [file, 1] as [number, number]) },
    { kind: "rook", side: "black", positions: [[0, 7], [7, 7]] },
    { kind: "knight", side: "black", positions: [[1, 7], [6, 7]] },
    { kind: "bishop", side: "black", positions: [[2, 7], [5, 7]] },
    { kind: "queen", side: "black", positions: [[3, 7]] },
    { kind: "king", side: "black", positions: [[4, 7]] },
    { kind: "pawn", side: "black", positions: Array.from({ length: 8 }, (_, file) => [file, 6] as [number, number]) }
  ];

  return pieces.flatMap(({ kind, side, positions }) =>
    positions.map(([x, y], index) => ({
      id: `${side}-${kind}-${x}-${y}-${index}`,
      boardId,
      kind,
      label: `${side} ${kind}`,
      side,
      position: { x, y, z: 0.5 },
      status: "active" as const
    }))
  );
}

export function createInitialRules(): RuleModifier[] {
  return [
    {
      id: "canon-rule-1",
      label: "Top Comment Reigns",
      description: "The top voted prompt becomes canon at the daily cutoff."
    }
  ];
}

export function createInitialArtifacts(): Artifact[] {
  return [
    {
      id: "artifact-hourglass",
      label: "The Daily Hourglass",
      boardId: "main-board",
      position: { x: 3.5, y: 3.5, z: 0.1 },
      effect: "Marks the place where time locks the board each day."
    }
  ];
}

export function createInitialWorldState(): WorldState {
  return {
    turnNumber: 1,
    boards: [createInitialBoard()],
    entities: createInitialEntities(),
    artifacts: createInitialArtifacts(),
    rules: createInitialRules()
  };
}

export function createInitialTurn(now = new Date()): Turn {
  const open = new Date(now);
  const close = new Date(now);
  close.setUTCHours(0, 0, 0, 0);
  if (close <= open) {
    close.setUTCDate(close.getUTCDate() + 1);
  }

  return {
    id: "turn-1",
    turnNumber: 1,
    opensAt: open.toISOString(),
    closesAt: close.toISOString(),
    status: "open",
    adjudicationMode: "manual_assisted"
  };
}

export function nextTurnFrom(previousTurn: Turn, now = new Date()): Turn {
  const opensAt = new Date(now);
  const closesAt = new Date(opensAt);
  closesAt.setUTCDate(closesAt.getUTCDate() + 1);

  return {
    id: `turn-${previousTurn.turnNumber + 1}`,
    turnNumber: previousTurn.turnNumber + 1,
    opensAt: opensAt.toISOString(),
    closesAt: closesAt.toISOString(),
    status: "open",
    adjudicationMode: previousTurn.adjudicationMode
  };
}

export function createEmptySummary(text: string): string {
  return text.length > 120 ? `${text.slice(0, 117)}...` : text;
}

export function createNowIso(): string {
  return nowIso();
}
