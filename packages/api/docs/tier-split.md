# Running `@stambha/api` in a tier-split deployment

Stambha can run as a **monolith** or as **split** workers (gateway / REST / bot). The HTTP API should not be started on every gateway shard.

## Monolith

Start the API in the same process as the bot:

```ts
import { createApiPlugin } from "@stambha/api";
import { attachPlugins } from "@stambha/plugins";

const api = createApiPlugin({ listenOptions: { port: 4000 } });
await attachPlugins(client, { plugins: [api.plugin] });
await client.start();
```

Put TLS and public exposure behind a reverse proxy (Caddy, nginx, Traefik). Set `trustProxy: true` when the proxy forwards `X-Forwarded-Proto` / `X-Forwarded-For`.

## Split tier

| Worker | Run `@stambha/api`? |
|--------|---------------------|
| Gateway shards | **No** — avoid N duplicate listeners and stale cache |
| REST worker | Optional — if the API only needs outbound Discord REST |
| Bot / command worker | **Yes (recommended)** — has `StambhaClient`, Vault, and piece registries |

Wire the plugin only in the bot worker entrypoint. Health (`GET /health`) reports `tier` and `workerRole` when a client is attached.

## CORS and credentials

Use an explicit frontend origin in production:

```ts
createApiServer({
  origin: "https://panel.example.com",
  credentials: true, // for cookie-based sessions when enabled
});
```

`origin: "*"` with `credentials: true` throws at startup.

## Roadmap

Later releases of this package will add Discord OAuth with server-side sessions, Vault-backed config routes, and richer helpers for split workers.

Until then, register your own routes via `createApiServer({ routes: […] })`.
