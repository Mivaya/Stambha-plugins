# Repository settings (GitHub UI)

Checklist for **Mivaya/Stambha-plugins**. Core org notes: [Stambha ORG_SECURITY.md](https://github.com/mivaya/Stambha/blob/main/.github/ORG_SECURITY.md).

## Actions

**Settings → Actions → General**

- Allow GitHub-owned actions (or org allowlist)
- Workflow permissions: **Read** repository contents

## Pull requests

**Settings → General → Pull Requests**

- Squash merge recommended; auto-delete head branches
- Allow maintainers to update PR branches (optional)

## Branch protection (`main`)

Recommended status checks:

- `Build & test` (CI workflow)
- `dependency-review`

Enable:

- Require PR before merge
- Require CODEOWNERS review (if team exists)
- Require status checks to pass

## Security

**Settings → Security**

- Enable **Private vulnerability reporting**
- Enable **Dependabot alerts** and security updates
- Enable **Dependency graph**

## Pages

Not required for this repo (docs live in [Stambha](https://github.com/mivaya/Stambha/tree/main/docs)).
