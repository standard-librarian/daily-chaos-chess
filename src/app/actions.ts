"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { CurrentUser } from "@/application/ports";
import { ActionScript } from "@/domain/model/types";
import { ADMIN_COOKIE, USER_COOKIE, getViewerContext } from "@/infrastructure/auth/demo-auth";
import { getChaosChessService } from "@/infrastructure/container";

async function getCurrentUser(): Promise<CurrentUser | undefined> {
  return (await getViewerContext()).user;
}

function safeRevalidate(paths: string[]): void {
  paths.forEach((path) => revalidatePath(path));
}

export async function signInAction(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  const admin = String(formData.get("isAdmin") ?? "") === "on";
  if (!name) {
    return;
  }

  const cookieStore = await cookies();
  cookieStore.set(USER_COOKIE, name, { path: "/" });
  cookieStore.set(ADMIN_COOKIE, admin ? "true" : "false", { path: "/" });
  redirect("/");
}

export async function signOutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(USER_COOKIE);
  cookieStore.delete(ADMIN_COOKIE);
  redirect("/");
}

export async function submitPromptAction(formData: FormData): Promise<void> {
  const service = getChaosChessService();
  await service.submitPrompt(await getCurrentUser(), String(formData.get("text") ?? ""));
  safeRevalidate(["/", "/admin"]);
}

export async function voteOnPromptAction(formData: FormData): Promise<void> {
  const service = getChaosChessService();
  await service.voteOnPrompt(await getCurrentUser(), String(formData.get("promptId") ?? ""));
  safeRevalidate(["/", "/admin"]);
}

export async function closeTurnAction(): Promise<void> {
  const service = getChaosChessService();
  await service.closeTurn(new Date());
  safeRevalidate(["/", "/admin", "/history"]);
}

export async function resolveWinningPromptAction(formData: FormData): Promise<void> {
  const scriptJson = String(formData.get("actionScriptJson") ?? "");
  const parsed = JSON.parse(scriptJson) as ActionScript;
  const service = getChaosChessService();
  await service.resolveWinner(await getCurrentUser(), parsed);
  safeRevalidate(["/", "/admin", "/history"]);
}

export async function executeResolvedTurnAction(): Promise<void> {
  const service = getChaosChessService();
  await service.executeTurn(await getCurrentUser());
  safeRevalidate(["/", "/admin", "/history"]);
}

export async function moderatePromptAction(formData: FormData): Promise<void> {
  const service = getChaosChessService();
  await service.moderatePrompt(
    await getCurrentUser(),
    String(formData.get("promptId") ?? ""),
    String(formData.get("accepted") ?? "false") === "true",
    String(formData.get("notes") ?? "")
  );
  safeRevalidate(["/", "/admin"]);
}

export async function toggleAutomationModeAction(formData: FormData): Promise<void> {
  const service = getChaosChessService();
  await service.toggleAutomationMode(
    await getCurrentUser(),
    String(formData.get("mode") ?? "manual_assisted") as "manual_assisted" | "auto_execute"
  );
  safeRevalidate(["/", "/admin"]);
}
