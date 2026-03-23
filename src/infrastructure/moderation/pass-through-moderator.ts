import { PromptModerator } from "@/application/ports";

const blockedWords = ["slur", "doxx", "malware"];

export class PassThroughModerator implements PromptModerator {
  async moderate(promptText: string): Promise<{ accepted: boolean; notes?: string }> {
    const lowered = promptText.toLowerCase();
    const blockedWord = blockedWords.find((word) => lowered.includes(word));

    if (blockedWord) {
      return {
        accepted: false,
        notes: `Blocked because it matched the banned keyword "${blockedWord}".`
      };
    }

    return { accepted: true };
  }
}
