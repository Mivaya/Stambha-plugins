import type { CooldownConsumeResult, CooldownStore } from "@stambha/gates";

/**
 * Minimal Redis surface for {@link RedisCooldownStore}.
 * Compatible with `redis` (node-redis) clients; injectable for tests.
 */
export interface RedisCooldownClient {
  eval(
    script: string,
    options: { keys: string[]; arguments: string[] },
  ): Promise<unknown>;
  del(key: string | string[]): Promise<number>;
  scanIterator(options: { MATCH: string; COUNT?: number }): AsyncIterable<string>;
}

export interface RedisCooldownStoreOptions {
  /** Connected Redis client (app owns connect / quit). */
  client: RedisCooldownClient;
  /**
   * Key prefix — `clear()` only deletes keys under this prefix.
   * @default "stambha:cooldown:"
   */
  keyPrefix?: string;
}

/**
 * Atomic sliding-window consume (ZSET + Lua).
 * Returns `{ allowed: 1|0, retryAfterMs }`.
 */
export const CONSUME_SCRIPT = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local windowStart = now - window
redis.call('ZREMRANGEBYSCORE', key, '-inf', windowStart)
local count = redis.call('ZCARD', key)
if count >= limit then
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  local oldestScore = tonumber(oldest[2])
  local retry = math.max(0, math.floor(oldestScore + window - now))
  return {0, retry}
end
redis.call('ZADD', key, now, now .. '-' .. ARGV[4])
redis.call('PEXPIRE', key, window)
return {1, 0}
`.trim();

export class RedisCooldownStore {
  private readonly client: RedisCooldownClient;
  private readonly prefix: string;
  private seq = 0;

  constructor(options: RedisCooldownStoreOptions) {
    this.client = options.client;
    this.prefix = options.keyPrefix ?? "stambha:cooldown:";
  }

  private redisKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async consume(
    key: string,
    limit: number,
    windowMs: number,
    now = Date.now(),
  ): Promise<CooldownConsumeResult> {
    this.seq += 1;
    const memberId = `${now}-${this.seq}`;
    const raw = await this.client.eval(CONSUME_SCRIPT, {
      keys: [this.redisKey(key)],
      arguments: [String(now), String(windowMs), String(limit), memberId],
    });

    const tuple = Array.isArray(raw) ? raw : [1, 0];
    const allowed = Number(tuple[0]) === 1;
    const retryAfterMs = Number(tuple[1] ?? 0);
    return { allowed, retryAfterMs };
  }

  async reset(key: string): Promise<void> {
    await this.client.del(this.redisKey(key));
  }

  /** Deletes only keys under the configured prefix — never FLUSHDB. */
  async clear(): Promise<void> {
    const match = `${this.prefix}*`;
    const batch: string[] = [];
    for await (const redisKey of this.client.scanIterator({ MATCH: match, COUNT: 100 })) {
      batch.push(redisKey);
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

/** Factory returning a store compatible with `cooldownGate({ store })`. */
export function createRedisCooldownStore(options: RedisCooldownStoreOptions): CooldownStore {
  return new RedisCooldownStore(options) as unknown as CooldownStore;
}
