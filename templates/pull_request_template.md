<!--
Canonical PR template for Hyperpocket repos. Adopt it by copying to a repo's
.github/pull_request_template.md (committed to the default branch so GitHub
seeds it into new PR descriptions). The nightly-learnings-harvest routine reads
the "Learnings for CLAUDE.md" section below.
-->

## What & why

<!-- Brief summary of the change and the reason for it. -->

## How verified

<!-- Tests run (pnpm test / pnpm check / terraform plan), manual checks, staging verification. -->

## Learnings for CLAUDE.md

<!--
Before writing this, actually scan — don't reflexively type None:
  · a non-obvious bug cause   · a contract / field-name / response-shape change
  · a test / mock / seed / FK / migration trap   · a naming or config pitfall
Capture ONLY what clears the bar: non-obvious + reusable + would otherwise be
re-discovered the hard way (same bar as editing CLAUDE.md), naming the target
file/area (e.g. `.claude/rules/x.md`).
"None" is a fine and common answer for routine PRs — the failure mode is typing
None WITHOUT checking, not None itself. Never pad with the obvious-from-the-diff.
-->

-
