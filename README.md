# Stambha-plugins

**Optional packages for Stambha. Independent semver.**

Official extensions for [Stambha](https://github.com/mivaya/Stambha) — published separately from the core monorepo so each package can release on its own cadence.

[![GitHub](https://img.shields.io/github/license/Mivaya/Stambha-plugins)](./LICENSE)
[![Node](https://img.shields.io/node/v/@stambha/cache?color=339933&logo=node.js)](https://nodejs.org)
[![npm](https://img.shields.io/npm/v/@stambha/cache?color=cb3837&logo=npm)](https://www.npmjs.com/package/@stambha/cache)

Peers on Stambha core **^1.2.0** where applicable. Package versions are independent (see table).

---

## Packages

Published under [@stambha on npm](https://www.npmjs.com/org/stambha).

| Package | Version | Role |
|---------|---------|------|
| [`@stambha/api`](packages/api) | 1.1.0 | HTTP API host for user-built admin frontends |
| [`@stambha/cache`](packages/cache) | 1.0.0 | Pluggable cache (`MemoryCache`) |
| [`@stambha/cache-redis`](packages/cache-redis) | 1.0.0 | Redis `Cache` driver (shared across workers) |
| [`@stambha/metrics`](packages/metrics) | 1.0.0 | Prometheus metrics + HTTP scrape server |
| [`@stambha/pagination`](packages/pagination) | 1.0.0 | Embed pagination (prev / next / dismiss) via Signals |
| [`@stambha/vault-sql`](packages/vault-sql) | 1.0.0 | SQLite / PostgreSQL drivers for Vault |

Future: `@stambha/i18n`, `@stambha/cron`, Redis cooldown drivers, …

The plugin **host** (`definePlugin`, lifecycle, container) lives in core as [`@stambha/plugins`](https://github.com/mivaya/Stambha/tree/main/packages/plugins) — this repo only ships optional capabilities.

---

## Install

```bash
pnpm add @stambha/pagination @stambha/core
# or
pnpm add @stambha/api @stambha/core @stambha/plugins
# or
pnpm add @stambha/vault-sql @stambha/vault @stambha/core
# or (split-tier shared cache)
pnpm add @stambha/cache-redis @stambha/cache redis
```

Requires **Node.js 20+**. Peer dependencies on `@stambha/*` core packages — see each package’s `package.json` and README.

---

## Development

```bash
pnpm install
pnpm build
pnpm test
```

---

## Documentation

| | |
|---|---|
| [AGENT.md](AGENT.md) | Architecture & conventions for contributors / agents |
| [CHANGELOG.md](CHANGELOG.md) | Release notes |
| [Publishing](.github/PUBLISHING.md) | Tag-driven npm releases |
| [Contributing](.github/CONTRIBUTING.md) | PR workflow |

---

## Security

Report vulnerabilities privately — [SECURITY.md](SECURITY.md).

## License

[MIT](./LICENSE) © Mivaya

## Related

- [Stambha core](https://github.com/mivaya/Stambha) — fixed-version monorepo (`@stambha/core`, `gateway`, `loader`, …)