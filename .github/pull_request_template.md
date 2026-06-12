## Summary

<!-- What does this PR do? Link issues: Fixes #123 -->

<!-- stambha-pr-autofill:start -->

> CI will auto-fill packages and changed files on the first push.

<!-- stambha-pr-autofill:end -->

## Type of change

- [ ] Bug fix (non-breaking)
- [ ] New feature (non-breaking)
- [ ] Breaking change (describe migration below)
- [ ] Documentation only
- [ ] Tests only
- [ ] CI / repo config

## Motivation

<!-- Why is this change needed? -->

## Breaking changes

<!-- None, or how users should migrate -->

## Checklist

- [ ] `pnpm build` passes locally
- [ ] `pnpm test` passes locally
- [ ] `pnpm lint` passes locally
- [ ] Version bump deferred to maintainer release (do not bump `package.json` in PRs unless asked)
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
