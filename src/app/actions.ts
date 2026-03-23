"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { CurrentUser } from "@/application/ports";
import { ActionScript } from "@/domain/model/types";
import { ADMIN_COOKIE, USER_COOKIE, getViewerContext } from "@/infrastructure/auth/demo-auth";
import { getChaosChessService } from "@/infrastructure/container";
import { buildActionRedirect } from "@/presentation/action-status";

async function getCurrentUser(): Promise<CurrentUser | undefined> {
  return (await getViewerContext()).user;
}

function safeRevalidate(paths: string[]): void {
  paths.forEach((path) => revalidatePath(path));
}

function getReturnTo(formData: FormData, fallback: string): string {
  const value = String(formData.get("returnTo") ?? fallback);
  return value.startsWith("/") ? value : fallback;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

function redirectTo(url: string): never {
  redirect(url as never);
}

export async function signInAction(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  const admin = String(formData.get("isAdmin") ?? "") === "on";
  const returnTo = getReturnTo(formData, "/");
  if (!name) {
    redirectTo(buildActionRedirect(returnTo, "error", "Display name is required."));
  }

  const cookieStore = await cookies();
  cookieStore.set(USER_COOKIE, name, { path: "/" });
  cookieStore.set(ADMIN_COOKIE, admin ? "true" : "false", { path: "/" });
  redirectTo(buildActionRedirect(returnTo, "success", `Signed in as ${name}.`));
}

export async function signOutAction(formData: FormData): Promise<void> {
  const returnTo = getReturnTo(formData, "/");
  const cookieStore = await cookies();
  cookieStore.delete(USER_COOKIE);
  cookieStore.delete(ADMIN_COOKIE);
  redirectTo(buildActionRedirect(returnTo, "success", "Signed out."));
}

export async function submitPromptAction(formData: FormData): Promise<void> {
  const service = getChaosChessService();
  const returnTo = getReturnTo(formData, "/");
  try {
    await service.submitPrompt(await getCurrentUser(), String(formData.get("text") ?? ""));
    safeRevalidate(["/", "/admin"]);
  } catch (error) {
    redirectTo(buildActionRedirect(returnTo, "error", getErrorMessage(error)));
  }
  redirectTo(buildActionRedirect(returnTo, "success", "Prompt submitted to the canon feed."));
}

export async function voteOnPromptAction(formData: FormData): Promise<void> {
  const service = getChaosChessService();
  const returnTo = getReturnTo(formData, "/");
  try {
    await service.voteOnPrompt(await getCurrentUser(), String(formData.get("promptId") ?? ""));
    safeRevalidate(["/", "/admin"]);
  } catch (error) {
    redirectTo(buildActionRedirect(returnTo, "error", getErrorMessage(error)));
  }
  redirectTo(buildActionRedirect(returnTo, "success", "Vote recorded."));
}

export async function closeTurnAction(formData: FormData): Promise<void> {
  const service = getChaosChessService();
  const returnTo = getReturnTo(formData, "/admin");
  try {
    await service.forceCloseTurn();
    safeRevalidate(["/", "/admin", "/history"]);
  } catch (error) {
    redirectTo(buildActionRedirect(returnTo, "error", getErrorMessage(error)));
  }
  redirectTo(buildActionRedirect(returnTo, "success", "Turn closed and winner locked in."));
}

export async function resolveWinningPromptAction(formData: FormData): Promise<void> {
  const scriptJson = String(formData.get("actionScriptJson") ?? "");
  const returnTo = getReturnTo(formData, "/admin");
  try {
    const parsed = JSON.parse(scriptJson) as ActionScript;
    const service = getChaosChessService();
    await service.resolveWinner(await getCurrentUser(), parsed);
    safeRevalidate(["/", "/admin", "/history"]);
  } catch (error) {
    redirectTo(buildActionRedirect(returnTo, "error", getErrorMessage(error)));
  }
  redirectTo(buildActionRedirect(returnTo, "success", "Action script approved."));
}

export async function executeResolvedTurnAction(formData: FormData): Promise<void> {
  const service = getChaosChessService();
  const returnTo = getReturnTo(formData, "/admin");
  try {
    await service.executeTurn(await getCurrentUser());
    safeRevalidate(["/", "/admin", "/history"]);
  } catch (error) {
    redirectTo(buildActionRedirect(returnTo, "error", getErrorMessage(error)));
  }
  redirectTo(buildActionRedirect(returnTo, "success", "Resolved turn executed."));
}

export async function moderatePromptAction(formData: FormData): Promise<void> {
  const service = getChaosChessService();
  const returnTo = getReturnTo(formData, "/admin");
  try {
    await service.moderatePrompt(
      await getCurrentUser(),
      String(formData.get("promptId") ?? ""),
      String(formData.get("accepted") ?? "false") === "true",
      String(formData.get("notes") ?? "")
    );
    safeRevalidate(["/", "/admin"]);
  } catch (error) {
    redirectTo(buildActionRedirect(returnTo, "error", getErrorMessage(error)));
  }
  redirectTo(buildActionRedirect(returnTo, "success", "Prompt moderation updated."));
}

export async function toggleAutomationModeAction(formData: FormData): Promise<void> {
  const service = getChaosChessService();
  const returnTo = getReturnTo(formData, "/admin");
  try {
    await service.toggleAutomationMode(
      await getCurrentUser(),
      String(formData.get("mode") ?? "manual_assisted") as "manual_assisted" | "auto_execute"
    );
    safeRevalidate(["/", "/admin"]);
  } catch (error) {
    redirectTo(buildActionRedirect(returnTo, "error", getErrorMessage(error)));
  }
  redirectTo(buildActionRedirect(returnTo, "success", "Automation mode updated."));
}
