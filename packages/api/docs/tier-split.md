# Running `@stambha/api` in a tier-split deployment

Stambha can run as a **monolith** or as **split** workers (gateway / REST / bot). The HTTP API should not be started on every gateway process.

## Monolith

```ts
import { createApiPlugin } from "@stambha/api";
import { attachPlugins } from "@stambha/plugins";

const api = createApiPlugin({ listenOptions: { port: 4000 } });
await attachPlugins(client, { plugins: [api.plugin] });
await client.start();
```

Put TLS behind a reverse proxy. Set `trustProxy: true` when the proxy forwards `X-Forwarded-*`.

## Split tier

| Worker | Run `@stambha/api`? |
|--------|---------------------|
| Gateway processes | **No** — avoid duplicate listeners and wrong process role |
| REST worker | Optional — REST-only panels; no Vault |
| Bot / command worker | **Yes (recommended)** — client, Vault, registries |

Wire the plugin **only** in the bot worker entrypoint. Do not rely on “start on shard 0” inside every gateway process.

### Manual listen

```ts
const api = createApiPlugin({
  automaticallyListen: false,
  listenWhen: () => process.env.WORKER === "bot",
});
await attachPlugins(client, { plugins: [api.plugin] });
await client.start();
await api.getHandle()?.server.listen();
```

`STAMBHA_API_LISTEN=0` skips binding in any process.

### Multi-replica bot workers

If more than one process serves the API:

- Put a load balancer in front, **or** bind the port on only one replica
- Replace `MemorySessionStore` with a shared `SessionStore` (e.g. Redis) so OAuth sessions stick

## CORS and credentials

```ts
createApiServer({
  origin: "https://panel.example.com",
  credentials: true,
  auth: { /* … */ },
});
```

`origin: "*"` with auth or credentials throws at startup.

## Auth + Vault

OAuth sessions and `/guilds/:id/settings` belong on the bot worker (Vault + `restPort`). See the package README for routes.
