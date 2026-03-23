import { describe, expect, it } from "vitest";

import { ChaosChessService } from "@/application/chaos-chess-service";
import { InMemoryGameRepository } from "@tests/support/in-memory-game-repository";
import { TestModerator } from "@tests/support/test-moderator";

describe("ChaosChessService", () => {
  it("boots with an initial world view", async () => {
    const service = new ChaosChessService(new InMemoryGameRepository(), new TestModerator());
    const view = await service.viewCurrentWorld();

    expect(view.worldState.boards).toHaveLength(1);
    expect(view.currentTurn.status).toBe("open");
    expect(view.latestLore?.summary).toMatch(/internet opened the board/i);
  });

  it("prevents double voting in the same turn", async () => {
    const service = new ChaosChessService(new InMemoryGameRepository(), new TestModerator());
    const user = { id: "alice", displayName: "Alice", isAdmin: false };
    const prompt = await service.submitPrompt(user, "Summon chaos");

    await service.voteOnPrompt(user, prompt.id);

    await expect(service.voteOnPrompt(user, prompt.id)).rejects.toThrow(/already voted/i);
  });
});
