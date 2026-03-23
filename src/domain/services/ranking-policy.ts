import { Prompt } from "@/domain/model/types";

export function rankPrompts(prompts: Prompt[]): Prompt[] {
  return [...prompts].sort((left, right) => {
    if (right.votes !== left.votes) {
      return right.votes - left.votes;
    }

    if (left.submittedAt !== right.submittedAt) {
      return left.submittedAt.localeCompare(right.submittedAt);
    }

    return left.id.localeCompare(right.id);
  });
}
