# Publishing extensions (`Stambha-plugins`)

This repo uses **[Changesets](https://github.com/changesets/changesets)** with **independent versioning** — each `@stambha/*` package has its own semver.

The [**Stambha**](https://github.com/mivaya/Stambha) core repo uses **fixed** versioning (all core packages share one version).

---

## Contributor workflow

```bash
pnpm changeset
```

Select only the packages you changed. Commit the `.changeset/*.md` file with your PR.

---

## Maintainer release flow

```text
PR with changeset(s)  →  merge to main
       ↓
Release workflow runs changesets/action
       ↓
Opens/updates "Version packages" PR
       ↓
Merge Version packages PR  →  npm publish (@stambha/*)
```

Workflow: [`.github/workflows/release.yml`](./workflows/release.yml)

---

## Peer dependencies

Extension packages declare peers on core, for example:

```json
"peerDependencies": {
  "@stambha/vault": "^0.2.2"
}
```

Bump peer ranges when core ships breaking majors.

---

## npm setup

Same `@stambha` npm org as core. GitHub secret **`NPM_TOKEN`** on this repo (or org-wide). Optional **Environment `npm`** with reviewers on the Release workflow.

### Manual publish (local)

```bash
pnpm changeset
pnpm version-packages
pnpm release
```

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| 403 Forbidden | Token lacks `@stambha` scope |
| Version already exists | Add a new changeset and merge the Version PR |
| Peer dependency warnings | Align `peerDependencies` with latest core on npm |
