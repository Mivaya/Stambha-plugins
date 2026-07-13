# Changelog

All notable changes to **Stambha-plugins** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Packages in this repo use **independent** versions — each `@stambha/`* extension may ship on its own cadence. This release aligns all published packages at **1.0.0**.

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

- [Stambha core CHANGELOG](https://github.com/mivaya/Stambha/blob/main/CHANGELOG.md) — framework releases (fixed versioning)

