# Stambha-plugins — agent & architecture guide

Canonical architecture and conventions for contributors and coding agents working in this repository.

For contribution workflow (PRs, branching, releases), see [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md).

Core framework architecture: [Stambha `AGENT.md`](https://github.com/mivaya/Stambha/blob/main/AGENT.md).

If your coding agent expects a different filename, create a local symlink:

```bash
ln -s AGENT.md CLAUDE.md
ln -s AGENT.md GEMINI.md
ln -s AGENT.md COPILOT.md
```

---

## What Stambha-plugins is

Official **optional** packages for [Stambha](https://github.com/mivaya/Stambha).

- **Independent semver** per package
- **Plugin host** stays in core (`@stambha/plugins`) — do not reimplement it here
- **Capability names** only — never `@stambha/plugin-*`
- **Native stack** — no third-party Discord client libraries in extensions

| Package | Role |
|---------|------|
| `@stambha/api` | HTTP API host for user-built admin frontends |
| `@stambha/cache` | Pluggable cache |
| `@stambha/metrics` | Prometheus metrics |
| `@stambha/pagination` | Embed pagination via Signals |
| `@stambha/vault-sql` | SQL Vault drivers |

Public docs and package READMEs must not use internal ticket IDs or other frameworks’ names.

---

## `@stambha/api`

- `createApiServer` / `createApiPlugin`
- Built-ins: CORS (fail-fast on `*` + credentials), JSON body limit, `X-Request-Id`, `GET /health`, `GET /version`
- Optional Discord OAuth (PKCE + state), server-side sessions, CSRF, guild list ∩ bot, Vault settings routes
- Listen control: `automaticallyListen`, `listenWhen`, `STAMBHA_API_LISTEN=0` — mount only on the bot worker

See [`packages/api/README.md`](./packages/api/README.md) and [`packages/api/docs/tier-split.md`](./packages/api/docs/tier-split.md).

---

## Conventions

- pnpm workspaces; dual ESM + CJS via `tsup.package.ts`
- Peer on `@stambha/*` — never bundle core
- Vitest; Biome (`pnpm lint`)
- Before release: `pnpm build && pnpm test && pnpm lint`
