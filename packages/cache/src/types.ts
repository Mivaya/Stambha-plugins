/** Async key/value cache (gateway guild/user snapshots, etc.). */
export interface Cache<V = unknown> {
  get(key: string): Promise<V | undefined>;
  set(key: string, value: V, ttlMs?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  has(key: string): Promise<boolean>;
  clear(): Promise<void>;
}

export interface CacheSetOptions {
  ttlMs?: number;
}
