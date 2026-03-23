import { ActionScript, Prompt, WorldState } from "@/domain/model/types";
import { autoAdjudicatePrompt } from "@/domain/services/auto-adjudicator";

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function formatCountdown(closesAt: string): string {
  const diffMs = Math.max(new Date(closesAt).getTime() - Date.now(), 0);
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

export function buildSuggestedActionScript(prompt: Prompt, worldState: WorldState): ActionScript {
  return autoAdjudicatePrompt(prompt, worldState);
}
