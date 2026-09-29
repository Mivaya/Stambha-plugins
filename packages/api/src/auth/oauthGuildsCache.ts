import { fetchOAuthGuilds, OAuthHttpError } from "./discordOAuth.js";
import type { ApiSession, OAuthGuild } from "./types.js";

/** Default fresh window. Repeat dashboard loads serve this without hitting Discord. */
export const DEFAULT_OAUTH_GUILDS_TTL_MS = 10 * 60 * 1000;
/** How long a successful fetch may still be served after Discord errors. */
export const DEFAULT_OAUTH_GUILDS_STALE_MS = 30 * 60 * 1000;
/** Fallback backoff when Discord returns 429 without `Retry-After`. */
export const DEFAULT_OAUTH_GUILDS_COOLDOWN_MS = 90 * 1000;

const KEY_PREFIX = "stambha:oauth-guilds:";

export interface OAuthGuildsSnapshot {
  guilds: readonly OAuthGuild[];
  fetchedAt: number;
}

/**
 * Pluggable guild-list store. Matches the `@stambha/cache` `Cache` shape
 * (`get` / `set` / `delete`) so a Redis driver can be passed without a hard dependency.
 * `ttlMs` on `set` is the stale window — the cache decides fresh vs degraded.
 */
export interface OAuthGuildsStore {
  get(key: string): Promise<OAuthGuildsSnapshot | undefined>;
  set(key: string, value: OAuthGuildsSnapshot, ttlMs?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
}

export interface OAuthGuildsResult {
  guilds: OAuthGuild[];
  /** True when the list is stale, empty because Discord was unavailable, or still cooling down. */
  degraded: boolean;
  /** Present when a 429 (or its cooldown) is why this result was not a fresh fetch. */
  retryAfterMs?: number;
}

export interface OAuthGuildsCacheOptions {
  /** Fresh TTL (default 10 minutes). */
  ttlMs?: number;
  /** Serve this snapshot after errors until it is older than this (default 30 minutes). */
  staleMs?: number;
  /** Cooldown after 429 when `Retry-After` is missing (default 90 seconds). */
  cooldownMs?: number;
  /** Shared store. Default is process-local memory. */
  store?: OAuthGuildsStore;
  now?: () => number;
  fetchGuilds?: (accessToken: string) => Promise<OAuthGuild[]>;
}

export class MemoryOAuthGuildsStore implements OAuthGuildsStore {
  readonly #entries = new Map<string, OAuthGuildsSnapshot>();

  async get(key: string): Promise<OAuthGuildsSnapshot | undefined> {
    return this.#entries.get(key);
  }

  async set(key: string, value: OAuthGuildsSnapshot): Promise<void> {
    this.#entries.set(key, value);
  }

  async delete(key: string): Promise<boolean> {
    return this.#entries.delete(key);
  }
}

/**
 * Cached `GET /users/@me/guilds` for dashboard sessions.
 *
 * Keyed by Discord user id (not the access token) so token refresh keeps the entry.
 * Concurrent callers for the same user share one Discord request.
 * Errors never throw: last good data is returned as `degraded`, or an empty list when nothing is cached.
 */
export class OAuthGuildsCache {
  readonly #ttlMs: number;
  readonly #staleMs: number;
  readonly #cooldownMs: number;
  readonly #store: OAuthGuildsStore;
  readonly #now: () => number;
  readonly #fetchGuilds: (accessToken: string) => Promise<OAuthGuild[]>;
  readonly #inflight = new Map<string, Promise<OAuthGuildsResult>>();
  readonly #cooldownUntil = new Map<string, number>();

  constructor(options: OAuthGuildsCacheOptions = {}) {
    this.#ttlMs = options.ttlMs ?? DEFAULT_OAUTH_GUILDS_TTL_MS;
    this.#staleMs = Math.max(this.#ttlMs, options.staleMs ?? DEFAULT_OAUTH_GUILDS_STALE_MS);
    this.#cooldownMs = options.cooldownMs ?? DEFAULT_OAUTH_GUILDS_COOLDOWN_MS;
    this.#store = options.store ?? new MemoryOAuthGuildsStore();
    this.#now = options.now ?? Date.now;
    this.#fetchGuilds = options.fetchGuilds ?? ((token) => fetchOAuthGuilds(token));
  }

  async get(session: Pick<ApiSession, "userId" | "accessToken">): Promise<OAuthGuildsResult> {
    const pending = this.#inflight.get(session.userId);
    if (pending) return pending;

    const run = this.#load(session).finally(() => {
      if (this.#inflight.get(session.userId) === run) {
        this.#inflight.delete(session.userId);
      }
    });
    this.#inflight.set(session.userId, run);
    return run;
  }

  async invalidate(userId: string): Promise<void> {
    this.#cooldownUntil.delete(userId);
    await this.#store.delete(cacheKey(userId));
  }

  async #load(session: Pick<ApiSession, "userId" | "accessToken">): Promise<OAuthGuildsResult> {
    const now = this.#now();
    const cached = await this.#store.get(cacheKey(session.userId));
    if (cached && now - cached.fetchedAt < this.#ttlMs) {
      return { guilds: [...cached.guilds], degraded: false };
    }

    const cooldownUntil = this.#cooldownUntil.get(session.userId) ?? 0;
    if (cooldownUntil > now) {
      return staleOrEmpty(cached, now, this.#staleMs, cooldownUntil - now);
    }

    try {
      const guilds = await this.#fetchGuilds(session.accessToken);
      await this.#store.set(cacheKey(session.userId), { guilds, fetchedAt: now }, this.#staleMs);
      this.#cooldownUntil.delete(session.userId);
      return { guilds: [...guilds], degraded: false };
    } catch (error) {
      const retryAfterMs =
        error instanceof OAuthHttpError && error.status === 429
          ? (error.retryAfterMs ?? this.#cooldownMs)
          : undefined;
      if (retryAfterMs !== undefined) {
        this.#cooldownUntil.set(session.userId, now + retryAfterMs);
      }
      return staleOrEmpty(cached, now, this.#staleMs, retryAfterMs);
    }
  }
}

function cacheKey(userId: string): string {
  return `${KEY_PREFIX}${userId}`;
}

function staleOrEmpty(
  cached: OAuthGuildsSnapshot | undefined,
  now: number,
  staleMs: number,
  retryAfterMs: number | undefined,
): OAuthGuildsResult {
  const retry = retryAfterMs !== undefined ? { retryAfterMs } : {};
  if (cached && now - cached.fetchedAt < staleMs) {
    return { guilds: [...cached.guilds], degraded: true, ...retry };
  }
  return { guilds: [], degraded: true, ...retry };
}
