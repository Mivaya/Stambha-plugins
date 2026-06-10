import type { Cache } from "./types.js";

interface Entry<V> {
  value: V;
  expiresAt: number | null;
}

export interface MemoryCacheOptions {
  /** Default TTL for entries without explicit ttlMs (none = no expiry). */
  defaultTtlMs?: number;
}

/** In-process LRU-free cache with optional per-key TTL. */
export class MemoryCache<V = unknown> implements Cache<V> {
  private readonly store = new Map<string, Entry<V>>();
  private readonly defaultTtlMs: number | undefined;

  constructor(options: MemoryCacheOptions = {}) {
    this.defaultTtlMs = options.defaultTtlMs;
  }

  async get(key: string): Promise<V | undefined> {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  async set(key: string, value: V, ttlMs?: number): Promise<void> {
    const ttl = ttlMs ?? this.defaultTtlMs;
    const expiresAt = ttl !== undefined ? Date.now() + ttl : null;
    this.store.set(key, { value, expiresAt });
  }

  async delete(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  async has(key: string): Promise<boolean> {
    return (await this.get(key)) !== undefined;
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  /** Current size (includes expired entries not yet read). */
  get size(): number {
    return this.store.size;
  }
}

export function createMemoryCache<V = unknown>(options?: MemoryCacheOptions): MemoryCache<V> {
  return new MemoryCache(options);
}
