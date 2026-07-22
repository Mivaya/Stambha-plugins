# @stambha/cache

**Pluggable cache** for gateway and bot workers — in-memory implementation with TTL support.

Part of [**Stambha plugins**](https://github.com/Mivaya/Stambha-plugins) · [Stambha framework](https://github.com/Mivaya/Stambha)

---

## Install

```bash
npm install @stambha/cache
```

Requires **Node.js 20+**.

---

## Quick start

```ts
import { createMemoryCache } from "@stambha/cache";

const cache = createMemoryCache({ defaultTtlMs: 60_000 });

await cache.set("guild:g1", { name: "My Server" });
const guild = await cache.get<{ name: string }>("guild:g1");
await cache.delete("guild:g1");
```

Use behind gateway workers to avoid re-fetching guild/channel payloads on every event.

---

## Key exports

| Export | Purpose |
|--------|---------|
| `Cache` | `get` / `set` / `delete` interface |
| `MemoryCache`, `createMemoryCache` | In-process TTL cache |
| `CacheSetOptions` | Per-key TTL overrides |

For **shared** cache across workers, use [`@stambha/cache-redis`](../cache-redis).

---

## Related packages

| Package | Role |
|---------|------|
| [`@stambha/cache-redis`](../cache-redis) | Redis `Cache` driver |
| [`@stambha/gateway`](https://github.com/Mivaya/Stambha/tree/main/packages/gateway) | Shard workers that benefit from caching |
| [`@stambha/rest`](https://github.com/Mivaya/Stambha/tree/main/packages/rest) | Fetch missing entities on cache miss |

---

## Development

```bash
pnpm --filter @stambha/cache build
pnpm --filter @stambha/cache test
```
