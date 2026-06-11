# Contributing to Stambha-plugins

Thank you for helping maintain official **optional** packages for [Stambha](https://github.com/mivaya/Stambha). This repo publishes `@stambha/cache`, `@stambha/metrics`, `@stambha/vault-sql`, and future extensions — each with **independent** semver.

## Ways to contribute

- **Bug reports** — package name, version, Node version, steps to reproduce, and `@stambha/core` peer version if relevant.
- **Feature proposals** — open an issue first for new packages or breaking API changes.
- **Code** — drivers, metrics labels, cache backends, tests, and README updates.

## Before you start

1. Read the [README](../README.md) and the package README you are changing.
2. Search [existing issues](https://github.com/Mivaya/Stambha-plugins/issues).
3. For **new packages** (e.g. `@stambha/dashboard`), align with [ADR 003](https://github.com/mivaya/Stambha/blob/main/docs/internal/adr/003-plugins-monorepo.md) in the core repo.

## Development setup

```bash
git clone https://github.com/Mivaya/Stambha-plugins.git
cd Stambha-plugins
pnpm install
pnpm build
pnpm test
pnpm lint
```

Requirements:

- **Node.js 20+** (22.5+ for `@stambha/vault-sql` SQLite via `node:sqlite`)
- **pnpm 9+** (see root `packageManager`)

Single package:

```bash
pnpm --filter @stambha/metrics test
```

## Changesets (required for publishable changes)

This repo uses **independent** [Changesets](https://github.com/changesets/changesets) — bump only the packages you changed.

```bash
pnpm changeset
```

Commit the generated `.changeset/*.md` file with your PR. See [PUBLISHING.md](./PUBLISHING.md).

## Branch workflow

1. Fork and clone the repository.
2. Branch from latest `main`: `feature/your-short-name`
3. Open a PR with a clear summary and test plan.
4. Ensure CI passes (`lint`, `build`, `test`, `dependency-review`).

## Package rules

- **Peer dependencies** on `@stambha/*` core packages — never bundle core.
- **No `@stambha/plugin-*` names** — use capability names (`dashboard`, `i18n`, `cron`).
- Extensions integrate via `@stambha/plugins` (`definePlugin`) when they hook bot lifecycle.
- Do not add discord.js or other client libraries unless the package is explicitly a shape/helper driver.

## Core vs plugins

| Repo | Versioning | Examples |
|------|------------|----------|
| [Stambha](https://github.com/mivaya/Stambha) | Fixed (one version for all core packages) | `core`, `gateway`, `loader`, `vault` |
| **Stambha-plugins** (this repo) | Independent per package | `cache`, `metrics`, `vault-sql` |

Bug in `@stambha/core`? Open an issue on the **core** repo. Bug in an extension package? Open it here.

## Related

- [PUBLISHING.md](./PUBLISHING.md) — release workflow
- [SECURITY.md](../SECURITY.md) — vulnerability reporting
