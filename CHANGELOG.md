# Changelog

All notable changes to **Stambha-plugins** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Packages in this repo use **independent** versions — each `@stambha/*` extension may ship on its own cadence.

## [Unreleased]

### Added

- **`@stambha/pagination` `1.0.0`** — embed pagination with prev / next / dismiss on Signals (`stambha:pagination:…`).
- **`AGENT.md`** — agent & architecture guide (aligned with core Stambha style).

### Changed

- **`.github/CONTRIBUTING.md`** — expanded to match core contributing structure (branching, commits, testing policy, releases).


- Peer / dev dependencies aligned to Stambha **1.2.0**:
  - `@stambha/metrics` → `@stambha/core@^1.2.0`
  - `@stambha/vault-sql` → `@stambha/vault@^1.2.0`
- `@stambha/cache` has no `@stambha/*` peers (unchanged).

## [0.2.1] - 2026-06-11

First release from the [**Stambha-plugins**](https://github.com/Mivaya/Stambha-plugins) monorepo. These packages were extracted from the [Stambha core](https://github.com/mivaya/Stambha) repo at v0.2.2.

### Added

- **`@stambha/cache`** — pluggable in-memory cache (`MemoryCache`, `createMemoryCache`).
- **`@stambha/metrics`** — Prometheus counters/histograms, `attachClientMetrics`, optional `/metrics` HTTP server.
- **`@stambha/vault-sql`** — SQLite (`node:sqlite`, Node ≥ 22.5) and PostgreSQL drivers for `@stambha/vault`.
- **Repo governance** — `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`, `PUBLISHING.md`, issue/PR templates, Dependabot, dependency-review CI.
- **`publish-npm.yml`** — publish on GitHub Release (tag-driven; same model as Stambha core).

### Changed

- **Biome 2.4** — migrated `biome.json` and formatted sources for CI lint.
- **Releases** — dropped Changesets; maintainers bump `packages/*/package.json` and publish via GitHub Releases.

### Packages in this release

| Package | Version |
|---------|---------|
| `@stambha/cache` | 1.0.0 |
| `@stambha/metrics` | 1.0.0 |
| `@stambha/vault-sql` | 1.0.0 |

### Peer dependencies

Extensions declare peers on core packages (e.g. `@stambha/core@^1.2.0`, `@stambha/vault@^1.2.0`). Align peer ranges when core ships new majors.

### Related

- [Stambha core CHANGELOG](https://github.com/mivaya/Stambha/blob/main/CHANGELOG.md) — framework releases (fixed versioning)

[0.2.2]: https://github.com/Mivaya/Stambha-plugins/releases/tag/v0.2.2
