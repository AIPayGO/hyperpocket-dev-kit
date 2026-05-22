# Hyperpocket Workspace

## Repo Structure

This workspace contains three independent git repositories:

| Folder | Repo | Branch | Purpose |
|--------|------|--------|---------|
| `hyperpocket-api/` | `AIPayGO/hyperpocket-api` | `uat` | Hono backend — wallet, ledger, payment processors |
| `hyperpocket-portal/` | `AIPayGO/hyperpocket-portal` | `staging` | SvelteKit admin portal — Cloudflare Pages |
| `hyperpocket-infra/` | `AIPayGO/hyperpocket-infra` | `main` | Terraform IaC — AWS + Cloudflare |

The workspace root is **not** a git repo. Each sub-folder is its own repo with its own history.

## AI Agent Setup

This workspace uses `hyperpocket-dev-kit` for shared slash commands and plugin configuration.

- **Setup:** `node hyperpocket-dev-kit/scripts/setup.mjs --root <workspace-path>`
- **Slash commands available:**
  - `/add-api-endpoint` — scaffold a new Hono route following hyperpocket patterns
  - `/add-payment-processor` — scaffold a new payment processor (ProcessorFactory pattern)
  - `/new-portal-page` — scaffold a SvelteKit page for the portal

Each service also has its own `CLAUDE.md` with deeper context — read it when working in that service.

## Core Domain Concepts

### Double-Entry Ledger

Wallet has two balance fields:
- `balance` — total funds (deposits increment this immediately as pending)
- `availableBalance` — spendable funds (only incremented after settlement, typically T+2)

Never treat these as equal. Withdrawals check `availableBalance`, not `balance`.

### Payment Processor Pattern

- Credentials stored as JSONB per product in the DB — never returned in API responses
- `ProcessorFactory.forProduct(productCode, db)` returns the correct processor instance
- Vault tokens (saved cards) are identified server-side via `isVaultToken` flag — never trust client input

### Product SOA

Hyperpocket is the single source of truth for money across all products (ride, rental, delivery). External apps call the wallet API; they do not touch wallet data directly.

## Engineering Standards

### Code Review

All PRs require a code review before merge. Run `/code-review` before requesting review from a teammate.

### 3-Phase Workflow

1. **Architect** — plan what changes, get approval before coding
2. **Code** — implement the approved plan
3. **Review** — run `/code-review` as background agent; surface findings if real issues found

### Testing

- API: Vitest integration tests in `hyperpocket-api/tests/`
- Portal: `pnpm check` (Svelte type checking) — fix errors you introduce, not pre-existing ones
- Before adding a feature, confirm with the user whether tests are in scope

### Fast-Track (no plan needed)

- Config changes and env var additions
- Copy/text fixes
- Single-file bug fixes where the cause is obvious

### Approved Skills

All developers should have these plugins enabled (see `REQUIRED_PLUGINS.md`):

- `superpowers` — brainstorming, TDD, systematic debugging, parallel agents
- `code-review` — PR review
- `commit-commands` — commit, push, PR
- `frontend-design` + `ui-ux-pro-max` — UI work (portal)
- `impeccable` — UI quality audit before shipping portal changes
- `wondelai` — UX heuristic review (`/ux-heuristics`) and engagement design (`/hooked-ux`) for portal features
- `security-review` — security audit for API routes and payment processor integrations
- `claude-md-management` — keep CLAUDE.md files up to date
- `hyperpocket-dev-kit` — scaffolding commands

### Mandatory Gates

- Run `pnpm test` in `hyperpocket-api/` before pushing API changes
- Run `pnpm check` in `hyperpocket-portal/` before pushing portal changes
- Run `terraform plan` before any infra PR (CI does this automatically)
- Never push directly to `uat` or `staging` without a PR (except hotfixes with team sign-off)

## Service Quick Reference

### hyperpocket-api

- Runtime: Node.js, Hono framework, Drizzle ORM, PostgreSQL
- Package manager: pnpm
- Formatter: Biome (tabs, double quotes)
- Key scripts: `pnpm dev`, `pnpm test`, `pnpm db:migrate`, `pnpm db:studio`
- Logging: Pino — `logger.info({ context }, "message")` (object first, string second)
- Money columns: `numeric(19, 4)` — never float
- New enum values: `ALTER TYPE ... ADD VALUE` migration, then `pnpm db:migrate`
- Redis (BullMQ + cache): `import { Redis } from "ioredis"` (named export)

### hyperpocket-portal

- Runtime: Cloudflare Workers (via SvelteKit adapter-cloudflare)
- Package manager: pnpm
- Stack: SvelteKit 2, Svelte 5, Tailwind v4, DaisyUI v5
- Key scripts: `pnpm dev`, `pnpm build`, `pnpm check`
- API calls: server-side only (`+page.server.ts`, `+server.ts`) — never from browser
- Env vars: `WALLET_API_URL`, `WALLET_API_KEY` (Cloudflare Pages secrets)
- Logging: `@logtail/js` imported as `Browser` — flush before worker terminates
- Timer types: `ReturnType<typeof setTimeout>` not `window.setTimeout`

### hyperpocket-infra

- Tool: Terraform
- AWS account: `535337619334`, region: `ap-southeast-1`
- State: S3 bucket `hyperpocket-terraform-state`
- Apply: `$env:AWS_PROFILE = "hyperpocket"; terraform apply -var-file="terraform.tfvars" -var-file="secrets.tfvars"`
- DB password: `terraform output -raw db_password`
- Cloudflare Pages secrets: managed entirely by Terraform — manual dashboard edits are wiped on next apply
- EC2 SSH: get IP from `terraform output -raw ec2_public_ip`

## Git Strategy

Each service repo is independent. There is no cross-repo commit linking.

- `hyperpocket-api` → branch `uat` → deploys to staging EC2 via PM2
- `hyperpocket-portal` → branch `staging` → auto-deploys to Cloudflare Pages (`hyperpocket-staging`)
- `hyperpocket-infra` → branch `main` → CI applies on merge

Do not push to any service branch without explicit confirmation from the user.
