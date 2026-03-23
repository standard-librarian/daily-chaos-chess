import {
  ActionOperation,
  ActionScript,
  Artifact,
  Board,
  RuleModifier,
  WorldEntity,
  WorldState
} from "@/domain/model/types";

function asBoard(payload: Record<string, unknown>): Board {
  return payload as unknown as Board;
}

function asEntity(payload: Record<string, unknown>): WorldEntity {
  return payload as unknown as WorldEntity;
}

function asArtifact(payload: Record<string, unknown>): Artifact {
  return payload as unknown as Artifact;
}

function asRule(payload: Record<string, unknown>): RuleModifier {
  return payload as unknown as RuleModifier;
}

function applyOperation(worldState: WorldState, operation: ActionOperation): WorldState {
  switch (operation.type) {
    case "move_entity": {
      const entityId = String(operation.payload.entityId);
      const nextX = Number(operation.payload.x);
      const nextY = Number(operation.payload.y);
      const nextZ = Number(operation.payload.z ?? 0.5);

      return {
        ...worldState,
        entities: worldState.entities.map((entity) =>
          entity.id === entityId
            ? { ...entity, position: { x: nextX, y: nextY, z: nextZ } }
            : entity
        )
      };
    }
    case "spawn_entity":
      return { ...worldState, entities: [...worldState.entities, asEntity(operation.payload)] };
    case "add_artifact":
      return { ...worldState, artifacts: [...worldState.artifacts, asArtifact(operation.payload)] };
    case "add_rule":
      return { ...worldState, rules: [...worldState.rules, asRule(operation.payload)] };
    case "add_board":
      return { ...worldState, boards: [...worldState.boards, asBoard(operation.payload)] };
    case "annotate":
    default:
      return worldState;
  }
}

export function applyActionScript(worldState: WorldState, actionScript: ActionScript): WorldState {
  return actionScript.operations.reduce(applyOperation, {
    ...worldState,
    turnNumber: worldState.turnNumber + 1
  });
}
