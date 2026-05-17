## Summary

Describe the change in plain language. Include product impact, backend impact, and the reason this change is needed.

## Type of Change

- [ ] Feature
- [ ] Bug fix
- [ ] Backend hardening
- [ ] Security hardening
- [ ] Documentation
- [ ] Release / deployment
- [ ] Refactor
- [ ] Test update
- [ ] Dependency or tooling update

## Product and User Impact

Explain what users, operators, or maintainers will notice after this change.

## Backend and Data Impact

| Question | Answer |
|---|---|
| Does this change tRPC procedures, server middleware, or operational endpoints? |  |
| Does this change the database schema or migrations? |  |
| Does this change storage, AI provider, auth, or background-processing behavior? |  |
| Does this introduce new environment variables or secrets? |  |
| Does this affect `/api/health`, `/api/readiness`, or `/api/ready`? |  |

## Validation Evidence

Check every command that was run and paste relevant output or artifact links in the notes below.

- [ ] `pnpm install --frozen-lockfile`
- [ ] `pnpm validate:env`
- [ ] `pnpm validate:env:production`
- [ ] `pnpm check`
- [ ] `pnpm test`
- [ ] `pnpm build`
- [ ] `pnpm run ci`
- [ ] Runtime smoke test: `/api/health`
- [ ] Runtime smoke test: `/api/readiness` or `/api/ready`
- [ ] Docker build and container smoke test
- [ ] Not applicable; this is documentation-only

### Validation Notes

```text
Paste command output summaries, health/readiness responses, or CI links here. Redact secrets.
```

## Screenshots or Recordings

Add screenshots for UI changes. If no visual surface changed, write `Not applicable`.

## Documentation and Release Notes

- [ ] `README.md` updated or verified as still accurate
- [ ] `SETUP.md` updated or verified as still accurate
- [ ] `docs/PRODUCTION_READINESS.md` updated or verified as still accurate
- [ ] `RELEASES.md` updated or verified as still accurate
- [ ] `.env.example` updated when configuration changed
- [ ] Migration or deployment notes added when required

## Security Checklist

- [ ] No secrets, tokens, private media, `.env` files, or credentials are committed
- [ ] New inputs are validated before use
- [ ] Auth and ownership checks are preserved or improved
- [ ] Provider credentials are read from environment or secret stores only
- [ ] Dependency changes are intentional and documented

## Reviewer Focus Areas

List the files or behaviors reviewers should inspect most carefully.

-
-
-

## Deployment Notes

Describe rollout requirements, required secrets, database migrations, rollback considerations, and monitoring checks.

## Related Issues or Follow-Ups

Link related issues, TODOs, or planned follow-up PRs.
