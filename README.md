# Stambha-plugins

[![GitHub](https://img.shields.io/github/license/Mivaya/Stambha-plugins)](./LICENSE)

Official **optional** packages for [Stambha](https://github.com/mivaya/Stambha) — published separately from the core framework with **independent** semver per package.

## Packages

| Package | Description |
|---------|-------------|
| [`@stambha/api`](./packages/api) | HTTP API host for user-built admin frontends |
| [`@stambha/cache`](./packages/cache) | Pluggable cache (memory; Redis drivers planned) |
| [`@stambha/metrics`](./packages/metrics) | Prometheus metrics + HTTP scrape server |
| [`@stambha/pagination`](./packages/pagination) | Embed pagination (prev / next / dismiss) via Signals |
| [`@stambha/vault-sql`](./packages/vault-sql) | SQLite / PostgreSQL drivers for Vault |

Future: `@stambha/i18n`, `@stambha/cron`, Redis drivers, …

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

## Contributing

See [`.github/CONTRIBUTING.md`](./.github/CONTRIBUTING.md). Architecture and agent conventions: [`AGENT.md`](./AGENT.md).

## Releasing

See [`.github/PUBLISHING.md`](./.github/PUBLISHING.md) and [CHANGELOG.md](./CHANGELOG.md).

## Security

Report vulnerabilities privately — [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE) © Mivaya

## Related

- [Stambha core](https://github.com/mivaya/Stambha) — fixed-version monorepo (`@stambha/core`, `gateway`, `loader`, …)
- [Plugins monorepo decision](https://github.com/mivaya/Stambha/blob/main/docs/internal/adr/003-plugins-monorepo.md)
