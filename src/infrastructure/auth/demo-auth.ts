import { cookies } from "next/headers";

import { CurrentUser, ViewerContext } from "@/application/ports";

export const USER_COOKIE = "chaos_user";
export const ADMIN_COOKIE = "chaos_admin";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function getViewerContext(): Promise<ViewerContext> {
  const cookieStore = await cookies();
  const displayName = cookieStore.get(USER_COOKIE)?.value;
  if (!displayName) {
    return {};
  }

  const user: CurrentUser = {
    id: slugify(displayName) || "guest",
    displayName,
    isAdmin: cookieStore.get(ADMIN_COOKIE)?.value === "true"
  };

  return { user };
}

export function createSystemAdmin(): CurrentUser {
  return {
    id: "system-admin",
    displayName: "System Admin",
    isAdmin: true
  };
}
