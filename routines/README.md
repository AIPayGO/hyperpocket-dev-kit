# Cloud Routines

Version-controlled prompts for scheduled **cloud agents** (claude.ai/code → Routines) that automate Hyperpocket dev hygiene. These are *not* run by `setup.mjs` — a maintainer creates each routine once in the cloud, pasting the prompt from its file below and setting the cron.

**Conventions:**
- Crons are **UTC** (the cloud scheduler uses UTC).
- A routine may POST a summary to a team chat webhook. Where a prompt references `<DEV_DIGEST_WEBHOOK>`, substitute the real URL when creating the routine — **do not commit the webhook URL**. If Hyperpocket has no such webhook yet, drop that step.

| Routine | File | Cron (UTC) | Output | Attended? |
|---|---|---|---|---|
| Nightly learnings harvest | [`nightly-learnings-harvest.md`](nightly-learnings-harvest.md) | `0 6 * * *` (daily 06:00) | PRs (auto-merged) + chat summary | No |
| Weekly docs audit | [`weekly-docs-audit.md`](weekly-docs-audit.md) | `0 9 * * 5` (Fri 09:00) | PRs + chat summary | Review the PRs |

The two docs routines are complementary: the **nightly harvest** keeps CLAUDE.md *complete* (folds new learnings from merged PRs into the docs so agents get smarter over time; auto-merges its doc PR when green), and the **weekly audit** keeps it *accurate and lean* (staleness / contradictions / duplication; never merges — you review its PRs). Keep both. See the canonical workflow ("Shipping & Learning Capture") in [`../templates/monorepo-CLAUDE.md`](../templates/monorepo-CLAUDE.md).
