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

## Tests

- **Any feature add or behavior change** should include **matching test updates** (new cases, adjusted mocks/fixtures, or contract coverage where justified). Don’t ship code-only changes without touching tests when behavior is testable.
- **Mocked integration:** `nock` + fake env in tests (see `tests/zephyr-client.test.ts`, `tests/link-tests-to-issues.test.ts`); no real credentials required for `npm test`.
- **Contract:** `tests/contract/` — real API; **requires** env / secrets; optional vars documented in `zephyr-contract.test.ts`. Run only when validating against live Zephyr.

## Docs map

| Doc | Use |
|-----|-----|
| `README.md` | User-facing tools, Docker, config |
| `CLAUDE.md` (or workspace rules) | Short tool list + env + Docker note |
| `docs/ZEPHYR-SCALE-CLOUD-API-GAPS.md` | Implemented vs not, API quirks, EU/404 notes |
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
- **Branch protection** may require PRs (e.g. push via `feat/...` and open a PR from there).

### Pull requests

When opening or preparing a **PR**, include:

1. **Tests updated and run locally** — extend or adjust tests for every feature or behavior change; run **`npm run lint`** (uses **`--max-warnings=0`**), **`npm test`**, and **`npm run typecheck`** (and **`npm run build`** when relevant) on your machine **before** you open the PR. Don’t rely on CI alone to catch failures.
2. **A proper PR description** — what changed, why, how to verify (tools touched, env if new, tests). Not a one-liner unless the change is trivial.
3. **Release notes (Markdown, required format)** — deliver **only the description body** (what you’d put under a release title elsewhere). **Do not** include a top-level **`#` title** (e.g. no `# jira-zephyr-mcp v0.12.0`); the PR or tag already names the version. Structure sections with **`##`** headings, e.g. **`## Summary`**, **`## Fixes`**, **`## New MCP tools`**, **`## Tests`**, **`## Upgrade notes`** — use **`###`** for subsections if needed. **Bullet lists**, optional **tables**, **`**bold**`** as usual. Do **not** add `RELEASE_NOTES.md` to the repo unless asked. Audience: people who **run or integrate** this MCP server: clear and technical. Include user-visible behavior, breaking changes, and version **inside the sections** (e.g. under Summary or Upgrade) when relevant.

## Fork context (short)

- Fork adds **configurable `ZEPHYR_BASE_URL`**, **EU** support, **`update_test_case`** (GET-merge-PUT), and extended tools (folders, environments, executions, issue links, etc.). Upstream: `leorosignoli/jira-zephyr-mcp`.
