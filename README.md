# Stambha-plugins

[GitHub](./LICENSE)

Official **optional** packages for [Stambha](https://github.com/mivaya/Stambha) — published separately from the core framework with **independent** semver per package.

Current release line: `1.0.0` (peers on Stambha core `^1.2.0` where applicable).

## Packages


| Package                                        | Version | Description                                          |
| ---------------------------------------------- | ------- | ---------------------------------------------------- |
| `[@stambha/api](./packages/api)`               | 1.0.0   | HTTP API host for user-built admin frontends         |
| `[@stambha/cache](./packages/cache)`           | 1.0.0   | Pluggable cache (memory; Redis drivers planned)      |
| `[@stambha/metrics](./packages/metrics)`       | 1.0.0   | Prometheus metrics + HTTP scrape server              |
| `[@stambha/pagination](./packages/pagination)` | 1.0.0   | Embed pagination (prev / next / dismiss) via Signals |
| `[@stambha/vault-sql](./packages/vault-sql)`   | 1.0.0   | SQLite / PostgreSQL drivers for Vault                |


Future: `@stambha/i18n`, `@stambha/cron`, Redis drivers, …

## Install

```bash
pnpm add @stambha/pagination @stambha/core
# or
pnpm add @stambha/api @stambha/core @stambha/plugins
# or
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

See `[.github/CONTRIBUTING.md](./.github/CONTRIBUTING.md)`. Architecture and agent conventions: `[AGENT.md](./AGENT.md)`.

## Releasing

See `[.github/PUBLISHING.md](./.github/PUBLISHING.md)` and [CHANGELOG.md](./CHANGELOG.md).

## Security

Report vulnerabilities privately — [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE) © Mivaya

## Related

- [Stambha core](https://github.com/mivaya/Stambha) — fixed-version monorepo (`@stambha/core`, `gateway`, `loader`, …)

