# Routine: Coverage Guardian (opus, self-PR)

**Why:** the per-PR CI gates catch *mechanical* drift (a new endpoint/route without a
test). This routine is the *judgment* layer — a standing reviewer that finds the
semantic gaps a gate can't (untested flows, hollow tests, critical-path holes) and
closes the single highest-value one each week.

> **Hyperpocket caveat:** unlike fairyde (no human QA), hyperpocket treats tests as
> opt-in — root `CLAUDE.md` says "before adding a feature, confirm with the user whether
> tests are in scope." So this routine runs in **PR-only mode** (opens a green PR and
> pings; it does **not** self-merge). Enable self-merge later only if you want it.

**Create with:** `/schedule` (or the cloud routine UI).
- **Cadence:** weekly — Mon 06:00 UTC, low-traffic window.
- **Model:** opus.
- **Repo per run:** rotate `hyperpocket-api` → `hyperpocket-portal` (infra is Terraform —
  out of scope; it has `terraform plan` in CI, not unit tests).

---

## Routine prompt

```
You are the Coverage Guardian for the Hyperpocket platform. Run once and stop.

GOAL: find the SINGLE highest-value test-coverage gap introduced since your last run,
add a RIGHT-SIZED test for it, and open a green PR. Quality over quantity — one good
test beats ten shallow ones. PR-ONLY: you open the PR and ping; you do NOT merge.

1. SCOPE — pick this week's repo (rotate hyperpocket-api → hyperpocket-portal). Review
   merges to its integration branch since your last Coverage Guardian commit
   (git log since that date). Find coverage gaps, ranked by risk:
   - hyperpocket-api: a new Hono route / payment-processor path / ledger or wallet
     service branch with no Vitest test in tests/. Critical paths = deposit, withdrawal,
     transfer, payment capture/preauth/refund, double-entry balance invariants.
   - hyperpocket-portal: a new +page.server.ts / +server.ts flow or admin page with no
     Playwright spec in e2e/ (per the e2e structure), or a `pnpm check` type hole.
   - a test that EXISTS but is hollow (asserts nothing meaningful).
   Pick the ONE highest-value gap. Do NOT try to cover everything.

2. WRITE the test — happy path + the one or two error paths that actually matter, NOT
   exhaustive. Follow the repo's existing test patterns (api: tests/ Vitest + the
   Postgres recipe in CLAUDE.md; portal: e2e/ Playwright with the mock-api harness). RUN
   IT LOCALLY and confirm it passes AND genuinely exercises the code (no hollow
   assertions). If you cannot get it green locally, STOP — open a GitHub issue describing
   the gap instead of a PR.

3. SELF-REVIEW — run /code-review on your change; fix anything scored 80+.

4. PR (no merge) — branch test/coverage-<area>; commit as
   "Republisys AI Agent <tech-aiagent@republisys.com>" with a
   "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>" trailer; push; open a PR
   into the repo's integration branch (api: uat, portal: staging). Wait for CI. Leave
   the PR open for human review either way — comment with a one-line summary. Never merge.

GUARDRAILS (hard):
- ONE focused PR per run — never a flood of test files.
- NEVER weaken, delete, or .skip() an existing test to make CI pass.
- If no meaningful gap exists this week, post "coverage clean — no action" and stop.

Post a one-line outcome to Slack as the LAST step, either way:
   curl -s -X POST -H 'Content-type: application/json' \
     --data "$(jq -n --arg t "$SUMMARY" '{text:$t}')" \
     <DEV_DIGEST_SLACK_WEBHOOK>
Prefix with "*Hyperpocket coverage guardian*".
```

---

## Notes
- Three layers: per-PR **gates** (`test.yml`, `e2e.yml`) block mechanical drift; this
  **guardian** adds judgment; the root `CLAUDE.md` carries the authoring **guidance**.
- Start (and likely stay) in PR-only mode given hyperpocket's opt-in testing stance.
