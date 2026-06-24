## Git workflow

For every feature or fix:

1. Create a branch off `main` with a descriptive name (e.g. `feat/add-pace-calculator`, `fix/heart-rate-parsing`).
2. Commit changes to that branch — never commit features directly to `main`.
3. Open a GitHub PR with a meaningful title and a description that explains what changed and why. Use `gh pr create`.
4. Do not merge the PR — leave that to the human reviewer.

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues; external PRs are not a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Default label vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
