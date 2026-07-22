import { describe, expect, it, vi } from "vitest";
import { createRedisCache } from "./RedisCache.js";
import type { RedisCacheClient } from "./types.js";

interface Entry {
  value: string;
  expiresAt: number | null;
}

/** In-memory fake implementing {@link RedisCacheClient}. */
function createFakeRedis(): RedisCacheClient & { store: Map<string, Entry> } {
  const store = new Map<string, Entry>();

  return {
    store,
    async get(key) {
      const entry = store.get(key);
      if (!entry) return null;
      if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
        store.delete(key);
        return null;
      }
      return entry.value;
    },
    async set(key, value, options) {
      const px = options?.PX;
      store.set(key, {
        value,
        expiresAt: px !== undefined ? Date.now() + px : null,
      });
      return "OK";
    },
    async del(key) {
      const keys = Array.isArray(key) ? key : [key];
      let n = 0;
      for (const k of keys) {
        if (store.delete(k)) n += 1;
      }
      return n;
    },
    async *scanIterator(options) {
      const pattern = options.MATCH;
      const prefix = pattern.endsWith("*") ? pattern.slice(0, -1) : pattern;
      for (const key of [...store.keys()]) {
        if (key.startsWith(prefix)) yield key;
      }
    },
  };
}

describe("@stambha/cache-redis", () => {
  it("stores and retrieves JSON values", async () => {
    const client = createFakeRedis();
    const cache = createRedisCache<{ name: string }>({ client });
    await cache.set("guild:1", { name: "Test" });
    expect(await cache.get("guild:1")).toEqual({ name: "Test" });
    expect(await cache.has("guild:1")).toBe(true);
    expect(client.store.has("stambha:cache:guild:1")).toBe(true);
  });

  it("uses a custom key prefix", async () => {
    const client = createFakeRedis();
    const cache = createRedisCache({ client, keyPrefix: "bot:a:" });
    await cache.set("k", 1);
    expect(client.store.has("bot:a:k")).toBe(true);
    expect(await cache.get("k")).toBe(1);
  });

  it("expires entries by ttlMs", async () => {
    vi.useFakeTimers();
    const client = createFakeRedis();
    const cache = createRedisCache<number>({ client });
    await cache.set("k", 42, 1000);
    vi.advanceTimersByTime(1001);
    expect(await cache.get("k")).toBeUndefined();
    vi.useRealTimers();
  });

  it("applies defaultTtlMs when set omits ttl", async () => {
    vi.useFakeTimers();
    const client = createFakeRedis();
    const cache = createRedisCache({ client, defaultTtlMs: 500 });
    await cache.set("k", "v");
    vi.advanceTimersByTime(501);
    expect(await cache.get("k")).toBeUndefined();
    vi.useRealTimers();
  });

  it("delete returns whether the key existed", async () => {
    const client = createFakeRedis();
    const cache = createRedisCache({ client });
    await cache.set("a", 1);
    expect(await cache.delete("a")).toBe(true);
    expect(await cache.delete("a")).toBe(false);
    expect(await cache.get("a")).toBeUndefined();
  });

  it("clear only removes keys under the prefix", async () => {
    const client = createFakeRedis();
    client.store.set("other:x", { value: '"keep"', expiresAt: null });
    const cache = createRedisCache({ client, keyPrefix: "stambha:cache:" });
    await cache.set("a", 1);
    await cache.set("b", 2);
    await cache.clear();
    expect(await cache.get("a")).toBeUndefined();
    expect(await cache.get("b")).toBeUndefined();
    expect(client.store.has("other:x")).toBe(true);
  });

  it("returns undefined for corrupt JSON", async () => {
    const client = createFakeRedis();
    client.store.set("stambha:cache:bad", { value: "not-json{", expiresAt: null });
    const cache = createRedisCache({ client });
    expect(await cache.get("bad")).toBeUndefined();
  });
});
