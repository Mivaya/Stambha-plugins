# Changelog

All notable changes to **Stambha-plugins** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Packages use **independent** semver. Releases are tagged per package (`vapi-1.1.0`, title `v1.1.0 — @stambha/api`) — see [.github/PUBLISHING.md](.github/PUBLISHING.md).

## [Core 1.3.3 peers] - 2026-09-29

Peer ranges aligned with Stambha core **v1.3.3**.

### Changed

- `@stambha/core` / `@stambha/plugins` / `@stambha/vault` / `@stambha/gates` peers → `^1.3.3` where applicable
- Docs and README install lines updated for core `^1.3.3`

### Packages in this release

| Package | Version |
| ------- | ------- |
| `@stambha/api` | 1.2.3 |
| `@stambha/pagination` | 1.1.2 |
| `@stambha/metrics` | 1.0.2 |
| `@stambha/vault-sql` | 1.0.2 |
| `@stambha/cooldown-redis` | 1.0.2 |

`@stambha/cache` and `@stambha/cache-redis` unchanged (no core peers).

## [@stambha/api 1.2.3] - 2026-09-29

### Fixed

- **OAuth guild list** — cache `GET /users/@me/guilds` by Discord user id (10 minute fresh, 30 minute stale, 429 cooldown from `Retry-After` or 90 seconds). `GET /guilds` and `assertGuildAccess` return stale or empty data with `degraded: true` instead of throwing. `POST /auth/logout` drops the entry. Optional `oauthGuilds.store` matches `@stambha/cache`.

### Changed

- Peers `@stambha/core`, `@stambha/plugins`, and `@stambha/vault` → `^1.3.3`.

## [@stambha/api 1.2.2](https://github.com/Mivaya/Stambha-plugins/releases/tag/vapi-1.2.2) - 2026-09-09

### Fixed

- **CJS `loadRoutes`** — unwrap nested `default` / `__esModule` interop so `export default class` under `"type":"commonjs"` registers routes (`#39`).

## [@stambha/cache-redis 1.0.0](https://github.com/Mivaya/Stambha-plugins/releases/tag/vcache-redis-1.0.0) - 2026-09-09

### Added

- First npm release of Redis `Cache` driver (`createRedisCache` / `RedisCache`) for shared gateway/bot workers (A1).

## [Core 1.3.0 peers] - 2026-08-04

Peer ranges aligned with Stambha core **v1.3.0**.

### Changed

- `@stambha/core` / `@stambha/plugins` / `@stambha/vault` / `@stambha/gates` peers → `^1.3.0` where applicable
- Docs and README install lines updated for core `^1.3.0`

### Packages in this release

| Package | Version |
| ------- | ------- |
| `@stambha/api` | 1.2.1 |
| `@stambha/pagination` | 1.1.1 |
| `@stambha/metrics` | 1.0.1 |
| `@stambha/vault-sql` | 1.0.1 |
| `@stambha/cooldown-redis` | 1.0.1 |

`@stambha/cache` and `@stambha/cache-redis` unchanged (no core peers).

## [@stambha/pagination 1.1.0](https://github.com/Mivaya/Stambha-plugins/releases/tag/vpagination-1.1.0) - 2026-07-23

### Changed

- Default layout is **Components V2** (`IS_COMPONENTS_V2` + Container + Text Display + button row via `@stambha/core` builders)
- Peer dependency is now `@stambha/core@^1.2.2` (requires Components V2 exports)

### Added

- `variant: "classic"` to keep content/embeds + Action Row
- `accentColor`, `showPageCount`, `Page.displays`
- Embed → markdown conversion for V2 pages
- `buildClassicPagePayload` / `buildClassicDismissPayload`

## [@stambha/api 1.2.0](https://github.com/Mivaya/Stambha-plugins/releases/tag/vapi-1.2.0) - 2026-07-16

### Added

- File-based routes: `loadRoutes()`, optional `Route` base class, and `routesDir` on `createApiServerAsync` / `createApiPlugin` (`name.method.ts` → method + path)



## [@stambha/api 1.1.0](https://github.com/Mivaya/Stambha-plugins/releases/tag/vapi-1.1.0) - 2026-07-14



### Added

- Discord OAuth (PKCE + state), server-side sessions, CSRF, and auth rate limiting
- `GET /guilds` (manageable ∩ bot presence), channels/roles helpers
- Vault guild settings + schema routes (`GET`/`PATCH /guilds/:id/settings`, optional `@stambha/vault` peer)
- Deploy/listen controls: `listenWhen`, `STAMBHA_API_LISTEN`, `automaticallyListen` (mount on the bot worker, not every gateway process)



### Changed

- **Releases** (repo) — per-package tags `v<package>-<semver>` and titles `v<semver> — @stambha/<package>`; `publish-npm.yml` publishes only the tagged package



## [1.0.0](https://github.com/Mivaya/Stambha-plugins/releases/tag/v1.0.0) - 2026-07-13

Stable **1.0.0** line for every package in this monorepo. Peers target Stambha core `^1.2.0` where applicable.

### Added

- `@stambha/api` ****`1.0.0` — HTTP API host: mountable router, CORS / body / request-id middlewares, `GET /health` + `GET /version`, `createApiServer` / `createApiPlugin`. See `packages/api/docs/tier-split.md` for split-worker notes.
- `@stambha/pagination` ****`1.0.0` — embed pagination with prev / next / dismiss on Signals (`stambha:pagination:…`), `createPaginator`, `PaginationSignal`.



### Changed

- `@stambha/cache` ****`1.0.0` — first stable release (from `0.2.2`).
- `@stambha/metrics` ****`1.0.0` — first stable release (from `0.2.2`); peer `@stambha/core@^1.2.0`.
- `@stambha/vault-sql` ****`1.0.0` — first stable release (from `0.2.2`); peer `@stambha/vault@^1.2.0`.



### Packages in this release


| Package               | Version |
| --------------------- | ------- |
| `@stambha/api`        | 1.0.0   |
| `@stambha/cache`      | 1.0.0   |
| `@stambha/metrics`    | 1.0.0   |
| `@stambha/pagination` | 1.0.0   |
| `@stambha/vault-sql`  | 1.0.0   |




### Peer dependencies


| Package               | Peers                                             |
| --------------------- | ------------------------------------------------- |
| `@stambha/api`        | `@stambha/core@^1.2.0`, `@stambha/plugins@^1.2.0` |
| `@stambha/metrics`    | `@stambha/core@^1.2.0`                            |
| `@stambha/pagination` | `@stambha/core@^1.2.0`                            |
| `@stambha/vault-sql`  | `@stambha/vault@^1.2.0`                           |
| `@stambha/cache`      | —                                                 |




### Related

- [Plugins monorepo decision](https://github.com/mivaya/Stambha/blob/main/docs/internal/adr/003-plugins-monorepo.md)
- [Stambha core CHANGELOG](https://github.com/mivaya/Stambha/blob/main/CHANGELOG.md)



## [0.2.2](https://github.com/Mivaya/Stambha-plugins/releases/tag/v0.2.2) - 2026-06-11

First release from the **[Stambha-plugins](https://github.com/Mivaya/Stambha-plugins)** monorepo. These packages were extracted from the [Stambha core](https://github.com/mivaya/Stambha) repo at v0.2.2.

### Added

- `@stambha/cache` — pluggable in-memory cache (`MemoryCache`, `createMemoryCache`).
- `@stambha/metrics` — Prometheus counters/histograms, `attachClientMetrics`, optional `/metrics` HTTP server.
- `@stambha/vault-sql` — SQLite (`node:sqlite`, Node ≥ 22.5) and PostgreSQL drivers for `@stambha/vault`.
- **Repo governance** — `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`, `PUBLISHING.md`, issue/PR templates, Dependabot, dependency-review CI.
- `publish-npm.yml` — publish on GitHub Release (tag-driven; same model as Stambha core).



### Changed

- **Biome 2.4** — migrated `biome.json` and formatted sources for CI lint.
- **Releases** — dropped Changesets; maintainers bump `packages/*/package.json` and publish via GitHub Releases.



### Packages in this release


| Package              | Version |
| -------------------- | ------- |
| `@stambha/cache`     | 0.2.2   |
| `@stambha/metrics`   | 0.2.2   |
| `@stambha/vault-sql` | 0.2.2   |




### Peer dependencies

Extensions declare peers on core packages (e.g. `@stambha/core@^0.2.2`, `@stambha/vault@^0.2.2`). Align peer ranges when core ships new majors.

### Related

- [Plugins monorepo decision](https://github.com/mivaya/Stambha/blob/main/docs/internal/adr/003-plugins-monorepo.md)
- [Stambha core CHANGELOG](https://github.com/mivaya/Stambha/blob/main/CHANGELOG.md) — framework releases (fixed versioning)

