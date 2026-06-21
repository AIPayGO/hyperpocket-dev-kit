# Nightly learnings harvest

- **Cron (UTC):** `0 6 * * *` (daily 06:00)
- **Output:** one doc PR per repo with real learnings (**auto-merged when CI is green**) + Slack (shared dev-digest) summary
- **Idempotent:** only processes PRs not yet labelled `learnings-harvested`; opens nothing on a quiet night.

Folds new, durable learnings discovered during work back into CLAUDE.md so agents accumulate knowledge over time.

Paste this prompt when creating the routine. Enable the **Slack connector** on the routine — it posts the summary to **#dev-digest** (no webhook).

```
You harvest engineering learnings from recently-merged PRs across the Hyperpocket platform and fold the durable ones into CLAUDE.md, so agents accumulate knowledge over time. Be conservative and LEAN: capture only non-obvious, reusable facts — never restate what the code/git history already shows. Doc PRs auto-merge when green, so the bar for "durable learning" is high.

Repos (use gh): hyperpocket-dev-kit (master), hyperpocket-api (uat), hyperpocket-portal (staging), hyperpocket-infra (main).

For EACH repo:
1. Find candidate PRs: merged in the last 36h AND not carrying the label `learnings-harvested`.
   gh pr list --repo AIPayGO/<repo> --state merged --search "-label:learnings-harvested" --limit 50 --json number,title,mergedAt,body,url
   Skip PRs merged before the window. If none, this repo is done — no PR.
2. For each candidate, extract learnings from TWO sources:
   a) The "## Learnings for CLAUDE.md" section of the PR body (the high-signal source agents fill in). Treat "None"/empty as nothing.
   b) BACKSTOP — scan the PR diff for doc-worthy facts the author did not write down:
      gh pr diff <n> --repo AIPayGO/<repo>
      Doc-worthy = a NEW required env var, a NEW script/command, a deploy/migration/infra nuance, a non-obvious gotcha encoded in a comment or workaround, or a corrected assumption. NOT routine feature code.
3. Decide what is DURABLE (belongs in CLAUDE.md) vs one-off (ignore):
   - Durable: a future agent would repeat the mistake without it. Non-obvious. Stable.
   - One-off: specific to that change, already obvious from the code, or restates a test.
   Resolve WHERE it belongs:
   - Cross-cutting / setup / deploy / config facts → CLAUDE.md (the per-repo CLAUDE.md, or the workspace root template) and the right section.
   - DOMAIN-SPECIFIC depth (a payments/Braintree quirk, a webhook gotcha, a testing pattern) → the matching service .claude/rules/<area>.md if one exists. Keep CLAUDE.md lean; rules files load contextually and are the right home for detail. (Hyperpocket repos have no rules files yet — so today this means either keep it in CLAUDE.md, or propose the FIRST rule file via the new-file path below.)
   - If a learning is domain-specific but NO existing rule file fits, you MAY create a new .claude/rules/<area>.md for it — but a new file is a structural change: see the new-file EXCEPTION under AUTO-MERGE below.
   IMPORTANT — the canonical workspace-root CLAUDE.md is hyperpocket-dev-kit/templates/monorepo-CLAUDE.md; the live workspace root is a COPY of it. Edit the TEMPLATE, never a stray root copy.

For each repo with at least one durable learning, branch from its OWN default/integration branch (api: uat, portal: staging, infra & dev-kit: main/master):
   git fetch origin && git checkout -b docs/nightly-learnings-<date> origin/<that-branch>   (<date> from the latest commit; do not invent one)
   - Make MINIMAL, additive edits to the relevant CLAUDE.md (one concise line/bullet per learning; merge into the right existing section; do not reword unrelated text).
   - Commit as author "Republisys AI Agent <tech-aiagent@republisys.com>" with a "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>" trailer.
   - Open a PR titled "docs: capture learnings from merged PRs (<date>)" into that same branch. Body: one "CAPTURED: <learning> — from #<pr> (<source: PR section | diff backstop>)" line per learning; put anything uncertain under "NEEDS HUMAN DECISION" (do NOT edit those).
   - If the PR touches hyperpocket-dev-kit/templates/monorepo-CLAUDE.md, add: "After merge, re-sync the live workspace root from the template."
   - This is a DOCS-ONLY change — it does not deploy, so target the integration branch directly (no rc/release tag needed). AUTO-MERGE once checks pass:
       gh pr merge <pr-url> --auto --squash --delete-branch
     If the repo has no required checks and the PR is already mergeable, merge directly (drop --auto). Never force-merge a failing/conflicting PR — leave it open and flag it.
     EXCEPTION: if the PR CREATES a new .claude/rules/*.md file, do NOT enable auto-merge — a new rule file is structural. Open it for human review, note "creates new rule file" under NEEDS HUMAN DECISION in the body, and flag it in Slack. Additive edits to an EXISTING CLAUDE.md or rule file auto-merge as normal.
4. Label EVERY candidate PR you processed (whether or not it yielded a learning) so it is never re-harvested:
   gh pr edit <n> --repo AIPayGO/<repo> --add-label learnings-harvested
   (Create the label once per repo if missing: gh label create learnings-harvested --repo AIPayGO/<repo> --color BFD4F2 --description "Learnings already folded into CLAUDE.md" || true)

As the LAST step, post a summary to the **#dev-digest** Slack channel using the Slack connector (its post-message tool). Prefix with "*Hyperpocket nightly learnings harvest*". List the doc PRs opened/merged (with links) and the count of PRs harvested, or "no new learnings tonight".
```
