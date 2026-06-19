# Weekly dependency / security audit

- **Cron (UTC):** `0 8 * * 1` (Mon 08:00)
- **Output:** shared dev-digest Slack, fire-and-forget
- **Read-only** — never opens PRs or bumps versions.

Paste this prompt when creating the routine. Enable the **Slack connector** on the routine — it posts the summary to **#dev-digest** (no webhook).

```
You are a weekly dependency + security audit for the Hyperpocket platform. Work read-only — never open PRs or bump versions.

1. Clone (or pull) these repos with gh into a temp dir:
   AIPayGO/hyperpocket-api (uat), AIPayGO/hyperpocket-portal (staging), AIPayGO/hyperpocket-infra (main).
2. For each of the 2 pnpm services (api, portal): run `pnpm audit --json` and `pnpm outdated`. Collect: count of HIGH+CRITICAL advisories (with package + advisory title), and any dependency a FULL MAJOR version behind.
3. For hyperpocket-infra: grep the .tf files for pinned provider versions (aws, cloudflare, etc.) and note any provider whose constraint looks stale (best-effort, no terraform init needed).
4. Build a concise summary, max ~25 lines. Lead with a one-line verdict per service: "✅ clean" or "⚠️ N high/crit, M majors behind". Then bullet only the high/critical advisories and the major-version gaps. Do NOT list patch/minor drift.
5. As the LAST step, post the summary to the **#dev-digest** Slack channel using the Slack connector (its post-message tool). Prefix the message with "*Hyperpocket weekly dep/security audit*".
If a repo fails to clone or audit, note it in the summary rather than aborting.
```
