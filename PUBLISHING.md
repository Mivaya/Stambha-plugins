# Publishing extensions (`Stambha-plugins`)

This repo uses **[Changesets](https://github.com/changesets/changesets)** with **independent versioning** — each `@stambha/*` package has its own semver (similar to [sapphiredev/plugins](https://github.com/sapphiredev/plugins/tags)).

The [**Stambha**](https://github.com/mivaya/Stambha) core repo uses **fixed** versioning (all core packages share one version).

---

## Contributor workflow

```bash
pnpm changeset
```

Select only the packages you changed. Commit the `.changeset/*.md` file with your PR.

---

## Maintainer release flow

1. Merge PRs with changesets to `main`.
2. **Release** workflow (`.github/workflows/release.yml`) opens/updates a **Version packages** PR.
3. Merge that PR → packages publish to npm under `@stambha/*`.

---

## Peer dependencies

Extension packages declare peers on core, for example:

```json
"peerDependencies": {
  "@stambha/vault": "^0.2.1"
}
```

Bump peer ranges when core ships breaking majors.

---

## npm setup

Same `@stambha` npm org as core. GitHub secret **`NPM_TOKEN`** on this repo (or org-wide). Optional **Environment `npm`** with reviewers.

---

## Manual publish (local)

```bash
pnpm changeset
pnpm version-packages
pnpm release
```
