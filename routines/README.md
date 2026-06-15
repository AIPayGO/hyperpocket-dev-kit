# Cloud Routines

Version-controlled prompts for the scheduled **cloud agents** (claude.ai/code → Routines) that automate Hyperpocket dev hygiene. These are *not* run by `setup.mjs` — a maintainer creates each routine once in the cloud, pasting the prompt from its file below and setting the cron.

This is the same set Fairyde runs (see `fairyde-dev-kit/routines/`), adapted to Hyperpocket's three repos and deploy strategies.

**Conventions:**
- Crons are **UTC** (the cloud scheduler uses UTC; GitHub's own scheduled runs drift up to ~1h).
- All routines POST their summary to the **shared dev-digest Slack** webhook. Substitute the real URL where you see `<DEV_DIGEST_SLACK_WEBHOOK>` when creating the routine — **do not commit the webhook URL**.
- **Hyperpocket and Fairyde share that channel**, so every message is **prefixed with `*Hyperpocket <routine>*`** (Fairyde's are prefixed `*Fairyde …*`) to keep them distinguishable.
- Read-only except the two docs routines and the coverage guardian, which open PRs. The **weekly docs audit** never merges (you review its PRs); the **nightly learnings harvest** auto-merges its docs-only PR once CI is green; the **coverage guardian** self-merges on green CI (you can start it in PR-only mode — see its file).

| Routine | File | Cron (UTC) | Output | Attended? |
|---|---|---|---|---|
| Nightly CI health | [`nightly-ci-health.md`](nightly-ci-health.md) | `0 5 * * *` (daily 05:00) | Slack | No |
| Nightly learnings harvest | [`nightly-learnings-harvest.md`](nightly-learnings-harvest.md) | `0 6 * * *` (daily 06:00) | PRs (auto-merged) + Slack | No |
| Weekly dependency / security audit | [`dependency-security-audit.md`](dependency-security-audit.md) | `0 8 * * 1` (Mon 08:00) | Slack | No |
| Coverage guardian | [`coverage-guardian.md`](coverage-guardian.md) | `0 6 * * 1` (Mon 06:00) | PR + self-merge on green + Slack | No (can start PR-only) |
| Weekly docs audit | [`weekly-docs-audit.md`](weekly-docs-audit.md) | `0 9 * * 5` (Fri 09:00) | PRs + Slack | Review the PRs |

**Per-routine scope vs Fairyde** (differences worth knowing):
- **Nightly CI health** monitors only `hyperpocket-portal`'s nightly `e2e.yml` (01:00 UTC). `hyperpocket-api` has no scheduled workflow, so it's out of scope.
- **Coverage guardian** self-merges on green like fairyde. Because hyperpocket treats tests as opt-in (root `CLAUDE.md`: "confirm with the user whether tests are in scope"), it acts only on genuinely high-value gaps (often "coverage clean — no action"). It rotates `hyperpocket-api` (Vitest) → `hyperpocket-portal` (Playwright); infra is Terraform, out of scope. You can start it in PR-only mode (drop step 4's merge) to build trust first.
- **Dependency / security audit** covers the 2 pnpm services + infra provider pins.

The two docs routines are complementary: the **nightly harvest** keeps CLAUDE.md *complete* (folds new learnings from merged PRs into the docs), and the **weekly audit** keeps it *accurate and lean* (staleness / contradictions / duplication). Keep both. See the canonical workflow ("Shipping & Learning Capture") in [`../templates/monorepo-CLAUDE.md`](../templates/monorepo-CLAUDE.md).
