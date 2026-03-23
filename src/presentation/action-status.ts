export type ActionStatusKind = "success" | "error";

export interface ActionStatus {
  kind: ActionStatusKind;
  message: string;
}

type SearchParamsShape =
  | Record<string, string | string[] | undefined>
  | Promise<Record<string, string | string[] | undefined>>
  | undefined;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function readActionStatus(searchParams: SearchParamsShape): Promise<ActionStatus | undefined> {
  const resolved = searchParams ? await searchParams : undefined;
  const kind = firstValue(resolved?.status);
  const message = firstValue(resolved?.message);

  if ((kind === "success" || kind === "error") && message) {
    return { kind, message };
  }

  return undefined;
}

export function buildActionRedirect(
  returnTo: string | undefined,
  status: ActionStatusKind,
  message: string,
  fallback = "/"
): string {
  const safeReturnTo = returnTo && returnTo.startsWith("/") ? returnTo : fallback;
  const url = new URL(safeReturnTo, "http://localhost");
  url.searchParams.set("status", status);
  url.searchParams.set("message", message);
  return `${url.pathname}${url.search}`;
}
