import { describe, expect, it, vi } from "vitest";
import { createMemoryCache } from "./MemoryCache.js";

describe("@stambha/cache", () => {
  it("stores and retrieves values", async () => {
    const cache = createMemoryCache<string>();
    await cache.set("guild:1", "data");
    expect(await cache.get("guild:1")).toBe("data");
    expect(await cache.has("guild:1")).toBe(true);
  });

  it("expires entries by ttl", async () => {
    vi.useFakeTimers();
    const cache = createMemoryCache<number>();
    await cache.set("k", 42, 1000);
    vi.advanceTimersByTime(1001);
    expect(await cache.get("k")).toBeUndefined();
    vi.useRealTimers();
  });
});
