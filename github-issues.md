# GitHub issues for stellar-agent-kit (copy-paste ready)

Use these in GitHub **Issues** (not PRs). For a PR, you typically *reference* issues with "Fixes #1" in the PR description.

---

## Issue 1 — x402-stellar-sdk dist not built in monorepo, causing module-not-found build errors

**Labels:** `bug`, `help wanted`  
**Type:** Bug

### Description

`packages/x402-stellar-sdk/` exists in the monorepo but its `dist/` is never built before dependent packages resolve it. Any import from `x402-stellar-sdk/server/next` fails at build time with:

```
Error: Cannot find module 'x402-stellar-sdk/server/next'
```

The UI currently works around this by inlining the x402 logic into `ui/lib/x402.ts`, but this means the published package and the actual UI are out of sync.

### Steps to reproduce

1. Clone the repo  
2. `npm install`  
3. `cd ui && npm run build`  

### Expected

Build succeeds. Imports from `x402-stellar-sdk` resolve correctly.

### Actual

Build fails with module-not-found for any `x402-stellar-sdk/*` import.

---

## Issue 2 — test-sdk.mjs imports from packages/stellar-agent-kit/dist, breaks when dist is missing

**Labels:** `bug`, `good first issue`  
**Type:** Bug

### Description

`scripts/test-sdk.mjs` imports directly from `../packages/stellar-agent-kit/dist/index.js`. If a contributor runs the script without having run `npm run build` from the repo root first, the script fails with a file-not-found or module resolution error. New contributors may not know they must build the workspace before running the test script.

### Steps to reproduce

1. Clone the repo  
2. `npm install`  
3. Run `node scripts/test-sdk.mjs` from the repo root (without running `npm run build` first)  

### Expected

Script either runs successfully or prints a clear message like "Run `npm run build` from the repo root first."

### Actual

Script fails with module-not-found or ENOENT for `packages/stellar-agent-kit/dist/index.js`.

---

## Issue 3 — Root package.json name is "stellar-devkit" while README and docs say "stellar-agent-kit"

**Labels:** `bug`, `documentation`  
**Type:** Bug

### Description

The root `package.json` has `"name": "stellar-devkit"` while the README, npm package, and public branding use "stellar-agent-kit". This can cause confusion in workspace resolution, scripts, and when referring to the repo in docs or issues.

### Steps to reproduce

1. Open root `package.json` and note the `name` field  
2. Open `README.md` and search for "stellar-agent-kit" and "stellar-devkit"  

### Expected

Root package name and public naming are consistent (e.g. both "stellar-agent-kit" or both aligned to the same product name).

### Actual

Root package is named "stellar-devkit"; README and npm package are "stellar-agent-kit".

---

## Issue 4 — CLI agent requires GROQ_API_KEY with no fallback or clear error when missing

**Labels:** `bug`, `enhancement`  
**Type:** Bug

### Description

The CLI agent command (`node dist/index.js agent`) depends on `GROQ_API_KEY`. If the key is not set, the agent either fails at runtime with a cryptic error or does not inform the user that they need to set `GROQ_API_KEY` or use `--api-key`. The README mentions it, but the CLI itself should validate and print a helpful message.

### Steps to reproduce

1. Clone the repo and run `npm install` and `npm run build`  
2. Run the agent CLI without setting `GROQ_API_KEY` and without passing `--api-key`  
3. Observe the behavior (e.g. run a tool or ask a question)  

### Expected

CLI prints a clear message: "Set GROQ_API_KEY or pass --api-key to use the agent."

### Actual

CLI fails with an opaque error or does not clearly tell the user how to fix the missing API key.

---

## Issue 5 — Workspace build order can leave MCP or create-app packages with stale or missing dependencies

**Labels:** `bug`, `help wanted`  
**Type:** Bug

### Description

`stellar-devkit-mcp` and `create-stellar-devkit-app` depend on `stellar-agent-kit` (and possibly other workspace packages). Running `npm run build` with `--workspaces --if-present` does not guarantee that `stellar-agent-kit` (and `x402-stellar-sdk`) are built before these dependents. Building or running the MCP server or the scaffolder can then fail with module-not-found for `stellar-agent-kit` or its exports.

### Steps to reproduce

1. Clone the repo  
2. Remove all `dist` folders (e.g. `packages/*/dist`)  
3. Run `npm run build` from the repo root  
4. Run or build the MCP package or run the create-app scaffold  

### Expected

Build order ensures internal packages are built first; MCP and create-app resolve workspace dependencies and run successfully.

### Actual

Build or runtime fails with module-not-found for `stellar-agent-kit` or other workspace packages when using the MCP server or scaffolder.

---

## Issue 6 — test-sdk.mjs imports TESTNET_ASSETS but stellar-agent-kit only exports MAINNET_ASSETS

**Labels:** `bug`, `good first issue`  
**Type:** Bug

### Description

`scripts/test-sdk.mjs` imports `TESTNET_ASSETS` from `packages/stellar-agent-kit/dist/index.js`, but the `stellar-agent-kit` package only exports `MAINNET_ASSETS` from its public API (`src/config/assets.ts` and `src/index.ts`). There is no `TESTNET_ASSETS` export. Running the test script fails at runtime with an error that the export does not exist or is undefined.

### Steps to reproduce

1. Clone the repo  
2. `npm install` and `npm run build`  
3. Run `node scripts/test-sdk.mjs` from the repo root  

### Expected

Script runs and uses testnet asset identifiers for the quote test (or uses MAINNET_ASSETS with a documented workaround for testnet).

### Actual

Script fails with a runtime error when resolving or using `TESTNET_ASSETS` (e.g. export not found or undefined).

---

## Issue 7 — UI package.json name is "orbit" while README and docs call it "reference UI" or stellar-agent-kit

**Labels:** `bug`, `documentation`  
**Type:** Bug

### Description

The `ui/package.json` has `"name": "orbit"` while the main README and CONTRIBUTING refer to the app as the "reference UI" or part of stellar-agent-kit. This naming mismatch can confuse contributors (e.g. which script or workspace to use) and is inconsistent with the rest of the repo branding.

### Steps to reproduce

1. Open `ui/package.json` and note the `name` field  
2. Open `README.md` and search for "reference UI" and "orbit"  

### Expected

Package name and documentation consistently refer to the same app (e.g. "stellar-agent-kit-ui" or "orbit" documented everywhere).

### Actual

Package is named "orbit"; README and CONTRIBUTING say "reference UI" and do not mention "orbit" in the main install/run instructions.

---

## Issue 8 — CONTRIBUTING.md clone URL points to stellar/ org but package.json repos point to codewmilan

**Labels:** `bug`, `documentation`  
**Type:** Bug

### Description

CONTRIBUTING.md tells contributors to clone `https://github.com/stellar/stellar-agent-kit.git`, while all `package.json` repository fields use `git+https://github.com/codewmilan/stellar-agent-kit.git`. If the canonical repo is under one org, the other references are broken or misleading for issues, PRs, and npm package links.

### Steps to reproduce

1. Open CONTRIBUTING.md and note the clone URL in "Getting started"  
2. Open any `packages/*/package.json` and check the `repository.url` field  

### Expected

Clone URL and package repository URLs point to the same canonical GitHub org/repo.

### Actual

CONTRIBUTING uses `github.com/stellar/...`; package.json files use `github.com/codewmilan/...`.

---

## Issue 9 — SECRET_KEY and X402_DESTINATION used with non-null assertion, no validation or clear errors when missing

**Labels:** `bug`, `enhancement`  
**Type:** Bug

### Description

Several places (e.g. `ui/app/page.tsx`, `ui/app/docs/page.tsx`, `packages/stellar-devkit-mcp/src/index.ts`) use `process.env.SECRET_KEY!` or `process.env.X402_DESTINATION!` with TypeScript non-null assertion. If the env var is missing, the app or MCP server can throw at runtime with an opaque error (e.g. from Stellar SDK or downstream code) instead of a clear message like "Set SECRET_KEY in your environment."

### Steps to reproduce

1. Clone the repo and run the UI or MCP without setting `SECRET_KEY` or (where applicable) `X402_DESTINATION`  
2. Trigger code paths that use these values (e.g. open a page that creates StellarAgentKit, or call an MCP tool that needs a destination)  

### Expected

Startup or first use validates required env vars and prints a clear error: e.g. "SECRET_KEY is required. Set it in .env or .env.local."

### Actual

Runtime fails later with a cryptic error (e.g. invalid key format or undefined passed to SDK) when the env var is missing.

---

## Issue 10 — No root .env.example for repo-level scripts and tooling

**Labels:** `enhancement`, `documentation`  
**Type:** Bug

### Description

The repo has `ui/.env.example` and template `.env.example` files inside `create-stellar-devkit-app`, but there is no `.env.example` at the repository root. Contributors running root-level scripts (e.g. `scripts/test-sdk.mjs`) or building from the root may need `SECRET_KEY`, `SOROSWAP_API_KEY`, or other variables with no single reference list. README mentions env vars but does not point to a root example file.

### Steps to reproduce

1. Clone the repo as a new contributor  
2. Look for a root-level `.env.example` or README instructions that list all env vars needed for root/script usage  
3. Run `node scripts/test-sdk.mjs` or root build without knowing which env vars are optional or required  

### Expected

Root has a `.env.example` (or README documents) listing env vars used by root scripts and build (e.g. SECRET_KEY, SOROSWAP_API_KEY), with comments for optional vs required.

### Actual

No root `.env.example`; env var requirements for root-level usage are scattered across README and script comments.

---

## How to use these

1. In your repo, go to **Issues** → **New issue**.  
2. Pick a title and paste the **Description**, **Steps to reproduce**, **Expected**, and **Actual** for that issue.  
3. Add the suggested labels (e.g. Bug, help wanted).  
4. For a PR that fixes one of these, add "Fixes #N" (with the issue number) in the PR description so GitHub auto-closes the issue when the PR is merged.
