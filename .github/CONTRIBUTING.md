# Contributing to Stambha-plugins

Thank you for helping maintain official **optional** packages for [Stambha](https://github.com/mivaya/Stambha). This repo publishes `@stambha/api`, `@stambha/cache`, `@stambha/cache-redis`, `@stambha/metrics`, `@stambha/vault-sql`, and future extensions — each with **independent** semver.

## Ways to Contribute

- **Bug reports** — open an issue with package name, version, Node version, steps to reproduce, expected vs actual behavior, and `@stambha/core` (or other peer) versions when relevant
- **Feature requests** — open an issue for new packages or non-trivial APIs so design can be discussed before a large PR
- **Pull requests** — bug fixes, tests, docs, drivers, metrics, pagination, and other extension work
- **Core framework** — pipeline, gateway, REST, and the plugin **host** belong in [**Stambha**](https://github.com/mivaya/Stambha), not here

### Good first contributions

1. Read the [README](../README.md) and the package README you are changing.
2. Search [existing issues](https://github.com/Mivaya/Stambha-plugins/issues).

### Prerequisites

- **Node.js 20+** (22.5+ for `@stambha/vault-sql` SQLite via `node:sqlite`)
- **pnpm 9+** (see root `packageManager` field)

### Build & Run

```bash
git clone https://github.com/Mivaya/Stambha-plugins.git
cd Stambha-plugins
pnpm install
pnpm build
pnpm lint
pnpm typecheck
```

### Run Tests

```bash
pnpm test                                          # all packages
pnpm --filter @stambha/pagination test             # single package
pnpm --filter @stambha/cache test path/to/file.test.ts  # single file (Vitest)
```

Before you start:

1. Read the [README](../README.md) and the package README you are changing.
2. Search [existing issues](https://github.com/Mivaya/Stambha-plugins/issues) to avoid duplicate work.
3. For **large features** (new package, breaking API), open an issue and wait for alignment.
4. New packages should follow [ADR 003](https://github.com/mivaya/Stambha/blob/main/docs/internal/adr/003-plugins-monorepo.md) in the core repo.

## Branching Model

Stambha-plugins uses a **tag-driven release model**. npm packages are not published on PR merge — only when a maintainer publishes a GitHub Release for a version tag.

| Branch / ref | Purpose | npm published? |
|---|---|---|
| `main` | Integration branch — all PRs merge here | No (CI tests only) |
| `feature/*` | Contributor PR branches | No |
| Tag + **published** GitHub Release | Production release | Yes — `publish-npm.yml` → npm |

**Do not** bump `packages/*/package.json` versions in contributor PRs unless a maintainer asks. Each extension package uses **independent** semver (unlike core’s fixed versioning).

## Commit Message Format

This project uses [Conventional Commits](https://www.conventionalcommits.org/). Maintainers group these into `CHANGELOG.md` at release time — commits do **not** auto-bump versions.

| Prefix | When to use | Release notes |
|--------|-------------|---------------|
| `feat:` | New user-facing capability | Minor (for that package) |
| `fix:` | Bug fix | Patch |
| `perf:` | Performance improvement | Patch |
| `docs:` | Documentation only | None required |
| `test:` | Tests only | None required |
| `chore:` | Build, CI, dependencies | None required |
| `feat!:` or `BREAKING CHANGE:` footer | Incompatible API change | Major (for that package) |

Optional scope: package folder or npm name — `cache`, `metrics`, `pagination`, `vault-sql`, `docs`, `ci`.

Do not include `Co-Authored-By` trailers for AI tools in commit messages. Attribution should be limited to human contributors.

**Examples:**

```
feat(pagination): add createPaginator and PaginationSignal
fix(metrics): handle missing rest telemetry listener
docs: document peer range for core 1.2.0
feat(cache)!: rename MemoryCache option defaultTtlMs
```

## Architecture

See [AGENT.md](../AGENT.md) for package layering, peer rules, layout conventions, and how to add a new extension package.

`AGENT.md` is the canonical agent instructions file for this repository. If your coding agent expects a different filename, create a local symlink:

```bash
ln -s AGENT.md CLAUDE.md
ln -s AGENT.md GEMINI.md
ln -s AGENT.md COPILOT.md
```

Core pipeline and native attach details: [Stambha AGENT.md](https://github.com/mivaya/Stambha/blob/main/AGENT.md).

## Package Rules

- **Peer dependencies** on `@stambha/*` core packages — never bundle core.
- **No `@stambha/plugin-*` names** — use capability names (`dashboard`, `i18n`, `cron`).
- Extensions integrate via `@stambha/plugins` (`definePlugin`) when they hook bot lifecycle.
- Do not add third-party Discord client libraries unless the package is explicitly a shape/helper driver.

## Core vs Plugins

| Repo | Versioning | Examples |
|------|------------|----------|
| [Stambha](https://github.com/mivaya/Stambha) | Fixed (one version for all core packages) | `core`, `gateway`, `loader`, `vault`, `plugins` (host) |
| **Stambha-plugins** (this repo) | Independent per package | `cache`, `metrics`, `pagination`, `vault-sql` |

Bug in `@stambha/core` / gateway / loader? Open an issue on the **core** repo. Bug in an extension package? Open it here.

## Adding a New `@stambha/*` Package

1. Create `packages/<name>/` following an existing package layout (`cache`, `metrics`, or `pagination`)
2. Capability name only — not `@stambha/plugin-<name>`
3. Peer on the minimum `@stambha/*` packages you need
4. Add Vitest tests and package `README.md` with a native-stack example
5. Update the root [README](../README.md) package table and [CHANGELOG](../CHANGELOG.md) Unreleased section
6. Maintainer bumps versions and publishes — not in your feature PR

## Pull Request Guidelines

1. Branch off `main`: `git checkout -b feature/my-feature`
2. Open a PR targeting `main` on `Mivaya/Stambha-plugins`
3. CI runs automatically — all checks must pass before merge
4. Keep PRs focused — one feature or fix per PR when possible
5. Fill out the [pull request template](pull_request_template.md) completely
6. Reference related issues in the PR description

**Fork workflow:** add upstream `https://github.com/Mivaya/Stambha-plugins.git`, rebase onto `main` before review:

```bash
git fetch upstream && git rebase upstream/main && git push --force-with-lease
```

Merging to `main` does not publish npm packages — that only happens on a published GitHub Release.

## Release Process (maintainers)

Full detail: [PUBLISHING.md](./PUBLISHING.md).

Tags use `v<package>-<semver>`; GitHub Release titles use `v<semver> — @stambha/<package>` (same `v… — …` flavour as core).

```bash
# 1. Merge feature PRs to main
# 2. Bump selected package(s) + edit CHANGELOG.md
pnpm version:bump 1.1.0 api
git add -A && git commit -m "chore: release @stambha/api 1.1.0"

# 3. Tag and push
git tag vapi-1.1.0 && git push origin vapi-1.1.0

# 4. Create a published GitHub Release
#    Tag:   vapi-1.1.0
#    Title: v1.1.0 — @stambha/api  →  npm publish for that package only
```

- **Stable** — normal release → npm dist-tag `latest`
- **Pre-release** — check “pre-release” on GitHub → npm dist-tag `beta`

## Testing Policy for Pull Requests

Stambha-plugins accepts pull requests only when test coverage is appropriate for the type of change.

- PRs that introduce new behavior must include tests that validate that behavior
- PRs that fix bugs should include a regression test when the bug can be covered realistically
- PRs that modify public APIs, drivers, or Signal/session behavior are expected to include updated or additional tests (Vitest; no Discord token required when possible)
- PRs that do not change observable behavior (docs, formatting, comments, dependency housekeeping, low-risk refactors) may not require new tests
- Even when no new tests are needed, `pnpm build` and `pnpm test` must pass

If a PR does not include new tests, explain why in the PR description. Valid reasons include: no functional behavior changed, existing tests already cover the change, or the change is not meaningfully testable in isolation.

Maintainers may request additional test coverage before approving.

## Review Process

1. A maintainer reviews for design fit, peer-dep correctness, test coverage, and native-stack conventions
2. Address feedback with new commits on your branch
3. Once approved, the PR is merged per maintainer preference

Large PRs may be asked to split into smaller reviewable pieces.

## Community Standards

- Be respectful and patient in issues and reviews
- Assume good intent

## Reporting Security Issues

Please do **not** open public issues for security vulnerabilities. See [SECURITY.md](../SECURITY.md) and use [GitHub private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability) when available.

## Questions

- **Bugs & features (extensions):** [GitHub Issues](https://github.com/Mivaya/Stambha-plugins/issues)
- **Architecture (this repo):** [AGENT.md](../AGENT.md)
- **Core framework:** [mivaya/Stambha](https://github.com/mivaya/Stambha) · [core AGENT.md](https://github.com/mivaya/Stambha/blob/main/AGENT.md)

Thank you for contributing to Stambha-plugins.
