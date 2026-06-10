# Stambha plugins

Official **optional extensions** for [Stambha](https://github.com/Mivaya/Stambha). The core framework ships command pipeline, gateway, REST, loader, and `@stambha/plugins` (plugin host). **This repo** ships drivers and add-ons that depend on published `@stambha/*` packages.

## Packages

| Package | Description |
|---------|-------------|
| [`@stambha/cache`](./packages/cache) | Pluggable in-memory cache for gateway / bot workers |
| [`@stambha/metrics`](./packages/metrics) | Prometheus metrics and `/metrics` HTTP server |
| [`@stambha/vault-sql`](./packages/vault-sql) | SQLite and PostgreSQL drivers for `@stambha/vault` |

### Planned (not yet in this repo)

| Package | Description |
|---------|-------------|
| `@stambha/dashboard` | HTTP + OAuth2 + Vault routes for web dashboards |
| `@stambha/i18n` | Locale files and command translation |
| `@stambha/cron` | Distributed scheduled tasks |
| `@stambha/dev-reload` | Dev-only piece hot reload |

## Install

From npm (after publish):

```bash
pnpm add @stambha/metrics @stambha/core
pnpm add @stambha/vault-sql @stambha/vault
```

## Development

Requires [Stambha](https://github.com/Mivaya/Stambha) packages on npm (`@stambha/core` ^0.2.1, `@stambha/vault` ^0.2.1 for vault-sql).

```bash
git clone git@github.com:Mivaya/Stambha-plugins.git
cd Stambha-plugins
pnpm install
pnpm build
pnpm test
```

## Integration

Extensions use the core plugin host — `definePlugin()` from `@stambha/plugins` in the main framework repo. No second plugin API.

```ts
import { attachPlugins } from "@stambha/plugins";
import { createDashboardPlugin } from "@stambha/dashboard"; // when published

attachPlugins(client, { plugins: [/* ... */] });
```

## Related

- [Stambha framework](https://github.com/Mivaya/Stambha)
- [ADR 003 — plugins monorepo](https://github.com/Mivaya/Stambha/blob/main/docs/internal/adr/003-plugins-monorepo.md)

## License

MIT © Mivaya
