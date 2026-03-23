import { NextRequest, NextResponse } from "next/server";

import { CurrentUser } from "@/application/ports";
import { USER_COOKIE, ADMIN_COOKIE } from "@/infrastructure/auth/demo-auth";
import { resetChaosChessService, getChaosChessService } from "@/infrastructure/container";
import { resetDatabase } from "@/infrastructure/db/client";

interface SeedPromptInput {
  authorName: string;
  text: string;
  votes?: number;
}

interface ResetPayload {
  viewer?: { name: string; isAdmin?: boolean };
  prompts?: SeedPromptInput[];
  turnState?: "open" | "closed" | "resolved" | "executed";
}

function isE2EModeEnabled() {
  return process.env.E2E_MODE === "1";
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createUser(name: string, isAdmin = false): CurrentUser {
  return {
    id: slugify(name) || "guest",
    displayName: name,
    isAdmin
  };
}

export async function POST(request: NextRequest) {
  if (!isE2EModeEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const payload = ((await request.json().catch(() => ({}))) ?? {}) as ResetPayload;

  resetChaosChessService();
  await resetDatabase();

  const service = getChaosChessService();
  await service.ensureBootstrapped();

  if (payload.prompts?.length) {
    for (const promptInput of payload.prompts) {
      const prompt = await service.submitPrompt(createUser(promptInput.authorName), promptInput.text);

      if (promptInput.votes) {
        for (let index = 0; index < promptInput.votes; index += 1) {
          await service.voteOnPrompt(
            createUser(`${promptInput.authorName}-voter-${index + 1}`),
            prompt.id
          );
        }
      }
    }
  }

  if (payload.turnState && payload.turnState !== "open") {
    await service.forceCloseTurn();

    if (payload.turnState === "resolved" || payload.turnState === "executed") {
      const admin = createUser("E2E Admin", true);
      await service.resolveWinner(admin);

      if (payload.turnState === "executed") {
        await service.executeTurn(admin);
      }
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete(USER_COOKIE);
  response.cookies.delete(ADMIN_COOKIE);

  if (payload.viewer) {
    response.cookies.set(USER_COOKIE, payload.viewer.name, { path: "/" });
    response.cookies.set(ADMIN_COOKIE, payload.viewer.isAdmin ? "true" : "false", { path: "/" });
  }

  return response;
}
