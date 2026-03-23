import { createNowIso } from "@/domain/model/factories";
import { ActionScript, Prompt, WorldState } from "@/domain/model/types";

function hashPrompt(text: string): number {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function autoAdjudicatePrompt(prompt: Prompt, worldState: WorldState): ActionScript {
  const seed = hashPrompt(prompt.text);
  const entity = worldState.entities[seed % worldState.entities.length];
  const nextX = (entity.position.x + ((seed % 3) - 1) + 8) % 8;
  const nextY = (entity.position.y + ((((seed / 3) | 0) % 3) - 1) + 8) % 8;

  return {
    id: `script-${prompt.id}`,
    promptId: prompt.id,
    createdAt: createNowIso(),
    summary: `The board obeyed "${prompt.text}" and bent ${entity.label} toward chaos.`,
    operations: [
      {
        type: "move_entity",
        payload: {
          entityId: entity.id,
          x: nextX,
          y: nextY,
          z: 0.5
        }
      },
      {
        type: "add_artifact",
        payload: {
          id: `artifact-${prompt.id}`,
          label: "Echo Sigil",
          boardId: entity.boardId,
          position: { x: nextX, y: nextY, z: 0.1 },
          effect: `Spawned from the will of the crowd: ${prompt.text}`
        }
      }
    ]
  };
}
