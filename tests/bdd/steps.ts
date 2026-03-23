import { After, Before, Given, Then, When, setWorldConstructor } from "@cucumber/cucumber";
import assert from "node:assert/strict";

import { ChaosChessService } from "../../src/application/chaos-chess-service.ts";
import { CurrentUser } from "../../src/application/ports.ts";
import { createInitialTurn, createInitialWorldState, createNowIso } from "../../src/domain/model/factories.ts";
import { ActionScript, CurrentWorldView, HistoryEntry, Prompt, Turn } from "../../src/domain/model/types.ts";
import { InMemoryGameRepository } from "../support/in-memory-game-repository.ts";
import { TestModerator } from "../support/test-moderator.ts";

class ChaosWorld {
  repository = new InMemoryGameRepository();
  service = new ChaosChessService(this.repository, new TestModerator());
  user: CurrentUser = { id: "alice", displayName: "Alice", isAdmin: false };
  admin: CurrentUser = { id: "admin", displayName: "Admin", isAdmin: true };
  lastError: Error | null = null;
  latestView: CurrentWorldView | null = null;
  latestPrompt: Prompt | null = null;
  latestTurn: Turn | null = null;
  latestHistory: HistoryEntry[] = [];
  latestReplay: HistoryEntry | null = null;

  async seedOpenTurn(): Promise<void> {
    await this.repository.bootstrap(createInitialWorldState(), createInitialTurn());
  }
}

setWorldConstructor(ChaosWorld);

Before(async function (this: ChaosWorld) {
  await this.seedOpenTurn();
});

After(function (this: ChaosWorld) {
  this.lastError = null;
});

Given("an active turn", async function (this: ChaosWorld) {
  this.latestView = await this.service.viewCurrentWorld();
  assert.equal(this.latestView.currentTurn.status, "open");
});

Given("a signed-in user", function (this: ChaosWorld) {
  assert.equal(this.user.id, "alice");
});

Given("a submitted prompt", async function (this: ChaosWorld) {
  this.latestPrompt = await this.service.submitPrompt(this.user, "Open a portal behind the king");
});

Given("a wildly chaotic prompt", async function (this: ChaosWorld) {
  this.latestPrompt = await this.service.submitPrompt(
    this.user,
    "Summon three raccoon bishops from the void and let them judge the board"
  );
});

Given("the cutoff has passed", async function (this: ChaosWorld) {
  const currentTurn = await this.repository.getCurrentTurn();
  assert.ok(currentTurn);
  await this.repository.saveTurn({
    ...currentTurn,
    closesAt: "2001-01-01T00:00:00.000Z"
  });
});

Given("the automation mode is enabled", async function (this: ChaosWorld) {
  await this.service.toggleAutomationMode(this.admin, "auto_execute");
});

Given("a closed turn with a winning prompt", async function (this: ChaosWorld) {
  await this.service.submitPrompt(this.user, "Move the white queen toward the center");
  await this.repository.saveTurn({
    ...(await this.repository.getCurrentTurn())!,
    closesAt: "2001-01-01T00:00:00.000Z"
  });
  this.latestTurn = await this.service.closeTurn(new Date("2001-01-01T00:00:00.000Z"));
});

Given("a resolved turn", async function (this: ChaosWorld) {
  await this.service.submitPrompt(this.user, "Summon an echo sigil");
  await this.repository.saveTurn({
    ...(await this.repository.getCurrentTurn())!,
    closesAt: "2001-01-01T00:00:00.000Z"
  });
  await this.service.closeTurn(new Date("2001-01-01T00:00:00.000Z"));
  const winningPrompt = (await this.repository.listPromptsByTurn((await this.repository.getCurrentTurn())!.id)).at(0)!;
  const actionScript: ActionScript = {
    id: "script-test",
    promptId: winningPrompt.id,
    summary: "An echo sigil appeared.",
    createdAt: createNowIso(),
    operations: [
      {
        type: "add_artifact",
        payload: {
          id: "artifact-test",
          label: "Echo Sigil",
          boardId: "main-board",
          position: { x: 4, y: 4, z: 0.1 },
          effect: "A symbol of crowd intent."
        }
      }
    ]
  };
  await this.service.resolveWinner(this.admin, actionScript);
});

When("the visitor views the current world", async function (this: ChaosWorld) {
  this.latestView = await this.service.viewCurrentWorld();
});

When("the user submits a prompt", async function (this: ChaosWorld) {
  this.latestPrompt = await this.service.submitPrompt(this.user, "Flip the board and spare the pawns");
});

When("the user votes for that prompt", async function (this: ChaosWorld) {
  assert.ok(this.latestPrompt);
  this.latestPrompt = await this.service.voteOnPrompt(this.user, this.latestPrompt.id);
});

When("the same user votes for that prompt again", async function (this: ChaosWorld) {
  assert.ok(this.latestPrompt);
  try {
    await this.service.voteOnPrompt(this.user, this.latestPrompt.id);
  } catch (error) {
    this.lastError = error as Error;
  }
});

When("the cutoff job runs", async function (this: ChaosWorld) {
  try {
    this.latestTurn = await this.service.closeTurn(new Date("2001-01-01T00:00:00.000Z"));
  } catch (error) {
    this.lastError = error as Error;
  }
});

When("an admin approves an action script", async function (this: ChaosWorld) {
  const turn = await this.repository.getCurrentTurn();
  assert.ok(turn?.winningPromptId);
  const winningPrompt = await this.repository.getPrompt(turn.winningPromptId);
  assert.ok(winningPrompt);
  await this.service.resolveWinner(this.admin, {
    id: "script-manual",
    promptId: winningPrompt.id,
    summary: "The board accepted the crowd's command.",
    createdAt: createNowIso(),
    operations: [
      {
        type: "move_entity",
        payload: {
          entityId: "white-pawn-4-1-0",
          x: 4,
          y: 3,
          z: 0.5
        }
      }
    ]
  });
  this.latestTurn = await this.repository.getTurn(turn.id);
});

When("the system executes the resolved turn", async function (this: ChaosWorld) {
  this.latestTurn = await this.service.executeTurn(this.admin);
});

When("the visitor browses history", async function (this: ChaosWorld) {
  this.latestHistory = await this.service.browseHistory();
});

When("an admin rejects the prompt", async function (this: ChaosWorld) {
  assert.ok(this.latestPrompt);
  this.latestPrompt = await this.service.moderatePrompt(this.admin, this.latestPrompt.id, false, "Too cursed.");
});

When("an admin switches to auto execute", async function (this: ChaosWorld) {
  await this.service.toggleAutomationMode(this.admin, "auto_execute");
});

When("the visitor replays the executed turn", async function (this: ChaosWorld) {
  const executed = this.latestHistory.find((entry) => entry.turn.status === "executed") ?? this.latestHistory[0];
  this.latestReplay = await this.service.replayTurnChanges(executed.turn.id);
});

When("the automation cutoff job runs", async function (this: ChaosWorld) {
  await this.service.runDailyCutoff(this.admin);
  this.latestHistory = await this.service.browseHistory();
});

Then("the current board, lore, prompt feed, and countdown data are available", function (this: ChaosWorld) {
  assert.ok(this.latestView);
  assert.ok(this.latestView.worldState.boards.length > 0);
  assert.ok(this.latestView.currentTurn.closesAt);
  assert.ok(Array.isArray(this.latestView.promptFeed));
});

Then("the prompt appears in the feed with zero votes", async function (this: ChaosWorld) {
  assert.ok(this.latestPrompt);
  const prompts = await this.repository.listPromptsByTurn(this.latestPrompt.turnId);
  const savedPrompt = prompts.find((prompt: Prompt) => prompt.id === this.latestPrompt?.id);
  assert.equal(savedPrompt?.votes, 0);
});

Then("the vote tally updates", function (this: ChaosWorld) {
  assert.ok(this.latestPrompt);
  assert.equal(this.latestPrompt.votes, 1);
});

Then("duplicate voting is prevented", function (this: ChaosWorld) {
  assert.ok(this.lastError);
  assert.match(this.lastError.message, /already voted/i);
});

Then("the turn is closed and voting is frozen", async function (this: ChaosWorld) {
  assert.ok(this.latestTurn);
  assert.equal(this.latestTurn.status, "closed");
  const prompt = (await this.repository.listPromptsByTurn(this.latestTurn.id))[0];
  if (prompt) {
    try {
      await this.service.voteOnPrompt(this.user, prompt.id);
    } catch (error) {
      this.lastError = error as Error;
    }
    assert.ok(this.lastError);
    assert.match(this.lastError.message, /closed/i);
  }
});

Then("a resolved turn stores the action script", async function (this: ChaosWorld) {
  assert.ok(this.latestTurn?.actionScriptId);
  const script = await this.repository.getActionScript(this.latestTurn.actionScriptId);
  assert.ok(script);
});

Then("a new world snapshot and lore entry are published", async function (this: ChaosWorld) {
  assert.ok(this.latestTurn);
  const history = await this.service.browseHistory();
  assert.ok(history.some((entry) => entry.turn.id === this.latestTurn?.id));
  const latestLore = await this.repository.getLatestLoreEntry();
  assert.ok(latestLore);
});

Then("the visitor can inspect previous turns", function (this: ChaosWorld) {
  assert.ok(this.latestHistory.length > 0);
});

Then("the prompt becomes rejected", function (this: ChaosWorld) {
  assert.equal(this.latestPrompt?.status, "rejected");
});

Then("future turns use auto execute mode", async function (this: ChaosWorld) {
  const mode = await this.repository.getAutomationMode();
  assert.equal(mode, "auto_execute");
});

Then("the winning prompt is resolved and executed automatically", function (this: ChaosWorld) {
  assert.ok(this.latestHistory.some((entry) => entry.turn.status === "executed"));
});

Then("the visitor can inspect the stored replay data", function (this: ChaosWorld) {
  assert.ok(this.latestReplay);
  assert.ok(this.latestReplay.snapshot.entities.length > 0);
});

Then("the latest lore mentions chaos", async function (this: ChaosWorld) {
  const lore = await this.repository.getLatestLoreEntry();
  assert.ok(lore);
  assert.match(lore.summary.toLowerCase(), /chaos|crowd|void|board/);
});
