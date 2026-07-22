# @stambha/cooldown-redis

**Redis-backed [`CooldownStore`](https://www.npmjs.com/package/@stambha/gates)** for shared command cooldowns across gateway/bot workers.

Part of [**Stambha plugins**](https://github.com/Mivaya/Stambha-plugins) · [Stambha framework](https://github.com/Mivaya/Stambha)

Monolith bots keep the default in-memory store in `@stambha/gates`. Use this package when multiple processes must share the same cooldown buckets.

Requires `@stambha/gates` with **async-capable** `CooldownStore.consume` (Stambha A2).

---

## Install

```bash
pnpm add @stambha/cooldown-redis @stambha/gates redis
```

Requires **Node.js 20+**. Peers: `@stambha/gates@^1.2.0`, `redis@^4.7 || ^5`.

---

## Quick start

```ts
import { createClient } from "redis";
import { cooldownGate } from "@stambha/gates";
import { createRedisCooldownStore } from "@stambha/cooldown-redis";

const client = createClient({ url: process.env.REDIS_URL });
await client.connect();

const store = createRedisCooldownStore({ client });

cooldownGate({
  limit: 1,
  delay: 5_000,
  store,
});
```

Sliding-window hits are stored in a Redis ZSET; consume is **atomic** via Lua. `clear()` only deletes keys under `keyPrefix` (default `stambha:cooldown:`) — never `FLUSHDB`.

---

## Options

| Option | Default | Notes |
|--------|---------|--------|
| `client` | (required) | Connected `redis` client (or compatible `RedisCooldownClient`) |
| `keyPrefix` | `stambha:cooldown:` | Namespace for buckets + `clear()` |

---

## Key exports

| Export | Purpose |
|--------|---------|
| `RedisCooldownStore`, `createRedisCooldownStore` | Redis `CooldownStore` |
| `RedisCooldownStoreOptions` | Constructor / factory options |
| `RedisCooldownClient` | Minimal client surface for tests / adapters |
| `CONSUME_SCRIPT` | Lua script used for atomic consume |

---

## Related packages

| Package | Role |
|---------|------|
| [`@stambha/gates`](https://github.com/Mivaya/Stambha/tree/main/packages/gates) | `cooldownGate`, `CooldownStore`, `MemoryCooldownStore` |
| [`@stambha/cache-redis`](../cache-redis) | Shared Redis entity cache (separate concern) |

---

## Development

```bash
pnpm --filter @stambha/cooldown-redis build
pnpm --filter @stambha/cooldown-redis test
```
