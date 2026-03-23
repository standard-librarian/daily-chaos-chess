import { After, AfterAll, Before, BeforeAll, Given, Then, When, setDefaultTimeout, setWorldConstructor } from "@cucumber/cucumber";
import { mkdir } from "node:fs/promises";
import path from "node:path";

import { Browser, BrowserContext, Page, chromium, expect } from "@playwright/test";

setDefaultTimeout(120_000);

interface ResetPayload {
  viewer?: { name: string; isAdmin?: boolean };
  prompts?: Array<{ authorName: string; text: string; votes?: number }>;
  turnState?: "open" | "closed" | "resolved" | "executed";
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

class BrowserWorld {
  static browser: Browser;
  context!: BrowserContext;
  page!: Page;
  readonly baseURL = process.env.BASE_URL ?? "http://127.0.0.1:3100";
  readonly consoleErrors: string[] = [];
  readonly pageErrors: string[] = [];

  async resetWorld(payload: ResetPayload = {}): Promise<void> {
    await this.context.clearCookies();
    const response = await this.page.request.post(`${this.baseURL}/api/test/reset`, {
      data: payload
    });
    expect(response.ok()).toBeTruthy();

    if (payload.viewer) {
      const url = new URL(this.baseURL);
      await this.context.addCookies([
        {
          name: "chaos_user",
          value: payload.viewer.name,
          domain: url.hostname,
          path: "/"
        },
        {
          name: "chaos_admin",
          value: payload.viewer.isAdmin ? "true" : "false",
          domain: url.hostname,
          path: "/"
        }
      ]);
    }
  }

  async waitForBoardReady(): Promise<void> {
    await expect(this.page.getByTestId("board-stage")).toBeVisible();
    await expect(this.page.locator("canvas")).toHaveCount(1);
    await expect(this.page.getByTestId("board-stage")).toHaveAttribute("data-scene-ready", "true");
    expect(this.consoleErrors, this.consoleErrors.join("\n")).toEqual([]);
    expect(this.pageErrors, this.pageErrors.join("\n")).toEqual([]);
  }

  async waitForStatus(message: string): Promise<void> {
    await expect(this.page.getByTestId("status-banner")).toContainText(message);
  }

  promptCard(text: string) {
    return this.page.getByTestId("prompt-card").filter({ hasText: text }).first();
  }

  async clickAndSettle(action: () => Promise<void>): Promise<void> {
    await action();
    await this.page.waitForLoadState("networkidle");
  }
}

setWorldConstructor(BrowserWorld);

BeforeAll(async function () {
  BrowserWorld.browser = await chromium.launch({
    headless: process.env.PLAYWRIGHT_HEADLESS === "1"
  });
});

AfterAll(async function () {
  await BrowserWorld.browser.close();
});

Before(async function (this: BrowserWorld) {
  this.context = await BrowserWorld.browser.newContext({
    viewport: { width: 1440, height: 1100 }
  });
  this.page = await this.context.newPage();
  this.page.on("console", (message) => {
    if (message.type() === "error") {
      this.consoleErrors.push(message.text());
    }
  });
  this.page.on("pageerror", (error) => {
    this.pageErrors.push(error.message);
  });
});

After(async function (this: BrowserWorld, { pickle, result }) {
  if (result?.status !== "PASSED") {
    const outputDir = path.join(process.cwd(), "test-results/bdd-ui");
    await mkdir(outputDir, { recursive: true });
    await this.page.screenshot({
      path: path.join(outputDir, `${slugify(pickle.name)}.png`),
      fullPage: true
    });
  }

  await this.context.close();
});

Given("the UI world is reset", async function (this: BrowserWorld) {
  await this.resetWorld();
});

Given("the UI world is reset with an executed turn", async function (this: BrowserWorld) {
  await this.resetWorld({
    prompts: [{ authorName: "Archivist", text: "Move the white queen to the center", votes: 2 }],
    turnState: "executed"
  });
});

When("the visitor opens the board page", async function (this: BrowserWorld) {
  await this.page.goto(this.baseURL, { waitUntil: "domcontentloaded" });
});

When("the visitor signs in as {string}", async function (this: BrowserWorld, name: string) {
  await this.page.getByTestId("auth-name-input").fill(name);
  await this.clickAndSettle(() => this.page.getByTestId("auth-submit").click());
});

When("the visitor signs in as admin {string}", async function (this: BrowserWorld, name: string) {
  await this.page.getByTestId("auth-name-input").fill(name);
  await this.page.getByTestId("auth-admin-checkbox").check();
  await this.clickAndSettle(() => this.page.getByTestId("auth-submit").click());
});

When("the user submits the prompt {string}", async function (this: BrowserWorld, text: string) {
  await this.page.getByTestId("prompt-textarea").fill(text);
  await this.clickAndSettle(() => this.page.getByTestId("prompt-submit").click());
});

When("the user submits an empty prompt", async function (this: BrowserWorld) {
  await this.page.getByTestId("prompt-textarea").fill("");
  await this.clickAndSettle(() => this.page.getByTestId("prompt-submit").click());
});

When("the user signs out", async function (this: BrowserWorld) {
  await this.clickAndSettle(() => this.page.getByRole("button", { name: /sign out/i }).click());
});

When("a second visitor named {string} signs in and votes for {string}", async function (this: BrowserWorld, name: string, text: string) {
  await this.clickAndSettle(() => this.page.getByRole("button", { name: /sign out/i }).click());
  await this.page.getByTestId("auth-name-input").fill(name);
  await this.clickAndSettle(() => this.page.getByTestId("auth-submit").click());
  await this.clickAndSettle(() => this.promptCard(text).getByRole("button", { name: /vote/i }).click());
});

When("the same visitor votes for {string} again", async function (this: BrowserWorld, text: string) {
  await this.clickAndSettle(() => this.promptCard(text).getByRole("button", { name: /vote/i }).click());
});

When("the visitor navigates to the history page", async function (this: BrowserWorld) {
  await Promise.all([
    this.page.waitForURL(/\/history/),
    this.page.getByRole("link", { name: /^history$/i }).click()
  ]);
  await this.page.waitForLoadState("networkidle");
});

When("the visitor navigates to the admin page", async function (this: BrowserWorld) {
  await Promise.all([
    this.page.waitForURL(/\/admin/),
    this.page.getByRole("link", { name: /^admin$/i }).click()
  ]);
  await this.page.waitForLoadState("networkidle");
});

When("the visitor returns to the board page", async function (this: BrowserWorld) {
  await Promise.all([
    this.page.waitForURL((url) => url.pathname === "/"),
    this.page.getByRole("link", { name: /^board$/i }).click()
  ]);
  await this.page.waitForLoadState("networkidle");
});

When("the admin force closes the current turn", async function (this: BrowserWorld) {
  await this.clickAndSettle(() => this.page.getByTestId("admin-close-turn").click());
});

When("the admin approves the suggested action script", async function (this: BrowserWorld) {
  await this.clickAndSettle(() => this.page.getByTestId("admin-approve-script").click());
});

When("the admin executes the resolved turn", async function (this: BrowserWorld) {
  await this.clickAndSettle(() => this.page.getByTestId("admin-execute-turn").click());
});

When("the admin toggles the automation mode", async function (this: BrowserWorld) {
  await this.clickAndSettle(() => this.page.getByTestId("admin-toggle-automation").click());
});

Then("the live board stage is ready", async function (this: BrowserWorld) {
  await this.waitForBoardReady();
});

Then("the hero copy and prompt teaser are visible", async function (this: BrowserWorld) {
  await expect(this.page.getByRole("heading", { name: /the crowd writes the next move/i })).toBeVisible();
  await expect(this.page.getByTestId("prompt-feed-teaser")).toBeVisible();
});

Then("the signed in state for {string} is visible", async function (this: BrowserWorld, name: string) {
  await this.waitForStatus(`Signed in as ${name}.`);
  await expect(this.page.getByTestId("viewer-name")).toHaveText(name);
});

Then("the anonymous sign-in form is visible again", async function (this: BrowserWorld) {
  await expect(this.page.getByTestId("auth-form")).toBeVisible();
});

Then("the status banner says {string}", async function (this: BrowserWorld, message: string) {
  await this.waitForStatus(message);
});

Then("the prompt {string} appears with {int} votes", async function (this: BrowserWorld, text: string, votes: number) {
  const card = this.promptCard(text);
  await expect(card).toBeVisible();
  await expect(card).toContainText(`${votes} votes`);
});

Then("the history cards are visible", async function (this: BrowserWorld) {
  await expect(this.page.getByTestId("history-card").first()).toBeVisible();
});

Then("the latest history includes an executed turn", async function (this: BrowserWorld) {
  await expect(this.page.getByTestId("history-card").first()).toContainText(/executed/i);
});

Then("the admin controls are visible", async function (this: BrowserWorld) {
  await expect(this.page.getByTestId("admin-close-turn")).toBeVisible();
  await expect(this.page.getByTestId("admin-execute-turn")).toBeVisible();
});

Then("the admin sees the winning prompt for {string}", async function (this: BrowserWorld, text: string) {
  await expect(this.page.getByTestId("admin-winning-prompt")).toContainText(text);
});

Then("the automation mode reflects {string}", async function (this: BrowserWorld, mode: string) {
  await expect(this.page.getByTestId("admin-automation-mode")).toContainText(mode);
});

Then("the board feed advances to day {int}", async function (this: BrowserWorld, day: number) {
  await expect(this.page.getByTestId("prompt-feed-title")).toContainText(`Day ${day}`);
});
