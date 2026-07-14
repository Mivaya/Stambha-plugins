# Publishing extensions (`Stambha-plugins`)

Each `@stambha/*` package in this repo has its **own semver**. Releases are **tag-driven** via GitHub Releases (no Changesets).

The [**Stambha**](https://github.com/mivaya/Stambha) core repo uses **fixed** versioning (all core packages share one version) with titles like `v1.2.0 — …`. Extensions use the same **`v… — …`** flavour, but **one release per package**.

---

## Tag + release title

| | Format | Example |
|---|--------|---------|
| **Git tag** | `v<package>-<semver>` | `vapi-1.1.0` |
| **Release title** | `v<semver> — @stambha/<package>` | `v1.1.0 — @stambha/api` |
| **Release notes heading** | Same as the title | `# v1.1.0 — @stambha/api` |

`<package>` is the folder name under `packages/` (`api`, `cache`, `metrics`, `pagination`, `vault-sql`).

Do **not** use monorepo-wide tags like `v1.0.0` for new extension releases (legacy batch tags may still exist). Prefer `v<package>-<semver>` so npm publish stays scoped to the package that changed.

---

## Maintainer release flow

```text
Merge PRs to main
       ↓
Bump the package (+ CHANGELOG Unreleased → version section)
       ↓
git tag v<pkg>-<semver> && git push origin v<pkg>-<semver>
       ↓
GitHub Release (title: v<semver> — @stambha/<pkg>)  →  publish-npm.yml  →  npm (that package only)
```

```bash
# Example: ship @stambha/api 1.1.0
pnpm version:bump 1.1.0 api
# bump packages/api/src/version.ts if present; edit CHANGELOG.md
git add -A && git commit -m "chore: release @stambha/api 1.1.0"
git tag vapi-1.1.0
git push origin main vapi-1.1.0
# Create a *published* GitHub Release:
#   tag:   vapi-1.1.0
#   title: v1.1.0 — @stambha/api
```

Workflow: [`.github/workflows/publish-npm.yml`](./workflows/publish-npm.yml)

On a matching `v<pkg>-<semver>` release tag, CI publishes **only** that package (`package.json` version must match the tag). `workflow_dispatch` still dry-runs / publishes all packages under `packages/*` when you opt in.

### Dist-tags

- **Stable** release → npm dist-tag `latest`
- **Pre-release** (GitHub checkbox) → npm dist-tag `beta`

### Manual publish

Actions → **Publish npm** → workflow_dispatch (dry run by default).

```bash
pnpm build
pnpm test
NPM_TOKEN=... pnpm publish:npm
```

---

## Contributor workflow

1. Change code — **no changeset file**.
2. Do not bump versions in PRs unless a maintainer asks.
3. Update package README for user-facing changes.

---

## Peer dependencies

```json
"peerDependencies": {
  "@stambha/vault": "^1.2.0"
}
```

Bump peer ranges when core ships breaking majors.

---

## npm setup

Same `@stambha` npm org as core. GitHub secret **`NPM_TOKEN`**. Optional **Environment `npm`**.

Every package needs `"publishConfig": { "access": "public" }`.

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| 403 Forbidden | Token lacks `@stambha` scope |
| E404 on publish | `publishConfig.access: public` + valid `NPM_TOKEN` |
| Version already exists | Bump semver in `package.json` |
| Tag / package.json mismatch | Tag `vapi-1.1.0` requires `packages/api/package.json` version `1.1.0` |
| Peer dependency warnings | Align `peerDependencies` with latest core on npm |
