import { PromptModerator } from "../../src/application/ports.ts";

export class TestModerator implements PromptModerator {
  async moderate(promptText: string): Promise<{ accepted: boolean; notes?: string }> {
    if (promptText.toLowerCase().includes("ban me")) {
      return { accepted: false, notes: "Blocked by test moderator." };
    }

    return { accepted: true };
  }
}
