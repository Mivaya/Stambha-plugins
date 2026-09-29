import { describe, expect, it, vi } from "vitest";
import { OAuthHttpError } from "./discordOAuth.js";
import { OAuthGuildsCache, type OAuthGuildsStore } from "./oauthGuildsCache.js";
import type { OAuthGuild } from "./types.js";

const guild: OAuthGuild = {
  id: "g1",
  name: "Test",
  icon: null,
  owner: true,
  permissions: "0",
};

function session(token = "token-a") {
  return { userId: "user-1", accessToken: token };
}

describe("OAuthGuildsCache", () => {
  it("fetches once per user inside the TTL, including after the access token changes", async () => {
    const fetchGuilds = vi.fn(async () => [guild]);
    let now = 1_000;
    const cache = new OAuthGuildsCache({
      ttlMs: 10_000,
      staleMs: 30_000,
      now: () => now,
      fetchGuilds,
    });

    const first = await cache.get(session("token-a"));
    now += 1_000;
    const second = await cache.get(session("token-b"));

    expect(fetchGuilds).toHaveBeenCalledTimes(1);
    expect(fetchGuilds).toHaveBeenCalledWith("token-a");
    expect(second).toEqual({ guilds: [guild], degraded: false });
    expect(first.guilds).toEqual(second.guilds);
  });

  it("single-flights concurrent loads for the same user", async () => {
    let release: (guilds: OAuthGuild[]) => void = () => undefined;
    let started!: () => void;
    const fetchStarted = new Promise<void>((resolve) => {
      started = resolve;
    });
    const fetchGuilds = vi.fn(
      () =>
        new Promise<OAuthGuild[]>((resolve) => {
          release = resolve;
          started();
        }),
    );
    const cache = new OAuthGuildsCache({ fetchGuilds, now: () => 0 });
    const pending = Promise.all([cache.get(session()), cache.get(session())]);
    await fetchStarted;
    release([guild]);
    const [a, b] = await pending;
    expect(fetchGuilds).toHaveBeenCalledTimes(1);
    expect(a.guilds).toEqual([guild]);
    expect(b.guilds).toEqual([guild]);
  });

  it("returns stale guilds on 429 and does not call Discord again during cooldown", async () => {
    const fetchGuilds = vi
      .fn()
      .mockResolvedValueOnce([guild])
      .mockRejectedValueOnce(new OAuthHttpError("429", 429, 5_000));
    let now = 0;
    const cache = new OAuthGuildsCache({
      ttlMs: 1_000,
      staleMs: 30_000,
      cooldownMs: 90_000,
      now: () => now,
      fetchGuilds,
    });

    await cache.get(session());
    now = 1_000;
    const degraded = await cache.get(session("token-b"));
    expect(degraded).toEqual({ guilds: [guild], degraded: true, retryAfterMs: 5_000 });

    now = 3_000;
    const cooled = await cache.get(session("token-c"));
    expect(cooled.degraded).toBe(true);
    expect(fetchGuilds).toHaveBeenCalledTimes(2);
  });

  it("returns an empty degraded list on 429 when nothing is cached", async () => {
    const cache = new OAuthGuildsCache({
      now: () => 0,
      fetchGuilds: async () => {
        throw new OAuthHttpError("429", 429, null);
      },
      cooldownMs: 90_000,
    });
    await expect(cache.get(session())).resolves.toEqual({
      guilds: [],
      degraded: true,
      retryAfterMs: 90_000,
    });
  });

  it("drops the entry on invalidate", async () => {
    const store: OAuthGuildsStore = {
      get: vi.fn(async () => undefined),
      set: vi.fn(async () => undefined),
      delete: vi.fn(async () => true),
    };
    const cache = new OAuthGuildsCache({
      store,
      now: () => 0,
      fetchGuilds: async () => [guild],
    });
    await cache.get(session());
    await cache.invalidate("user-1");
    expect(store.delete).toHaveBeenCalledWith("stambha:oauth-guilds:user-1");
  });
});
