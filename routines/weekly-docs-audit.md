# Weekly docs audit

- **Cron (UTC):** `0 9 * * 5` (Fri 09:00)
- **Output:** PRs (one per repo with real issues) + optional chat summary
- **Never merges** — every change is reviewed via PR.

The accuracy/prune counterpart to the nightly learnings harvest: the harvest *adds* knowledge, this keeps the docs *accurate and lean*. Keep both.

Paste this prompt when creating the routine; substitute `<DEV_DIGEST_WEBHOOK>` (or drop the chat step if Hyperpocket has no webhook).

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
B) each service repo: its CLAUDE.md, plus README.md / RUNBOOK.md if present.

For every file, find ONLY high-confidence problems — verify against the actual repo before flagging:
1. Staleness: a documented path, script, env var, port, or workflow file that no longer exists.
2. Internal contradictions: two sections that disagree.
3. Duplication: the same instruction repeated — consolidate to one.
4. Broken references: links/paths/filenames that don't resolve.

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

OPTIONAL — post a summary to chat as the LAST step (drop if no webhook):
   curl -s -X POST -H 'Content-type: application/json' \
     --data "$(jq -n --arg t "$SUMMARY" '{text:$t}')" \
     <DEV_DIGEST_WEBHOOK>
Prefix with "*Hyperpocket weekly docs audit*" and include the PR links opened (or "no changes needed this week").
```
