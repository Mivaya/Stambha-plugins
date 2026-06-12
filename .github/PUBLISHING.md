# Publishing extensions (`Stambha-plugins`)

Each `@stambha/*` package in this repo has its **own semver**. Releases are **tag-driven** via GitHub Releases (no Changesets).

The [**Stambha**](https://github.com/mivaya/Stambha) core repo uses **fixed** versioning (all core packages share one version).

---

## Maintainer release flow

```text
Merge PRs to main
       ↓
Bump versions (+ CHANGELOG):

```bash
pnpm version:bump 0.2.2              # all packages
pnpm version:bump 0.2.2 cache metrics # only selected packages
```
       ↓
git tag v<package>-<semver>  (e.g. vcache-0.2.2) && git push --tags
       ↓
GitHub Release (published)  →  publish-npm.yml  →  npm
```

Workflow: [`.github/workflows/publish-npm.yml`](./workflows/publish-npm.yml)

`pnpm -r publish` uploads **every** package under `packages/*` at its current `package.json` version. Only bump packages you intend to ship; unchanged versions will no-op or fail if already on npm.

### Tag + GitHub Release

Use one release per publish batch, or one per package — ensure `package.json` versions match what you want on npm before publishing.

- **Stable** → npm dist-tag `latest`
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
2. Do not bump versions in PRs unless maintainer asks.
3. Update package README for user-facing changes.

---

## Peer dependencies

```json
"peerDependencies": {
  "@stambha/vault": "^0.2.2"
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
| Peer dependency warnings | Align `peerDependencies` with latest core on npm |
