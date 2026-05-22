# Required Plugins

All Hyperpocket developers should have these plugins enabled in Claude Code.

## Official (`claude-plugins-official`)

| Plugin | Purpose |
|--------|---------|
| `superpowers` | Brainstorming, TDD, systematic debugging, planning, parallel agents |
| `code-review` | PR review |
| `commit-commands` | Commit, push, and open PRs |
| `frontend-design` | UI design direction — style, palette, typography |
| `claude-md-management` | Keep CLAUDE.md files accurate and up to date |
| `skill-creator` | Create new team slash commands |
| `claude-code-setup` | Dev environment setup recommendations |
| `wondelai` | UX audit (`/ux-heuristics`) and retention/engagement design (`/hooked-ux`) — use before shipping portal features |
| `security-review` | Security audit for API routes and payment processor integrations |

## Third-Party (GitHub)

| Plugin | Source | Purpose |
|--------|--------|---------|
| `impeccable` | `pbakaus/impeccable` | UI quality audit — catches AI design anti-patterns; use `/audit`, `/polish`, `/critique` before shipping portal changes |
| `ui-ux-pro-max` | `nextlevelbuilder/ui-ux-pro-max` | 50+ UI styles, 161 color palettes, 57 font pairings — use when building new portal UI from scratch |

## This Kit

| Plugin | Purpose |
|--------|---------|
| `hyperpocket-dev-kit` | Team-specific scaffolding: `/add-api-endpoint`, `/add-payment-processor`, `/new-portal-page` |
