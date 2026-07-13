import type { PaginationAction } from "./types.js";

export const PAGINATION_SIGNAL_NAME = "pagination";

const ACTION_SET = new Set<PaginationAction>(["prev", "next", "dismiss"]);

/** Build a routable custom id: `stambha:pagination:{action}:{sessionId}`. */
export function paginationCustomId(action: PaginationAction, sessionId: string): string {
  return `stambha:${PAGINATION_SIGNAL_NAME}:${action}:${sessionId}`;
}

/** Suffix passed to {@link Signal.customId} / returned by {@link Signal.parseCustomId}. */
export function paginationSuffix(action: PaginationAction, sessionId: string): string {
  return `${action}:${sessionId}`;
}

export function parsePaginationSuffix(
  suffix: string,
): { action: PaginationAction; sessionId: string } | null {
  const sep = suffix.indexOf(":");
  if (sep <= 0) return null;
  const action = suffix.slice(0, sep);
  const sessionId = suffix.slice(sep + 1);
  if (!sessionId || !ACTION_SET.has(action as PaginationAction)) return null;
  return { action: action as PaginationAction, sessionId };
}
