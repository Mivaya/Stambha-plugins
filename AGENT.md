# Stambha-plugins — agent & architecture guide

Canonical architecture and conventions for contributors and coding agents working in this repository.

For contribution workflow (PRs, branching, releases), see [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md).

Core framework architecture lives in the [Stambha](https://github.com/mivaya/Stambha) repo’s [`AGENT.md`](https://github.com/mivaya/Stambha/blob/main/AGENT.md).

If your coding agent expects a different filename, create a local symlink to this file instead of copying it:

```bash
ln -s AGENT.md CLAUDE.md
ln -s AGENT.md GEMINI.md
ln -s AGENT.md COPILOT.md
```

---

## What Stambha-plugins is

Official **optional** packages for [Stambha](https://github.com/mivaya/Stambha) — published separately from the core monorepo.

- **npm scope:** `@stambha/*` (same org as core)
- **Versioning:** **independent semver per package** (unlike core’s lockstep)
- **Plugin host:** already in core as `@stambha/plugins` (`definePlugin`, lifecycle, container) — **do not** reimplement the host here
- **Package names:** capability names only (`cache`, `pagination`, `dashboard`) — **never** `@stambha/plugin-*`
- **Transport:** native Stambha stack only — no discord.js / Discordeno in extension packages unless a package is explicitly a shape helper (prefer none)
- **Signal custom ids:** `stambha:` prefix (see core Signals docs)
- **GitHub:** [Mivaya/Stambha-plugins](https://github.com/Mivaya/Stambha-plugins)
- **ADR:** [003 — plugins monorepo](https://github.com/mivaya/Stambha/blob/main/docs/internal/adr/003-plugins-monorepo.md)

---

## Relationship to core

```text
@stambha/core (+ gateway, rest, transform, loader, vault, plugins, …)
        ↑ peers only
@stambha/cache | metrics | pagination | vault-sql | …   ← this repo
```

| Repo | Role | Versioning |
|------|------|------------|
| [Stambha](https://github.com/mivaya/Stambha) | Framework + plugin **host** | Fixed (all packages share one version) |
| **Stambha-plugins** (this repo) | Optional capability packages | Independent per package |

**Rules:**

1. Never add extension source into core `packages/`
2. Declare **peerDependencies** on `@stambha/*` core packages — never bundle core
3. Prefer peers compatible with current core on npm (today **`^1.2.0`** where applicable)
4. Public package READMEs: no internal kanban / phase jargon

---

## Packages (today)

| Package | Role |
|---------|------|
| [`@stambha/cache`](./packages/cache) | Pluggable cache (in-memory; Redis planned) |
| [`@stambha/metrics`](./packages/metrics) | Prometheus metrics + scrape HTTP server |
| [`@stambha/pagination`](./packages/pagination) | Embed pagination via Signals (`stambha:pagination:…`) |
| [`@stambha/vault-sql`](./packages/vault-sql) | SQLite / PostgreSQL drivers for `@stambha/vault` |

Planned (kanban / known-gaps): `@stambha/dashboard`, Redis cache/cooldown drivers, `@stambha/i18n`, `@stambha/dev-reload`, …

---

## Package layout

Each publishable package lives under `packages/<name>/`:

```text
packages/<name>/
  package.json      # name @stambha/<name>, peerDeps, dual exports
  tsconfig.json     # extends ../../tsconfig.base.json
  tsup.config.ts    # stambhaPackageConfig() → ESM + CJS
  vitest.config.ts
  README.md         # install + native-stack example
  src/
    index.ts        # public exports
    *.ts
    *.test.ts
```

Shared tooling at repo root: `tsup.package.ts`, `tsconfig.base.json`, Biome, Vitest.

---

## Conventions for code changes

### Monorepo

- **pnpm** workspaces (`packages/*`)
- **ESM** in source; `.js` import suffixes in TypeScript
- **Dual publish:** ESM (`import`) + CJS (`require`) via shared `stambhaPackageConfig`

### TypeScript

- Match existing strictness (`exactOptionalPropertyTypes`, ESM)
- Prefer explicit types on public APIs
- Avoid `any`; narrow at boundaries

### Style

- [Biome](https://biomejs.dev/) — run `pnpm lint` before pushing
- Match surrounding code: minimal abstractions, no drive-by refactors
- Comments only for non-obvious behavior

### Tests

- **Vitest** in the package you change
- Prefer tests without a Discord token (mock `SignalContext`, in-memory stores, etc.)

### Before release-related commits

```bash
pnpm build
pnpm test
pnpm lint
```

### API names

Use **Stambha** naming and `stambha:` custom ids — not Stratum or legacy bridge names.

---

## Adding a new `@stambha/*` package

1. Create `packages/<name>/` following an existing package (`cache`, `metrics`, or `pagination`)
2. Capability name only — not `@stambha/plugin-<name>`
3. Peer on the minimum `@stambha/*` packages you need (`core`, `vault`, …)
4. Add `publishConfig.access: public` when publishing
5. Add Vitest tests and a short README with a **native-stack** example
6. List the package in the root [README](./README.md) and [CHANGELOG](./CHANGELOG.md) (Unreleased)
7. Do **not** bump versions in the feature PR unless a maintainer asks

---

## Pagination (Signals)

`@stambha/pagination` builds on core Signals:

```text
stambha:pagination:{prev|next|dismiss}:{sessionId}
```

- `createPaginator()` → initial `ReplyPayload` (page + buttons)
- `PaginationSignal` → handles clicks (prefer interaction callback type 7 via `client.restPort`)

See [`packages/pagination/README.md`](./packages/pagination/README.md).

---

## Semver (per package)

| Release | Policy |
|---------|--------|
| **Major** | Breaking API for that package only |
| **Minor** | New features, backward compatible |
| **Patch** | Bug fixes, backward compatible |

Maintainers bump with `pnpm version:bump` and publish via GitHub Release — see [.github/PUBLISHING.md](.github/PUBLISHING.md).

---

## Repo anchors

| Resource | Path |
|----------|------|
| Architecture (this file) | `AGENT.md` |
| Contributing | `.github/CONTRIBUTING.md` |
| Publishing | `.github/PUBLISHING.md` |
| Security | `SECURITY.md` |
| Changelog | `CHANGELOG.md` |
| Core framework | https://github.com/mivaya/Stambha |
| Core agent guide | https://github.com/mivaya/Stambha/blob/main/AGENT.md |
