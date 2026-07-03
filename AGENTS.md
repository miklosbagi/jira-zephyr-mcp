# Agent instructions — jira-zephyr-mcp

Concise context for AI coding agents. **Keep follow-up questions and edits token-efficient** (see [Token discipline](#token-discipline)).

### Cursor vs Claude

| Tool | `AGENTS.md` |
|------|-------------|
| **Cursor** | Root `AGENTS.md` is often picked up for agent/chat context (depends on version/settings; confirm in Cursor docs). |
| **Claude (Code / Desktop / API)** | **Not** guaranteed to load `AGENTS.md` by default. Rely on **`CLAUDE.md`** for in-repo hints, add **`AGENTS.md`** to project knowledge / custom instructions, or `@`-include it when you need the full rules. |

You do **not** need a separate `.cursor/agent.md` if this file exists at the repo root.

## What this repo is

- **MCP server** (Model Context Protocol, stdio) integrating **Jira Cloud REST v3** and **Zephyr Scale Cloud API v2** (SmartBear).
- **Runtime:** Node **22+**; **build:** `tsup` → `dist/index.js` (+ chunks). Published Docker images use **distroless** Node 22 (see `README.md` / `CLAUDE.md`).
- **Entry:** `src/index.ts` — MCP `Server`, large `TOOLS` list (JSON Schema), `ListTools` / `CallTool` handlers, Zod validation via `validateInput` + `src/utils/validation.ts`.
- **HTTP clients:** `src/clients/jira-client.ts` (basic auth email + API token), `src/clients/zephyr-client.ts` (Bearer `ZEPHYR_API_TOKEN`).
- **Handlers:** `src/tools/*.ts` — one file per domain; wire new tools in `index.ts` (import, `TOOLS` entry, `switch` case) and add Zod schema + types in `validation.ts`.
- **Config:** `src/utils/config.ts` — `dotenv` with **`quiet: true`** (MCP stdio: stdout must stay JSON-RPC only).

## Environment

Required: `JIRA_BASE_URL`, `JIRA_USERNAME`, `JIRA_API_TOKEN`, `ZEPHYR_API_TOKEN`.  
Optional: `ZEPHYR_BASE_URL` (default US Scale API; **EU:** `https://eu.api.zephyrscale.smartbear.com/v2`), `ZEPHYR_TM4J_PROJECT_ID` (TM4J backend edge cases).

## API conventions we follow

- **Zephyr issue linking (coverage):** `POST /testcases|testcycles|testplans/{key}/links/issues` with body **`{ "issueId": <int64> }`** (Jira Cloud numeric issue id). **Do not** use legacy `POST .../links` + `issueKeys` (often **405**).
- Resolve keys: Jira **`GET /rest/api/3/issue/{key}`** (fields can include `id`), then POST to Zephyr.
- **PUT** endpoints often need **full merged bodies** after GET (test cases, cycles, environments) — see existing client methods.
- **Attachments:** No public Scale Cloud v2 routes — do not implement private TM4J/S3 flows without explicit request ([issue #118](https://github.com/miklosbagi/jira-zephyr-mcp/issues/118); gaps doc §22).
- **Execution status:** `execute_test` uses `PASS` | `FAIL` | `WIP` (In progress) | `BLOCKED`; optional `environmentName` on update (v0.18.0). Per-step: **`update_test_execution_test_steps`** (v0.17.0).

## Tests

- **Any feature add or behavior change** should include **matching test updates** (new cases, adjusted mocks/fixtures, or contract coverage where justified). Don’t ship code-only changes without touching tests when behavior is testable.
- **Mocked integration:** `nock` + fake env in tests (see `tests/zephyr-client.test.ts`, `tests/link-tests-to-issues.test.ts`); no real credentials required for `npm test`.
- **Contract:** `tests/contract/` — real API; **requires** env / secrets; optional vars documented in `zephyr-contract.test.ts`. Run only when validating against live Zephyr.

## Docs map

| Doc | Use |
|-----|-----|
| `README.md` | User-facing tools, Docker, config |
| `skills/jira-zephyr-mcp/SKILL.md` | Claude / Agent Skills: workflows + API conventions (MCP still required) |
| `CLAUDE.md` (or workspace rules) | Short tool list + env + Docker note |
| `docs/ZEPHYR-SCALE-CLOUD-API-GAPS.md` | Implemented vs not, API quirks, EU/404 notes |
| `docs/MCP-CURSOR-DOCKER.md` | Cursor/MCP: absolute `docker` path, `PATH`, GitHub MCP `args` |
| `docs/DOCKER-HUB-MCP.md` | Maintainer copy-paste for Docker Hub full description |
| `docs/TESTING-STRATEGY.md` | Test layers and layout |

## Token discipline

When working in this repo **as an agent**:

1. **Prefer targeted reads** — `grep` / semantic search / open **one** file and a **small line range** instead of dumping whole trees or long files.
2. **Avoid re-ingesting** long docs on every turn; if `AGENTS.md` + the task are enough, skip re-reading full `README.md` unless the change is doc-heavy.
3. **Batch independent edits** in a single pass; avoid redundant sequential tool rounds.
4. **Keep responses short** for the user unless they ask for depth; put details in code/comments only when necessary.
5. **While iterating**, prefer **typecheck** or a **single test file** when enough; **before opening a PR**, run **`npm test`** and **`npm run typecheck`** locally (and `npm run build` if the change affects the bundle). See also [Pull requests](#pull-requests).
6. **MCP / live API:** do not assume credentials; contract tests and real Zephyr calls are optional and user-driven.

## Git, branches, and releases

- **Do not push directly to `main`/`master`.** Use a **dedicated branch per topic** (feature, fix, release prep), the way you would for a versioned release — e.g. `feat/…`, `fix/…`, `release/v…`, matching the change set.
- **Version:** keep **`package.json`** and MCP **`version`** in `src/index.ts` in sync when cutting a release.
- **Branch protection** may require PRs (e.g. push via `feat/...` and open a PR from there). For **`main`**, require the **`Quality gate`** CI job (lint, typecheck, `npm run test:coverage`) so merges stay blocked when any step fails.

### Release process (agents)

Use this end-to-end flow for versioned releases on **`miklosbagi/jira-zephyr-mcp`** (fork). Do **not** tag or publish Docker images manually unless automation failed.

1. **Branch** — Put all changes for the release on one branch (e.g. `release/v0.18.0` or a single feature branch). Bump **`package.json`** and **`src/index.ts`** `serverInfo.version` to the target version **before** opening the PR.
2. **Open a PR to `main`** — Write a full description: summary, why, tools touched, test plan, and **release notes body** (see [Pull requests](#pull-requests) below). Use **`gh pr create --repo miklosbagi/jira-zephyr-mcp`** (not upstream `leorosignoli/…`).
3. **Version label on the PR** — Add **exactly one** semver bump label (workflow `.github/workflows/pr-label-version-tag.yml`):
   - **`tag-patch`** — bugfix only (`v0.17.0` → `v0.17.1`)
   - **`tag-minor`** — new features, backward compatible (`v0.17.0` → `v0.18.0`)
   - **`tag-major`** — breaking changes (`v0.17.0` → `v1.0.0`)
   If multiple labels are present, precedence is **major > minor > patch**.
4. **Wait for CI** — **`Quality gate`** must pass (lint, typecheck, `npm run test:coverage`). If it fails, inspect logs, fix on the same branch, push, and re-check. **Retry at most 10 times**; if still failing, stop and report to the user.
5. **Merge the PR** — Only after all required checks are green. Merge creates the merge commit on `main`.
6. **Tag (automatic)** — On merge, **`Version tag from PR label`** creates and pushes **`vX.Y.Z`** from the latest matching tag + label bump. It then **dispatches `docker-release.yml`** to build and publish **`miklosbagi/jira-zephyr-mcp:vX.Y.Z`** and **`:latest`** (Docker Hub + GHCR).
7. **GitHub Release** — After the tag exists, publish a **GitHub Release** for that tag with the same release-notes body as the PR. Enable **discussions** on the release when the API/UI allows (`gh release create … --discussion-category "Announcements"` or set `discussion_category_name` if your repo has categories). Match the style of the previous release (e.g. [v0.17.0](https://github.com/miklosbagi/jira-zephyr-mcp/releases/tag/v0.17.0)): `## Summary`, tool tables, `## Upgrade notes`, compare link `v0.(N-1)…v0.N`.
8. **Verify** — Confirm tag, release, and Docker workflow completed. Tell integrators to `docker pull miklosbagi/jira-zephyr-mcp:latest` (or pin `vX.Y.Z`) and restart the MCP host.

**What the labels mean:** They do **not** set the version in `package.json` directly — they tell CI **how much to bump the git tag** after merge. You must still align `package.json` / MCP version with the **expected** tag (e.g. label `tag-minor` after `v0.17.0` → ship code as **0.18.0**).

**Avoid double tags:** Close or remove **`tag-minor`** / **`tag-patch`** / **`tag-major`** from superseded PRs before merging a release. Each merged labeled PR bumps the tag again (e.g. two `tag-minor` merges in a row → `v0.18.0` then `v0.19.0`). Keep **one** release PR open with the version label.

### Pull requests

When opening or preparing a **PR**, include:

1. **Tests updated and run locally** — extend or adjust tests for every feature or behavior change; run **`npm run lint`** (uses **`--max-warnings=0`**), **`npm run test:coverage`** (thresholds in **`vitest.config.ts`**), **`npm test`**, and **`npm run typecheck`** (and **`npm run build`** when relevant) on your machine **before** you open the PR. Don’t rely on CI alone to catch failures.
2. **A proper PR description** — what changed, why, how to verify (tools touched, env if new, tests). Not a one-liner unless the change is trivial.
3. **Release notes (Markdown, required format)** — deliver **only the description body** (what you’d put under a release title elsewhere). **Do not** include a top-level **`#` title** (e.g. no `# jira-zephyr-mcp v0.12.0`); the PR or tag already names the version. Structure sections with **`##`** headings, e.g. **`## Summary`**, **`## Fixes`**, **`## New MCP tools`**, **`## Tests`**, **`## Upgrade notes`** — use **`###`** for subsections if needed. **Bullet lists**, optional **tables**, **`**bold**`** as usual. Do **not** add `RELEASE_NOTES.md` to the repo unless asked. Audience: people who **run or integrate** this MCP server: clear and technical. Include user-visible behavior, breaking changes, and version **inside the sections** (e.g. under Summary or Upgrade) when relevant.

## Fork context (short)

- Fork adds **configurable `ZEPHYR_BASE_URL`**, **EU** support, **`update_test_case`** (GET-merge-PUT), and extended tools (folders, environments, executions, issue links, etc.). Upstream: `leorosignoli/jira-zephyr-mcp`.
