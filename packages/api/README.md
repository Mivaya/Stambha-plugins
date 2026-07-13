# @stambha/api

**HTTP API host** for Stambha bots — mountable router for user-built admin frontends, with optional Discord OAuth, sessions, and Vault guild settings.

Part of [**Stambha plugins**](https://github.com/Mivaya/Stambha-plugins) · peers [`@stambha/core`](https://github.com/Mivaya/Stambha) `^1.2.0` · optional [`@stambha/plugins`](https://github.com/Mivaya/Stambha), [`@stambha/vault`](https://github.com/Mivaya/Stambha)

---

## Install

```bash
pnpm add @stambha/api @stambha/core @stambha/plugins
# optional for settings routes:
pnpm add @stambha/vault
```

Requires **Node.js 20+**.

---

## Quick start

### Standalone server

```ts
import { createApiServer } from "@stambha/api";

const server = createApiServer({
  prefix: "/api",
  origin: "https://panel.example.com",
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
```

Built-ins without auth: `GET /health`, `GET /version`.

### Dashboard auth + guild settings

```ts
import { createApiPlugin } from "@stambha/api";
import { attachPlugins } from "@stambha/plugins";

const api = createApiPlugin({
  listenOptions: { port: 4000 },
  origin: "https://panel.example.com",
  auth: {
    clientId: process.env.DISCORD_CLIENT_ID!,
    clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    redirectUri: "https://bot.example.com/api/auth/callback",
    // cookie: { secure: false } // only for local http://
  },
  vault, // optional — enables settings routes
  restPort: client.restPort,
});

await attachPlugins(client, { plugins: [api.plugin] });
await client.start();
```

When `auth` is set (credentials default on):

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/auth/login` | Redirect to Discord (PKCE + state) |
| `GET`/`POST` | `/auth/callback` | Code exchange → session cookie |
| `POST` | `/auth/logout` | Revoke + clear cookie (needs `X-CSRF-Token`) |
| `GET` | `/auth/me` | Current user + `csrfToken` |
| `GET` | `/guilds` | Manageable guilds ∩ bot presence |
| `GET` | `/guilds/:id/channels` | Channel list (bot REST) |
| `GET` | `/guilds/:id/roles` | Role list (bot REST) |
| `GET`/`PATCH` | `/guilds/:id/settings` | Vault guild settings (if `vault`) |
| `GET` | `/guilds/:id/settings/schema` | Blueprint fields for forms |

Sessions are **server-side** (opaque HttpOnly cookie). Mutating requests must send `X-CSRF-Token` from `/auth/me`.

This package does **not** ship a hosted UI.

---

## Deploy / listen control

Do **not** start the API on every gateway shard process. Attach the plugin only in the **bot** (or monolith) entrypoint.

```ts
createApiPlugin({
  automaticallyListen: false, // create server in postStart, listen yourself
  listenWhen: () => process.env.ROLE === "bot",
});

// later:
await api.getHandle()?.server.listen();
```

Or set `STAMBHA_API_LISTEN=0` to skip binding. Prefer process isolation over “listen only on shard 0” patterns.

See [docs/tier-split.md](./docs/tier-split.md).

---

## Security defaults

| Topic | Behavior |
|-------|----------|
| CORS | `origin: "*"` forbidden when auth / credentials |
| Sessions | Opaque id cookie; tokens stay server-side |
| CSRF | Required for cookie-auth mutating routes |
| Body | Byte-limited JSON stream |
| Auth rate limit | In-memory limiter on `/auth` |

---

## Key exports

| Export | Purpose |
|--------|---------|
| `createApiServer` / `createApiPlugin` | Host + lifecycle |
| `MemorySessionStore` | Default session store (swap for multi-replica) |
| `Router`, `RouteStore`, `MiddlewareStore` | Custom routes/middleware |

---

## Development

```bash
pnpm --filter @stambha/api build
pnpm --filter @stambha/api test
```
