## Summary

<!-- What does this PR do? Link issues: Fixes #123 -->

## Type of change

- [ ] Bug fix (non-breaking)
- [ ] New feature (non-breaking)
- [ ] Breaking change (describe migration below)
- [ ] Documentation only
- [ ] Tests only
- [ ] CI / repo config

## Packages touched

- [ ] `@stambha/cache`
- [ ] `@stambha/metrics`
- [ ] `@stambha/vault-sql`
- [ ] New package (describe below)
- [ ] Repo config only

## Motivation

<!-- Why is this change needed? -->

## Breaking changes

<!-- None, or how users should migrate -->

## Checklist

- [ ] `pnpm build` passes locally
- [ ] `pnpm test` passes locally
- [ ] `pnpm lint` passes locally
- [ ] Changeset added (`pnpm changeset`) if publishable packages changed
- [ ] README updated for user-facing changes
- [ ] Peer dependency ranges reviewed against core
- [ ] No secrets or tokens committed

## Test plan

```bash
pnpm install
pnpm build
pnpm test
# pnpm --filter @stambha/metrics test
```
