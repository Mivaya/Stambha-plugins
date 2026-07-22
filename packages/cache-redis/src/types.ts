/**
 * Minimal Redis surface used by {@link RedisCache}.
 * Compatible with `redis` (node-redis) clients; injectable for tests.
 */
export interface RedisCacheClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { PX?: number }): Promise<unknown>;
  del(key: string | string[]): Promise<number>;
  scanIterator(options: { MATCH: string; COUNT?: number }): AsyncIterable<string>;
}

export interface RedisCacheOptions {
  /** Connected Redis client (app owns connect / quit). */
  client: RedisCacheClient;
  /**
   * Key prefix — `clear()` only deletes keys under this prefix.
   * @default "stambha:cache:"
   */
  keyPrefix?: string;
  /** Default TTL when `set` omits `ttlMs` (none = no expiry). */
  defaultTtlMs?: number;
}
