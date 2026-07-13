import { randomBytes } from "node:crypto";
import type { ApiSession, OAuthPendingState, OAuthStateStore, SessionStore } from "./types.js";

export class MemorySessionStore implements SessionStore {
  readonly #sessions = new Map<string, ApiSession>();

  async get(id: string): Promise<ApiSession | null> {
    return this.#sessions.get(id) ?? null;
  }

  async set(session: ApiSession): Promise<void> {
    this.#sessions.set(session.id, session);
  }

  async delete(id: string): Promise<void> {
    this.#sessions.delete(id);
  }

  clear(): void {
    this.#sessions.clear();
  }

  get size(): number {
    return this.#sessions.size;
  }
}

export class MemoryOAuthStateStore implements OAuthStateStore {
  readonly #states = new Map<string, OAuthPendingState>();

  async put(entry: OAuthPendingState): Promise<void> {
    this.#prune();
    this.#states.set(entry.state, entry);
  }

  async take(state: string): Promise<OAuthPendingState | null> {
    this.#prune();
    const entry = this.#states.get(state) ?? null;
    if (entry) this.#states.delete(state);
    return entry;
  }

  #prune(): void {
    const now = Date.now();
    for (const [key, value] of this.#states) {
      if (value.expiresAt <= now) this.#states.delete(key);
    }
  }
}

export function createSessionId(): string {
  return randomBytes(24).toString("base64url");
}

export function createCsrfToken(): string {
  return randomBytes(24).toString("base64url");
}

export function createOAuthState(): string {
  return randomBytes(16).toString("base64url");
}
