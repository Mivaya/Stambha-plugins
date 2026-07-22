import { describe, expect, it } from "vitest";
import { CONSUME_SCRIPT, createRedisCooldownStore } from "./RedisCooldownStore.js";
import type { RedisCooldownClient } from "./RedisCooldownStore.js";

interface ZEntry {
  member: string;
  score: number;
}

/** In-memory fake that runs the same sliding-window logic as the Lua script. */
function createFakeRedis(): RedisCooldownClient & { zsets: Map<string, ZEntry[]> } {
  const zsets = new Map<string, ZEntry[]>();

  function prune(key: string, windowStart: number) {
    const entries = (zsets.get(key) ?? []).filter((e) => e.score > windowStart);
    zsets.set(key, entries);
    return entries;
  }

  return {
    zsets,
    async eval(_script, options) {
      const key = options.keys[0]!;
      const now = Number(options.arguments[0]);
      const window = Number(options.arguments[1]);
      const limit = Number(options.arguments[2]);
      const memberId = options.arguments[3]!;
      const windowStart = now - window;
      const entries = prune(key, windowStart);
      if (entries.length >= limit) {
        const oldest = entries[0]!;
        const retry = Math.max(0, Math.floor(oldest.score + window - now));
        return [0, retry];
      }
      entries.push({ member: memberId, score: now });
      entries.sort((a, b) => a.score - b.score);
      zsets.set(key, entries);
      return [1, 0];
    },
    async del(key) {
      const keys = Array.isArray(key) ? key : [key];
      let n = 0;
      for (const k of keys) {
        if (zsets.delete(k)) n += 1;
      }
      return n;
    },
    async *scanIterator(options) {
      const pattern = options.MATCH;
      const prefix = pattern.endsWith("*") ? pattern.slice(0, -1) : pattern;
      for (const key of [...zsets.keys()]) {
        if (key.startsWith(prefix)) yield key;
      }
    },
  };
}

describe("@stambha/cooldown-redis", () => {
  it("exposes the consume Lua script", () => {
    expect(CONSUME_SCRIPT).toContain("ZREMRANGEBYSCORE");
    expect(CONSUME_SCRIPT).toContain("ZADD");
  });

  it("allows up to limit then denies with retryAfterMs", async () => {
    const client = createFakeRedis();
    const store = createRedisCooldownStore({ client });
    const now = 1_000_000;

    expect(await store.consume("cmd:u1", 2, 60_000, now)).toEqual({
      allowed: true,
      retryAfterMs: 0,
    });
    expect(await store.consume("cmd:u1", 2, 60_000, now + 1)).toEqual({
      allowed: true,
      retryAfterMs: 0,
    });
    const denied = await store.consume("cmd:u1", 2, 60_000, now + 2);
    expect(denied.allowed).toBe(false);
    expect(denied.retryAfterMs).toBeGreaterThan(0);
  });

  it("uses keyPrefix for Redis keys", async () => {
    const client = createFakeRedis();
    const store = createRedisCooldownStore({ client, keyPrefix: "bot:cd:" });
    await store.consume("k", 5, 10_000, 100);
    expect([...client.zsets.keys()]).toEqual(["bot:cd:k"]);
  });

  it("reset removes a single bucket", async () => {
    const client = createFakeRedis();
    const store = createRedisCooldownStore({ client });
    await store.consume("a", 1, 10_000, 100);
    await store.reset?.("a");
    expect(await store.consume("a", 1, 10_000, 101)).toEqual({
      allowed: true,
      retryAfterMs: 0,
    });
  });

  it("clear only removes prefixed keys", async () => {
    const client = createFakeRedis();
    client.zsets.set("other:x", [{ member: "m", score: 1 }]);
    const store = createRedisCooldownStore({ client });
    await store.consume("a", 5, 10_000, 100);
    await store.clear?.();
    expect(client.zsets.has("stambha:cooldown:a")).toBe(false);
    expect(client.zsets.has("other:x")).toBe(true);
  });
});
