# Weekly docs audit

- **Cron (UTC):** `0 9 * * 5` (Fri 09:00)
- **Output:** PRs (one per repo with real issues) + Slack (shared dev-digest) summary
- **Never merges** — every change is reviewed via PR.

The accuracy/prune counterpart to the nightly learnings harvest: the harvest *adds* knowledge, this keeps the docs *accurate and lean*. Keep both.

Paste this prompt when creating the routine. It posts to **#dev-digest** via the **claude-bot Incoming Webhook** (so the sender is claude-bot, not you) — do NOT enable the Slack connector. In the cloud routine, replace the `<DEV_DIGEST_WEBHOOK_URL>` placeholder in the prompt with the real claude-bot webhook URL (never commit the real URL).

```
You are a weekly documentation-accuracy pass for the Hyperpocket platform. Keep CLAUDE.md and core docs ACCURATE and LEAN — do not rewrite them. Every change is reviewed via PR; you NEVER merge.

Repos (clone with gh) and their integration branch — branch from a freshly-fetched origin/<branch> so the PR is not cut from a stale base (a stale base makes the diff show phantom unrelated changes):
  - hyperpocket-dev-kit  → master
  - hyperpocket-api      → uat
  - hyperpocket-portal   → staging
  - hyperpocket-infra    → main
For each repo:  git fetch origin && git checkout -b docs/weekly-md-audit-<date> origin/<that-branch>

Scope — only these files:
A) hyperpocket-dev-kit:
   - templates/monorepo-CLAUDE.md  ← this IS the canonical workspace-root CLAUDE.md. The live workspace root is a COPY of it; there is no separate root repo.
   - README.md, REQUIRED_PLUGINS.md
   - commands/add-api-endpoint.md, commands/add-payment-processor.md, commands/new-portal-page.md
B) each service repo: its CLAUDE.md, plus README.md / RUNBOOK.md if present, plus any .claude/rules/*.md (none exist today — include them automatically once a repo starts using rules files).

For every file, find ONLY high-confidence problems — verify against the actual repo before flagging:
1. Staleness: a documented path, script, env var, port, or workflow file that no longer exists.
2. Internal contradictions: two sections that disagree.
3. Duplication: the same instruction repeated — consolidate to one.
4. Broken references: links/paths/filenames that don't resolve.
5. Redundancy / capability-compensating content: a note that exists only to hand-hold a weaker model — generic best-practice ("use strict mode", "avoid any", generic git explanations), over-narrated workflow, or anything a competent engineer/model would do by default. Propose REMOVING these. CRITICAL distinction: only cut content DERIVABLE from the repo + general knowledge. NEVER cut project-specific facts (ports 3006/5175/5433, HOSTED_PAYMENT_URL/host-alias gotchas, the WALLET_PRODUCT_SECRET↔webhook-secret match, Braintree re-vault behaviour, deploy/branch mechanics) — those stay regardless of how capable the model is. If you cannot clearly classify a line as generic vs project-specific, leave it and list it under NEEDS HUMAN DECISION rather than removing it.

DEV-KIT–SPECIFIC checks (scripts/setup.mjs is the source of truth):
- REQUIRED_PLUGINS.md must match the `plugins` array in setup.mjs (names + count). Flag any mismatch.
- README.md's "what gets cloned" must match the `services` array in setup.mjs (3 repos: hyperpocket-api @ uat, hyperpocket-portal @ staging, hyperpocket-infra @ main).
- commands/*.md: sanity-check the patterns they prescribe still match how the corresponding service does it today. If unsure, do NOT edit — list under NEEDS HUMAN DECISION.

Do NOT reword for style, restructure, change tone, or "improve" wording that is already correct. Minimal, conservative edits only.

For each repo with real issues:
- Branch docs/weekly-md-audit-<date> off freshly-fetched origin/<that-branch> (derive <date> from the latest commit; don't invent one).
- Commit as author "Republisys AI Agent <tech-aiagent@republisys.com>" with a "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>" trailer.
- Open a PR into that same branch titled "docs: weekly CLAUDE.md accuracy pass". Body lists each edit as "FIXED: <what> — <evidence>"; uncertain items go under "NEEDS HUMAN DECISION".
- If the PR touches hyperpocket-dev-kit/templates/monorepo-CLAUDE.md, add a reminder line to the PR body: "After merge, re-sync the live workspace root from the template."
- This is a DOCS-ONLY change — it does not deploy, so target the integration branch directly (no rc/release tag needed). No real issues in a repo → no PR for it.

Also list (do NOT edit) any other *.md you noticed looks stale, so a human can decide — never silently expand scope.

As the LAST step, post a summary to **#dev-digest** via the claude-bot Incoming Webhook (do NOT use the Slack connector), prefixed with "*Hyperpocket weekly docs audit*", including the PR links opened (or "no changes needed this week"). Write the summary as Slack mrkdwn to /tmp/digest.txt, then run:
  WEBHOOK="<DEV_DIGEST_WEBHOOK_URL>"
  python3 -c 'import json;print(json.dumps({"text":open("/tmp/digest.txt").read()}))' > /tmp/digest.json
  curl -sS -X POST -H "Content-type: application/json" --data @/tmp/digest.json "$WEBHOOK"
A response body of "ok" means it posted as claude-bot; on anything else, report it and do not blind-retry.
```
