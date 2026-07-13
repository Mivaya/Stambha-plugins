# Stambha-plugins

**Optional packages for Stambha. Independent semver.**

Official extensions for [Stambha](https://github.com/mivaya/Stambha) — published separately from the core monorepo so each package can release on its own cadence.

[![GitHub](https://img.shields.io/github/license/Mivaya/Stambha-plugins)](./LICENSE)
[![Node](https://img.shields.io/node/v/@stambha/cache?color=339933&logo=node.js)](https://nodejs.org)
[![npm](https://img.shields.io/npm/v/@stambha/cache?color=cb3837&logo=npm)](https://www.npmjs.com/package/@stambha/cache)

Current release line: **1.0.0** (peers on Stambha core **^1.2.0** where applicable).

---

## Packages

Published under [@stambha on npm](https://www.npmjs.com/org/stambha).

| Package | Version | Role |
|---------|---------|------|
| [`@stambha/api`](packages/api) | 1.0.0 | HTTP API host for user-built admin frontends |
| [`@stambha/cache`](packages/cache) | 1.0.0 | Pluggable cache (memory; Redis drivers planned) |
| [`@stambha/metrics`](packages/metrics) | 1.0.0 | Prometheus metrics + HTTP scrape server |
| [`@stambha/pagination`](packages/pagination) | 1.0.0 | Embed pagination (prev / next / dismiss) via Signals |
| [`@stambha/vault-sql`](packages/vault-sql) | 1.0.0 | SQLite / PostgreSQL drivers for Vault |

Future: `@stambha/i18n`, `@stambha/cron`, Redis drivers, …

The plugin **host** (`definePlugin`, lifecycle, container) lives in core as [`@stambha/plugins`](https://github.com/mivaya/Stambha/tree/main/packages/plugins) — this repo only ships optional capabilities.

---

## Install

```bash
pnpm add @stambha/pagination @stambha/core
# or
pnpm add @stambha/api @stambha/core @stambha/plugins
# or
pnpm add @stambha/vault-sql @stambha/vault @stambha/core
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
- [Plugins monorepo decision](https://github.com/mivaya/Stambha/blob/main/docs/internal/adr/003-plugins-monorepo.md)
