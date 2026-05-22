#!/usr/bin/env node
// hyperpocket-dev-kit setup — cross-platform (Windows / macOS / Linux)
//
// Bootstraps a Hyperpocket dev workspace from a single command:
//   - Clones the 3 service repos (hyperpocket-api, -portal, -infra) into the workspace dir
//   - Installs and enables 7 official Claude Code plugins (superpowers, code-review, etc.)
//   - Clones and enables 2 third-party plugins (impeccable, ui-ux-pro-max)
//   - Registers and enables this kit so its slash commands work
//   - Copies the canonical workspace-root CLAUDE.md to the workspace dir
//
// Usage:
//   node scripts/setup.mjs --root <path>          REQUIRED: where to clone services + drop CLAUDE.md
//   node scripts/setup.mjs --root <path> --no-monorepo-claude   Skip the CLAUDE.md copy step
//   node scripts/setup.mjs --root <path> --no-clone-services    Skip cloning the 3 service repos
//   node scripts/setup.mjs --help                 Show usage
//
// Idempotent: safe to re-run after `git pull` to pick up new plugins.

import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { homedir, platform } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// --- args -------------------------------------------------------------------
const args = process.argv.slice(2);
const printUsage = () => {
  const usage = readFileSync(fileURLToPath(import.meta.url), "utf8")
    .split("\n").filter((l) => l.startsWith("//")).slice(0, 16).join("\n");
  console.log(usage);
};

if (args.includes("--help") || args.includes("-h")) {
  printUsage();
  process.exit(0);
}

const getArg = (name) => {
  const i = args.indexOf(name);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : null;
};

const skipMonorepoClaude = args.includes("--no-monorepo-claude");
const skipCloneServices = args.includes("--no-clone-services");

const rootArg = getArg("--root");
if (!rootArg) {
  console.error("ERROR: --root <path> is required.\n");
  printUsage();
  process.exit(1);
}

// --- paths ------------------------------------------------------------------
const kitRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const workspaceDir = resolve(rootArg);
const userClaude = join(homedir(), ".claude");
const localMarketplace = join(userClaude, "plugins", "marketplaces", "local");
const pluginsDir = join(localMarketplace, "plugins");
const marketplaceJson = join(localMarketplace, ".claude-plugin", "marketplace.json");
const settingsJson = join(userClaude, "settings.json");
const isWindows = platform() === "win32";

console.log("hyperpocket-dev-kit setup");
console.log(`  Kit root:     ${kitRoot}`);
console.log(`  Workspace:    ${workspaceDir}`);
console.log(`  User .claude: ${userClaude}\n`);

// --- helpers ----------------------------------------------------------------
const ensureDir = (p) => mkdirSync(p, { recursive: true });
const sh = (cmd) => execSync(cmd, { stdio: "inherit" });
const sha256 = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");

// Strip a UTF-8 BOM if present (some Windows tools write JSON with a leading
// BOM that JSON.parse rejects).
const readJson = (path) => {
  const raw = readFileSync(path, "utf8");
  return JSON.parse(raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw);
};
const writeJson = (path, obj) =>
  writeFileSync(path, JSON.stringify(obj, null, 2) + "\n", "utf8");

// --- services config (3 hyperpocket service repos) --------------------------
// Cloned into <workspaceDir>/<name>/ on a fresh setup. Idempotent: skipped
// if the target dir already exists. Branch reflects each repo's working
// branch convention: api tracks `uat`, portal tracks `staging`, infra tracks `main`.
const services = [
  { name: "hyperpocket-api",    repo: "https://github.com/AIPayGO/hyperpocket-api.git",    branch: "uat"     },
  { name: "hyperpocket-portal", repo: "https://github.com/AIPayGO/hyperpocket-portal.git", branch: "staging" },
  { name: "hyperpocket-infra",  repo: "https://github.com/AIPayGO/hyperpocket-infra.git",  branch: "main"    },
];

// --- plugins config ---------------------------------------------------------
const plugins = [
  { name: "superpowers",          marketplace: "claude-plugins-official" },
  { name: "code-review",          marketplace: "claude-plugins-official" },
  { name: "commit-commands",      marketplace: "claude-plugins-official" },
  { name: "frontend-design",      marketplace: "claude-plugins-official" },
  { name: "claude-md-management", marketplace: "claude-plugins-official" },
  { name: "skill-creator",        marketplace: "claude-plugins-official" },
  { name: "claude-code-setup",    marketplace: "claude-plugins-official" },
  { name: "wondelai",             marketplace: "claude-plugins-official" },
  { name: "security-review",      marketplace: "claude-plugins-official" },
  {
    name: "impeccable",
    marketplace: "local",
    gitUrl: "https://github.com/pbakaus/impeccable",
    source: "./plugins/impeccable/source",
  },
  {
    name: "ui-ux-pro-max",
    marketplace: "local",
    gitUrl: "https://github.com/nextlevelbuilder/ui-ux-pro-max-skill",
    source: "./plugins/ui-ux-pro-max",
  },
  {
    name: "hyperpocket-dev-kit",
    marketplace: "local",
    isKit: true,
    source: "./plugins/hyperpocket-dev-kit",
  },
];

// 0) Clone the 3 hyperpocket service repos into the workspace dir -------------
// Idempotent: skipped per service if its directory already exists. Failures
// are reported but don't abort the rest of setup — devs may not have access
// to every repo or may prefer to clone manually.
if (!skipCloneServices) {
  ensureDir(workspaceDir);
  for (const s of services) {
    const dest = join(workspaceDir, s.name);
    if (existsSync(dest)) {
      console.log(`${s.name} already present at ${dest}, skipping clone`);
      continue;
    }
    console.log(`Cloning ${s.name} (${s.branch} branch) -> ${dest}`);
    try {
      sh(`git clone --branch ${s.branch} ${s.repo} "${dest}"`);
    } catch {
      console.log(`WARN: failed to clone ${s.name}. Skip with --no-clone-services or clone manually.`);
    }
  }
  console.log("");
}

// 1) Ensure local marketplace structure --------------------------------------
ensureDir(pluginsDir);
ensureDir(dirname(marketplaceJson));

if (!existsSync(marketplaceJson)) {
  console.log("Creating new local marketplace...");
  writeJson(marketplaceJson, {
    name: "local",
    description: "Personal local plugins",
    owner: { name: process.env.USER ?? process.env.USERNAME ?? "user" },
    plugins: [],
  });
}

// 2) Clone third-party plugins; link the kit ---------------------------------
for (const p of plugins.filter((x) => x.marketplace === "local")) {
  const dest = join(pluginsDir, p.name);

  if (p.isKit) {
    if (!existsSync(dest)) {
      console.log(`Linking hyperpocket-dev-kit -> ${kitRoot}`);
      if (isWindows) {
        // Junction (no admin needed for dirs on Windows)
        execSync(`cmd /c mklink /J "${dest}" "${kitRoot}"`, { stdio: "ignore" });
      } else {
        symlinkSync(kitRoot, dest, "dir");
      }
    }
  } else if (!existsSync(dest)) {
    console.log(`Cloning ${p.name} from ${p.gitUrl}...`);
    sh(`git clone ${p.gitUrl} "${dest}"`);
  } else {
    console.log(`${p.name} already present, skipping clone`);
  }
}

// 3) Add entries to local marketplace.json (idempotent) ----------------------
const marketplace = readJson(marketplaceJson);
marketplace.plugins ??= [];
const existingNames = new Set(marketplace.plugins.map((x) => x.name));

for (const p of plugins.filter((x) => x.marketplace === "local")) {
  if (existingNames.has(p.name)) {
    console.log(`marketplace.json already has '${p.name}', skipping`);
    continue;
  }
  marketplace.plugins.push({
    name: p.name,
    description: "Installed by hyperpocket-dev-kit/scripts/setup.mjs",
    version: "1.0.0",
    source: p.source,
    category: "team",
  });
  console.log(`Added '${p.name}' to marketplace.json`);
}
writeJson(marketplaceJson, marketplace);

// 4) Enable plugins in user settings.json (idempotent) -----------------------
if (!existsSync(settingsJson)) writeFileSync(settingsJson, "{}\n", "utf8");
const settings = readJson(settingsJson);
settings.enabledPlugins ??= {};

for (const p of plugins) {
  const key = `${p.name}@${p.marketplace}`;
  if (settings.enabledPlugins[key] !== true) {
    settings.enabledPlugins[key] = true;
    console.log(`Enabled '${key}'`);
  }
}
writeJson(settingsJson, settings);

// 5) Copy workspace-root CLAUDE.md if missing --------------------------------
if (!skipMonorepoClaude) {
  const rootClaudeMd = join(workspaceDir, "CLAUDE.md");
  const templateClaudeMd = join(kitRoot, "templates", "monorepo-CLAUDE.md");

  if (!existsSync(workspaceDir)) {
    console.log(`\nWARN: workspace dir does not exist: ${workspaceDir}`);
    console.log("      Skipping CLAUDE.md install.");
  } else if (!existsSync(rootClaudeMd)) {
    copyFileSync(templateClaudeMd, rootClaudeMd);
    console.log(`Installed workspace-root CLAUDE.md at ${rootClaudeMd}`);
  } else if (sha256(rootClaudeMd) !== sha256(templateClaudeMd)) {
    console.log(`\nWARN: ${rootClaudeMd} differs from the kit's templates/monorepo-CLAUDE.md.`);
    console.log("      Edits to the canonical CLAUDE.md should happen in the kit template, not in the copy.");
    console.log(`      To overwrite: cp "${templateClaudeMd}" "${rootClaudeMd}"`);
  } else {
    console.log("Workspace-root CLAUDE.md already in sync with kit template");
  }
}

console.log("\nDone. Restart any open Claude Code session for changes to apply.");
