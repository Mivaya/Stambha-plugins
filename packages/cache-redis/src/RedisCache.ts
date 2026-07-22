import type { Cache } from "@stambha/cache";
import type { RedisCacheClient, RedisCacheOptions } from "./types.js";

const DEFAULT_PREFIX = "stambha:cache:";

/** Redis-backed {@link Cache} — values must be JSON-serializable. */
export class RedisCache<V = unknown> implements Cache<V> {
  private readonly client: RedisCacheClient;
  private readonly prefix: string;
  private readonly defaultTtlMs: number | undefined;

  constructor(options: RedisCacheOptions) {
    this.client = options.client;
    this.prefix = options.keyPrefix ?? DEFAULT_PREFIX;
    this.defaultTtlMs = options.defaultTtlMs;
  }

  private redisKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async get(key: string): Promise<V | undefined> {
    const raw = await this.client.get(this.redisKey(key));
    if (raw === null) return undefined;
    try {
      return JSON.parse(raw) as V;
    } catch {
      return undefined;
    }
  }

  async set(key: string, value: V, ttlMs?: number): Promise<void> {
    const encoded = JSON.stringify(value);
    const ttl = ttlMs ?? this.defaultTtlMs;
    const redisKey = this.redisKey(key);
    if (ttl !== undefined) {
      await this.client.set(redisKey, encoded, { PX: ttl });
    } else {
      await this.client.set(redisKey, encoded);
    }
  }

  async delete(key: string): Promise<boolean> {
    const n = await this.client.del(this.redisKey(key));
    return n > 0;
  }

  async has(key: string): Promise<boolean> {
    return (await this.get(key)) !== undefined;
  }

  /**
   * Deletes only keys under {@link RedisCacheOptions.keyPrefix}.
   * Never runs FLUSHDB.
   */
  async clear(): Promise<void> {
    const match = `${this.prefix}*`;
    const batch: string[] = [];
    for await (const key of this.client.scanIterator({ MATCH: match, COUNT: 100 })) {
      batch.push(key);
      if (batch.length >= 100) {
        await this.client.del(batch);
        batch.length = 0;
      }
    }
    if (batch.length > 0) {
      await this.client.del(batch);
    }
  }
}

export function createRedisCache<V = unknown>(options: RedisCacheOptions): RedisCache<V> {
  return new RedisCache(options);
}
