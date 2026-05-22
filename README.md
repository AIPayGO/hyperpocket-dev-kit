# hyperpocket-dev-kit

Shared Claude Code tooling for the Hyperpocket team. Provides:

- **3 slash commands** for scaffolding common patterns
- **Setup script** that bootstraps a new developer's entire Claude Code environment in one step
- **Workspace CLAUDE.md template** with consolidated documentation for all three services

## Quick Start (new developer)

Clone this kit and run setup:

```bash
git clone https://github.com/AIPayGO/hyperpocket-dev-kit.git C:\Work\code\hyperpocket\hyperpocket-dev-kit
node C:\Work\code\hyperpocket\hyperpocket-dev-kit\scripts\setup.mjs --root C:\Work\code\hyperpocket
```

This will:

1. Clone `hyperpocket-api` (branch `uat`), `hyperpocket-portal` (branch `staging`), and `hyperpocket-infra` (branch `main`) into the workspace directory
2. Set up the local Claude Code plugin marketplace (`~/.claude/plugins/marketplaces/local/`)
3. Clone two third-party plugins (`impeccable`, `ui-ux-pro-max`) from GitHub
4. Link this kit as a local plugin
5. Enable all 10 plugins in `~/.claude/settings.json`
6. Copy `templates/monorepo-CLAUDE.md` to the workspace root as `CLAUDE.md`

Restart any open Claude Code session after setup.

## Flags

| Flag | Effect |
|------|--------|
| `--root <path>` | **(required)** Workspace directory. Where services are cloned and CLAUDE.md is dropped. |
| `--no-clone-services` | Skip cloning the 3 service repos (e.g. already cloned manually). |
| `--no-monorepo-claude` | Skip copying `templates/monorepo-CLAUDE.md` to the workspace root. |
| `--help` | Show usage. |

## Manual Setup (if you already have the repos)

```bash
node hyperpocket-dev-kit/scripts/setup.mjs --root C:\Work\code\hyperpocket --no-clone-services
```

## Slash Commands

| Command | What it does |
|---------|-------------|
| `/add-api-endpoint` | Scaffold a new Hono route in `hyperpocket-api` following team patterns (auth, Drizzle, Pino, pagination, money types) |
| `/add-payment-processor` | Scaffold a new payment processor using the `ProcessorFactory` pattern (credentials in DB, webhook handling, vault tokens) |
| `/new-portal-page` | Scaffold a new SvelteKit page in `hyperpocket-portal` (server-side load, wallet API calls, Tailwind/DaisyUI) |

## Plugins Installed

See [REQUIRED_PLUGINS.md](REQUIRED_PLUGINS.md) for the full list and purpose of each plugin.

## Keeping the Kit Up to Date

After pulling new changes from this repo:

```bash
node scripts/setup.mjs --root C:\Work\code\hyperpocket --no-clone-services
```

This is idempotent — safe to run repeatedly. It will add any new plugins without affecting existing configuration.

## Adding New Commands

1. Create a new `.md` file in `commands/` — it becomes the slash command content
2. The command name is the filename without extension (e.g. `my-command.md` → `/my-command`)
3. Commit and push — teammates pick it up by re-running setup

## Structure

```
hyperpocket-dev-kit/
├── .claude-plugin/
│   └── plugin.json          ← marks this repo as a Claude Code plugin
├── commands/
│   ├── add-api-endpoint.md
│   ├── add-payment-processor.md
│   └── new-portal-page.md
├── scripts/
│   └── setup.mjs            ← bootstraps a new dev environment
├── templates/
│   └── monorepo-CLAUDE.md   ← workspace-root CLAUDE.md template
├── REQUIRED_PLUGINS.md
└── README.md
```
