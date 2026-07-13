# @stambha/api

**HTTP API host** for Stambha bots — a mountable router so you can build your own admin frontend against the bot process.

Part of [**Stambha plugins**](https://github.com/Mivaya/Stambha-plugins) · peers [`@stambha/core`](https://github.com/Mivaya/Stambha) `^1.2.0` · optional [`@stambha/plugins`](https://github.com/Mivaya/Stambha)

---

## Install

```bash
pnpm add @stambha/api @stambha/core @stambha/plugins
```

Requires **Node.js 20+**.

---

## Quick start

### Standalone server

```ts
import { createApiServer } from "@stambha/api";

const server = createApiServer({
  prefix: "/api",
  origin: "https://panel.example.com", // required when credentials: true
  listenOptions: { port: 4000, host: "0.0.0.0" },
  routes: [
    {
      method: "GET",
      path: "/hello",
      run: async (_req, res) => {
        res.json({ hello: "stambha" });
      },
    },
  ],
});

const handle = await server.listen();
console.log(`API listening on ${handle.url}`);
```

Built-in routes (under `prefix`):

| Method | Path | Body |
|--------|------|------|
| `GET` | `/health` | `{ ok: true, … }` |
| `GET` | `/version` | `{ name, version }` |

### As a Stambha plugin

```ts
import { createStambhaBot } from "@stambha/core";
import { attachPlugins } from "@stambha/plugins";
import { createApiPlugin } from "@stambha/api";

const client = createStambhaBot({ /* restPort, … */ });
const api = createApiPlugin({
  listenOptions: { port: 4000 },
  origin: ["https://panel.example.com"],
});

await attachPlugins(client, { plugins: [api.plugin] });
await client.start();
// server listens on postStart
```

Bring your own frontend — this package does **not** ship a hosted UI.

---

## Security defaults

| Topic | Behavior |
|-------|----------|
| CORS | `origin: "*"` allowed only when `credentials` is false; otherwise **fail at startup** |
| Body | Streams with a real byte limit (`maximumBodyLength`, default 1 MiB) |
| Request id | `X-Request-Id` echoed / generated |

OAuth, cookie sessions, and Vault-backed config routes are planned for later releases of this package.

---

## Tier split

See [docs/tier-split.md](./docs/tier-split.md) — run the API on the **bot / REST** worker, not on every gateway shard.

---

## Key exports

| Export | Purpose |
|--------|---------|
| `createApiServer` | Build router + listen |
| `createApiPlugin` | `definePlugin("api")` lifecycle helper |
| `Router`, `RouteStore`, `MiddlewareStore` | Extend with custom routes/middleware |

---

## Development

```bash
pnpm --filter @stambha/api build
pnpm --filter @stambha/api test
```
