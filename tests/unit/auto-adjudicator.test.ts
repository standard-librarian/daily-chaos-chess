import { describe, expect, it } from "vitest";

import { createInitialWorldState } from "@/domain/model/factories";
import { Prompt } from "@/domain/model/types";
import { autoAdjudicatePrompt } from "@/domain/services/auto-adjudicator";

describe("autoAdjudicatePrompt", () => {
  it("turns a chaotic prompt into a bounded action script with flavor", () => {
    const prompt: Prompt = {
      id: "prompt-raccoon-chaos",
      turnId: "turn-1",
      authorId: "crowd",
      text: "Summon three raccoon bishops from the void and let them judge the board",
      votes: 42,
      status: "winner",
      submittedAt: "2026-03-23T00:00:00.000Z"
    };

    const script = autoAdjudicatePrompt(prompt, createInitialWorldState());

    expect(script.summary).toContain(prompt.text);
    expect(script.operations).toHaveLength(2);
    expect(script.operations[0]?.type).toBe("move_entity");
    expect(script.operations[1]?.type).toBe("add_artifact");
  });
});
