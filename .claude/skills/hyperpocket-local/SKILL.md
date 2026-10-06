---
name: hyperpocket-local
description: Run and debug Hyperpocket, the local payment gateway (API port 3006, portal 5175, Postgres 5433). Covers HOSTED_PAYMENT_URL/port mismatches, tsx not hot-reloading .env, the Braintree repeat-tokenize failure, webhook_deliveries debugging, WALLET_PRODUCT_SECRET parity, the deferred-charge architecture, branching off uat, and the processorConfig.environment sandbox fallback. Use when working on Hyperpocket or debugging a fairyde payment/webhook path against it.
---

# Hyperpocket (local payment gateway)

Repo: `hyperpocket/` (`hyperpocket-api/` + `hyperpocket-portal/`). API on **3006**, portal on
**5175** (Vite moves on if the port is taken), Postgres on **5433**. fairyde-api itself runs on
**4000**.

- **Start:** `pnpm dev` in `hyperpocket-api/` and `hyperpocket-portal/` separately.
- **`HOSTED_PAYMENT_URL`** in `hyperpocket-api/.env` must match the portal's actual port. If
  checkout hangs in a desktop browser, it is probably pointing at an Android-emulator alias
  (`10.0.2.2`); use `localhost:<port>`.
- **`tsx watch` does not reload `.env`** — restart after any edit. Kill by port
  (`lsof -ti tcp:3006 | xargs kill`), never `pkill -f 'tsx watch'`, which kills every checkout's
  server.
- **"Failed to vault payment method" on a repeat test:** the Braintree sandbox refuses to
  re-tokenize a card already vaulted for that wallet. Use a fresh customer or clear the wallet's
  vault token.
- **Webhooks:** check `webhook_deliveries` first — empty means no `webhooks` row matched that
  `event_type` + `product_id`. `WALLET_PRODUCT_SECRET` in `fairyde-api/.env` must equal the
  webhook row's `secret`, or every delivery silently 401s.
- **Deferred charge:** every Fairyde booking flow tokenizes now and charges later. The checkout
  URL carries `&mode=tokenize`, so the portal calls `/tokenize` (vault, no charge); the
  `payment.tokenized` webhook makes fairyde-api schedule a BullMQ charge job.
- **One-off DB queries:** a throwaway `.mjs` in `hyperpocket-api/` using `pg`; delete it after.

## Branch off `uat`, not `main`

Hyperpocket deploys by tag from `uat`, and `uat` is ahead of `main` (`main` has nothing `uat`
lacks). A PR based on `main` merges cleanly and never deploys. Branch from `origin/uat`, target
`uat`, and check the base before opening the PR. There is no PR CI, so for a money path, run
`/authorize → /capture (partial) → /void → /capture (full) → /refund` against staging before a
prod tag.

## `processorConfig.environment` falls back to SANDBOX silently

`src/modules/payment/processors/factory.ts` and `src/modules/payment/webhook.ts` both do
`cfg.environment === "production" ? "production" : "sandbox"` on an unvalidated jsonb field. Any
value other than the exact string `production` (`"Production"`, `"prod"`, missing) is sandbox,
and production credentials at the sandbox gateway fail as an ordinary auth error. After loading
merchant credentials, read back `processorConfig->>'environment'`; the boot-time
`auditProcessorConfigs()` in `src/modules/payment/startup-audit.ts` also reports it.
