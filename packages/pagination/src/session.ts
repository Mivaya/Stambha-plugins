import { randomBytes } from "node:crypto";
import type { PaginationSession } from "./types.js";

const sessions = new Map<string, PaginationSession>();

/** Create a short opaque session id (fits Discord custom_id limits). */
export function createSessionId(): string {
  return randomBytes(6).toString("base64url");
}

export function setSession(id: string, session: PaginationSession): void {
  sessions.set(id, session);
}

export function getSession(id: string): PaginationSession | undefined {
  const session = sessions.get(id);
  if (!session) return undefined;
  if (Date.now() > session.expiresAt) {
    sessions.delete(id);
    return undefined;
  }
  return session;
}

export function deleteSession(id: string): void {
  sessions.delete(id);
}

/** Touch TTL after a successful interaction. */
export function touchSession(id: string): PaginationSession | undefined {
  const session = getSession(id);
  if (!session) return undefined;
  session.expiresAt = Date.now() + session.timeoutMs;
  return session;
}

/** Test helper — clear all sessions. */
export function clearSessions(): void {
  sessions.clear();
}

/** Test helper — current session count (includes unexpired only when read via get). */
export function sessionCount(): number {
  return sessions.size;
}
