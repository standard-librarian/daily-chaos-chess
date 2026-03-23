import { describe, expect, it } from "vitest";

import { Prompt } from "@/domain/model/types";
import { rankPrompts } from "@/domain/services/ranking-policy";

describe("rankPrompts", () => {
  it("sorts by votes, then oldest submission, then id", () => {
    const prompts: Prompt[] = [
      {
        id: "b",
        turnId: "turn-1",
        authorId: "user",
        text: "second",
        votes: 3,
        status: "active",
        submittedAt: "2024-01-01T00:00:01.000Z"
      },
      {
        id: "a",
        turnId: "turn-1",
        authorId: "user",
        text: "first",
        votes: 3,
        status: "active",
        submittedAt: "2024-01-01T00:00:00.000Z"
      }
    ];

    expect(rankPrompts(prompts).map((prompt) => prompt.id)).toEqual(["a", "b"]);
  });
});
