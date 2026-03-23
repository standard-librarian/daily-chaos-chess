import { ApplicationError, AuthenticationRequiredError, AuthorizationError, ConflictError, NotFoundError } from "@/application/errors";
import { CurrentUser, GameRepository, PromptModerator } from "@/application/ports";
import { createInitialTurn, createInitialWorldState, createNowIso, nextTurnFrom } from "@/domain/model/factories";
import {
  ActionScript,
  AutomationMode,
  CurrentWorldView,
  HistoryEntry,
  LoreEntry,
  Prompt,
  Turn
} from "@/domain/model/types";
import { applyActionScript } from "@/domain/services/action-script-engine";
import { autoAdjudicatePrompt } from "@/domain/services/auto-adjudicator";
import { rankPrompts } from "@/domain/services/ranking-policy";

function requireUser(user?: CurrentUser): CurrentUser {
  if (!user) {
    throw new AuthenticationRequiredError("You must be signed in to do that.");
  }

  return user;
}

function requireAdmin(user?: CurrentUser): CurrentUser {
  const currentUser = requireUser(user);
  if (!currentUser.isAdmin) {
    throw new AuthorizationError("This action requires admin access.");
  }
  return currentUser;
}

function createPromptId(turnNumber: number, authorId: string): string {
  return `prompt-${turnNumber}-${authorId}-${Date.now()}`;
}

function createLoreEntry(turn: Turn, summary: string, details: string): LoreEntry {
  return {
    id: `lore-${turn.turnNumber}`,
    turnId: turn.id,
    title: `Day ${turn.turnNumber}: chaos became canon`,
    summary,
    details,
    createdAt: createNowIso()
  };
}

export class ChaosChessService {
  constructor(
    private readonly repository: GameRepository,
    private readonly moderator: PromptModerator
  ) {}

  async ensureBootstrapped(): Promise<void> {
    const existing = await this.repository.getCurrentWorldView();
    if (existing) {
      return;
    }

    const worldState = createInitialWorldState();
    const turn = createInitialTurn();
    const loreEntry = createLoreEntry(
      turn,
      "The internet opened the board.",
      "The hourglass was placed at the center and the crowd gained the right to decide what happens next."
    );

    worldState.currentLoreEntryId = loreEntry.id;
    await this.repository.bootstrap(worldState, turn, loreEntry);
  }

  async viewCurrentWorld(): Promise<CurrentWorldView> {
    await this.ensureBootstrapped();
    const view = await this.repository.getCurrentWorldView();
    if (!view) {
      throw new ApplicationError("World bootstrap failed.");
    }

    return {
      ...view,
      promptFeed: rankPrompts(view.promptFeed)
    };
  }

  async submitPrompt(user: CurrentUser | undefined, text: string): Promise<Prompt> {
    await this.ensureBootstrapped();
    const currentUser = requireUser(user);
    const trimmed = text.trim();
    if (!trimmed) {
      throw new ConflictError("Prompt text cannot be empty.");
    }

    const currentTurn = await this.repository.getCurrentTurn();
    if (!currentTurn || currentTurn.status !== "open") {
      throw new ConflictError("Prompt submissions are closed right now.");
    }

    const moderation = await this.moderator.moderate(trimmed);
    const prompt: Prompt = {
      id: createPromptId(currentTurn.turnNumber, currentUser.id),
      turnId: currentTurn.id,
      authorId: currentUser.id,
      text: trimmed,
      votes: 0,
      status: moderation.accepted ? "active" : "rejected",
      moderationNotes: moderation.notes,
      submittedAt: createNowIso()
    };
    await this.repository.savePrompt(prompt);
    return prompt;
  }

  async voteOnPrompt(user: CurrentUser | undefined, promptId: string): Promise<Prompt> {
    await this.ensureBootstrapped();
    const currentUser = requireUser(user);
    const prompt = await this.repository.getPrompt(promptId);
    if (!prompt) {
      throw new NotFoundError("Prompt not found.");
    }

    const currentTurn = await this.repository.getTurn(prompt.turnId);
    if (!currentTurn || currentTurn.status !== "open") {
      throw new ConflictError("Voting is closed for this turn.");
    }

    const hasVote = await this.repository.hasVote(prompt.turnId, currentUser.id);
    if (hasVote) {
      throw new ConflictError("You already voted in this turn.");
    }

    await this.repository.saveVote(prompt.turnId, prompt.id, currentUser.id);
    const updated: Prompt = { ...prompt, votes: prompt.votes + 1 };
    await this.repository.updatePrompt(updated);
    return updated;
  }

  async closeTurn(now = new Date()): Promise<Turn> {
    await this.ensureBootstrapped();
    const currentTurn = await this.repository.getCurrentTurn();
    if (!currentTurn) {
      throw new NotFoundError("No active turn exists.");
    }

    if (currentTurn.status !== "open") {
      return currentTurn;
    }

    if (new Date(currentTurn.closesAt) > now) {
      throw new ConflictError("The daily cutoff has not passed yet.");
    }

    const prompts = await this.repository.listPromptsByTurn(currentTurn.id);
    const ranked = rankPrompts(prompts.filter((prompt) => prompt.status === "active"));
    const winningPrompt = ranked[0];

    const closedTurn: Turn = {
      ...currentTurn,
      status: "closed",
      closedAt: now.toISOString(),
      winningPromptId: winningPrompt?.id
    };
    await this.repository.saveTurn(closedTurn);

    if (winningPrompt) {
      await this.repository.updatePrompt({ ...winningPrompt, status: "winner" });
    }

    return closedTurn;
  }

  async resolveWinner(
    user: CurrentUser | undefined,
    actionScriptInput?: ActionScript
  ): Promise<{ turn: Turn; actionScript: ActionScript }> {
    requireAdmin(user);
    await this.ensureBootstrapped();

    const currentTurn = await this.repository.getCurrentTurn();
    if (!currentTurn || currentTurn.status !== "closed" || !currentTurn.winningPromptId) {
      throw new ConflictError("There is no closed turn ready for resolution.");
    }

    const winningPrompt = await this.repository.getPrompt(currentTurn.winningPromptId);
    if (!winningPrompt) {
      throw new NotFoundError("Winning prompt missing.");
    }

    const worldState = await this.repository.getCurrentWorldState();
    if (!worldState) {
      throw new NotFoundError("Current world state missing.");
    }

    const actionScript =
      actionScriptInput ??
      autoAdjudicatePrompt(
        winningPrompt,
        worldState
      );

    await this.repository.saveActionScript(actionScript);
    const resolvedTurn: Turn = {
      ...currentTurn,
      status: "resolved",
      actionScriptId: actionScript.id,
      summary: actionScript.summary
    };
    await this.repository.saveTurn(resolvedTurn);

    return { turn: resolvedTurn, actionScript };
  }

  async executeTurn(user: CurrentUser | undefined): Promise<Turn> {
    requireAdmin(user);
    await this.ensureBootstrapped();

    const currentTurn = await this.repository.getCurrentTurn();
    if (!currentTurn || currentTurn.status !== "resolved" || !currentTurn.actionScriptId) {
      throw new ConflictError("There is no resolved turn ready to execute.");
    }

    const actionScript = await this.repository.getActionScript(currentTurn.actionScriptId);
    const worldState = await this.repository.getCurrentWorldState();
    if (!actionScript || !worldState) {
      throw new NotFoundError("Execution dependencies are missing.");
    }

    const nextWorldState = applyActionScript(worldState, actionScript);
    const lore = createLoreEntry(currentTurn, actionScript.summary, actionScript.summary);
    nextWorldState.currentLoreEntryId = lore.id;

    const executedTurn: Turn = {
      ...currentTurn,
      status: "executed",
      executedAt: createNowIso()
    };

    await this.repository.saveLoreEntry(lore);
    await this.repository.saveWorldSnapshot(currentTurn.id, nextWorldState, true);
    await this.repository.saveTurn(executedTurn);

    const nextTurn = nextTurnFrom(executedTurn);
    await this.repository.saveTurn(nextTurn);

    return executedTurn;
  }

  async browseHistory(): Promise<HistoryEntry[]> {
    await this.ensureBootstrapped();
    return this.repository.listHistory();
  }

  async moderatePrompt(user: CurrentUser | undefined, promptId: string, accepted: boolean, notes?: string): Promise<Prompt> {
    await this.ensureBootstrapped();
    requireAdmin(user);
    const prompt = await this.repository.getPrompt(promptId);
    if (!prompt) {
      throw new NotFoundError("Prompt not found.");
    }

    const updated: Prompt = {
      ...prompt,
      status: accepted ? "active" : "rejected",
      moderationNotes: notes
    };
    await this.repository.updatePrompt(updated);
    return updated;
  }

  async toggleAutomationMode(user: CurrentUser | undefined, mode: AutomationMode): Promise<AutomationMode> {
    await this.ensureBootstrapped();
    requireAdmin(user);
    await this.repository.setAutomationMode(mode);

    const currentTurn = await this.repository.getCurrentTurn();
    if (currentTurn) {
      await this.repository.saveTurn({ ...currentTurn, adjudicationMode: mode });
    }

    return mode;
  }

  async replayTurnChanges(turnId: string): Promise<HistoryEntry> {
    await this.ensureBootstrapped();
    const history = await this.repository.listHistory();
    const entry = history.find((item) => item.turn.id === turnId);
    if (!entry) {
      throw new NotFoundError("Turn history not found.");
    }
    return entry;
  }

  async runDailyCutoff(systemUser: CurrentUser): Promise<{ closedTurn?: Turn; resolvedTurn?: Turn; executedTurn?: Turn }> {
    await this.ensureBootstrapped();
    const currentTurn = await this.repository.getCurrentTurn();
    if (!currentTurn) {
      throw new NotFoundError("No turn exists.");
    }

    const closedTurn =
      currentTurn.status === "open" ? await this.closeTurn(new Date(currentTurn.closesAt)) : currentTurn;
    if (!closedTurn.winningPromptId) {
      return { closedTurn };
    }

    const mode = await this.repository.getAutomationMode();
    if (mode === "manual_assisted") {
      return { closedTurn };
    }

    const { turn: resolvedTurn } = await this.resolveWinner(systemUser);
    const executedTurn = await this.executeTurn(systemUser);
    return { closedTurn, resolvedTurn, executedTurn };
  }
}
