# @stambha/cache-redis

**Redis-backed [`Cache`](https://www.npmjs.com/package/@stambha/cache)** for shared state across gateway and bot workers.

Part of [**Stambha plugins**](https://github.com/Mivaya/Stambha-plugins) · [Stambha framework](https://github.com/Mivaya/Stambha)

Values must be **JSON-serializable**. Monolith bots can keep [`@stambha/cache`](../cache) `MemoryCache` — Redis is optional for split-tier / multi-process setups.

---

## Install

```bash
pnpm add @stambha/cache-redis @stambha/cache redis
```

Requires **Node.js 20+**. Peers: `@stambha/cache@^1.0.0`, `redis@^4.7 || ^5`.

---

## Quick start

```ts
import { createClient } from "redis";
import { createRedisCache } from "@stambha/cache-redis";

const client = createClient({ url: process.env.REDIS_URL });
await client.connect();

const cache = createRedisCache({
  client,
  defaultTtlMs: 60_000,
  // keyPrefix: "stambha:cache:", // default
});

await cache.set("guild:g1", { name: "My Server" });
const guild = await cache.get<{ name: string }>("guild:g1");
await cache.delete("guild:g1");
await cache.clear(); // only keys under keyPrefix — never FLUSHDB

// App owns the connection:
// await client.quit();
```

Wire the same cache instance into each worker that should share hot guild/channel snapshots — see Stambha [Gateway](https://github.com/Mivaya/Stambha/blob/main/docs/deployment/gateway.md) docs.

---

## Options

| Option | Default | Notes |
|--------|---------|--------|
| `client` | (required) | Connected `redis` client (or compatible `RedisCacheClient`) |
| `keyPrefix` | `stambha:cache:` | Namespace; `clear()` only deletes this prefix |
| `defaultTtlMs` | unset | Applied when `set` omits `ttlMs` |

---

## Key exports

| Export | Purpose |
|--------|---------|
| `RedisCache`, `createRedisCache` | Redis `Cache` implementation |
| `RedisCacheOptions` | Constructor / factory options |
| `RedisCacheClient` | Minimal client surface for custom adapters / tests |

---

## Related packages

| Package | Role |
|---------|------|
| [`@stambha/cache`](../cache) | `Cache` interface + in-process `MemoryCache` |
| [`@stambha/gateway`](https://github.com/Mivaya/Stambha/tree/main/packages/gateway) | Shard workers that benefit from shared caching |

---

## Development

```bash
pnpm --filter @stambha/cache-redis build
pnpm --filter @stambha/cache-redis test
```
