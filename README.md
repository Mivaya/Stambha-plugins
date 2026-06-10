# Stambha-plugins

Official **optional** packages for [Stambha](https://github.com/mivaya/Stambha) — published separately from the core framework with **independent** semver ([Changesets](https://github.com/changesets/changesets)).

## Packages

| Package | Description |
|---------|-------------|
| [`@stambha/cache`](./packages/cache) | Pluggable cache (memory; Redis drivers planned) |
| [`@stambha/metrics`](./packages/metrics) | Prometheus metrics + HTTP scrape server |
| [`@stambha/vault-sql`](./packages/vault-sql) | SQLite / PostgreSQL drivers for Vault |

Future: `@stambha/dashboard`, `@stambha/i18n`, `@stambha/cron`, …

## Install

```bash
pnpm add @stambha/vault-sql @stambha/vault @stambha/core
```

Peer dependencies on `@stambha/*` core packages — see each package’s `package.json`.

## Development

```bash
pnpm install
pnpm build
pnpm test
```

## Releasing

See [PUBLISHING.md](./PUBLISHING.md).

## Related

- [Stambha core](https://github.com/mivaya/Stambha) — fixed-version monorepo (`@stambha/core`, `gateway`, `loader`, …)
- [ADR 003 — plugins monorepo](https://github.com/mivaya/Stambha/blob/main/docs/internal/adr/003-plugins-monorepo.md)
