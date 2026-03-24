# JIRA Zephyr MCP Server

An [MCP](https://modelcontextprotocol.io/) server for JIRA and **Zephyr Scale** (test management): create and list test plans/cycles, manage test cases (create, search, update), run and report on test executions, and read JIRA issues. Targets **Zephyr Scale for Jira Cloud**; works with US or EU (and other) Zephyr API endpoints.

**Running it:** Use the published Docker image—no clone or build. Docker pulls the image when needed; you add a small config block to your AI tool (Cursor, Claude, Gemini, Windsurf, etc.). Cloning and building from source is for **developers and contributors** only.

[![Integration tests](https://github.com/miklosbagi/jira-zephyr-mcp/actions/workflows/test.yml/badge.svg)](https://github.com/miklosbagi/jira-zephyr-mcp/actions/workflows/test.yml) · Integration (PR/push)  
[![Zephyr contract](https://github.com/miklosbagi/jira-zephyr-mcp/actions/workflows/contract.yml/badge.svg)](https://github.com/miklosbagi/jira-zephyr-mcp/actions/workflows/contract.yml) · Zephyr contract (daily 6am CET / on demand).

[![Docker Pulls](https://badgen.net/docker/pulls/miklosbagi/jira-zephyr-mcp?icon=docker&label=Docker%20Pulls)](https://hub.docker.com/r/miklosbagi/jira-zephyr-mcp/)
---

## Why this fork?

This repo is a fork of [leorosignoli/jira-zephyr-mcp](https://github.com/leorosignoli/jira-zephyr-mcp). We forked to:

- **Use a configurable Zephyr API base URL** — The upstream server used a hardcoded US endpoint (`api.zephyrscale.smartbear.com`). We need the **EU endpoint** (and optionally others), so we added an optional `ZEPHYR_BASE_URL` environment variable. No code changes required when switching regions.
- **Support updating test cases** — The Zephyr Scale API expects a full payload on PUT. We added an `update_test_case` tool that fetches the existing test case, merges your updates (including custom fields), and sends the full payload so you can update name, objective, custom fields, and more from MCP.

We keep this fork as our base for further extensions (see [Roadmap](#roadmap)).

---

## Sponsorship

**We need sponsor support to keep the autotests running.** Jira is free for small teams, but **Zephyr Scale costs about $10/month**. With income tax and fees, it takes roughly **$17/month** to break even—so the project stays a zero-sum game rather than a monthly cost. The next Zephyr payment is due **April 11, 2026**.

If this MCP server is useful to you, consider sponsoring via the links in the repo sidebar (GitHub Sponsors, Buy Me a Coffee, or Patreon). Thank you.

---

## Quick start — run from Docker Hub (recommended)

Run the server using the published image. Docker will pull `miklosbagi/jira-zephyr-mcp:latest` when needed; no clone or build. Add the block below to your MCP host config (see [AI integrations](#ai-integrations-mcp-hosts) for Cursor, Claude, Gemini, Windsurf) and replace the env values with your own.

```json
{
  "mcpServers": {
    "jira-zephyr": {
      "command": "docker",
      "args": ["run", "--rm", "-i", "-e", "JIRA_BASE_URL", "-e", "JIRA_USERNAME", "-e", "JIRA_API_TOKEN", "-e", "ZEPHYR_API_TOKEN", "-e", "ZEPHYR_BASE_URL", "miklosbagi/jira-zephyr-mcp:latest"],
      "env": {
        "JIRA_BASE_URL": "https://your-domain.atlassian.net",
        "JIRA_USERNAME": "your-email@company.com",
        "JIRA_API_TOKEN": "your-jira-api-token",
        "ZEPHYR_API_TOKEN": "your-zephyr-api-token",
        "ZEPHYR_BASE_URL": "https://eu.api.zephyrscale.smartbear.com/v2"
      }
    }
  }
}
```

- **US Zephyr:** omit `ZEPHYR_BASE_URL` from both `args` and `env`.
- **EU Zephyr:** keep `ZEPHYR_BASE_URL` as above (or your Zephyr base URL).

Image: [Docker Hub — miklosbagi/jira-zephyr-mcp](https://hub.docker.com/r/miklosbagi/jira-zephyr-mcp). Multi-arch: **linux/amd64**, **linux/arm64** (Apple Silicon).

**GitHub Container Registry (same image):** use `ghcr.io/miklosbagi/jira-zephyr-mcp:latest` (or another tag) in place of `miklosbagi/jira-zephyr-mcp:latest` in `args` and in the CLI examples below—`command`, `-e` flags, and `env` stay the same.

---

## AI integrations (MCP hosts)

The same server config (Quick start JSON above) works in any MCP-capable client. Add the `jira-zephyr` entry under `mcpServers` in the config file for your host; use the same `command`, `args`, and `env` (with your real credentials).

| Host | Config file | How to open |
|------|-------------|-------------|
| **Cursor** | `.cursor/mcp.json` (project) or `~/.cursor/mcp.json` (global) | Settings → MCP, or Command Palette → “Open MCP Settings” |
| **Claude Desktop** | `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)<br>`%APPDATA%\Claude\claude_desktop_config.json` (Windows) | Claude Desktop → Settings → Developer → Edit Config |
| **Gemini CLI** | `settings.json` (see [Gemini CLI MCP docs](https://google-gemini.github.io/gemini-cli/docs/tools/mcp-server.html)) | Configure MCP servers in your Gemini CLI settings |
| **Windsurf** | `~/.codeium/windsurf/mcp_config.json` (macOS/Linux)<br>`%USERPROFILE%\.codeium\windsurf\mcp_config.json` (Windows) | Cascade panel → MCPs → Configure (enable MCP in Advanced Settings if needed) |

After editing, restart the app so it picks up the new server. Other MCP hosts (e.g. VS Code with MCP extension, or custom clients) use the same JSON structure: `command` + `args` + `env` for the Docker image.

---

## Running from source (developers & contributors)

Only needed if you’re developing or contributing. Otherwise use the [Quick start](#quick-start--run-from-docker-hub-recommended) above.

| Option | Use when |
|--------|----------|
| **Docker (local build)** | You’re iterating on the image. Same MCP config as Quick start, but use your own image in `args` (e.g. `jira-zephyr-mcp:latest`). Build with `docker build -t jira-zephyr-mcp:latest .` in the repo root. |
| **Node** | You’re debugging or changing code without Docker. Clone the repo, run `npm install` and `npm run build`, then set `"command": "node"` and `"args": ["/path/to/jira-zephyr-mcp/dist/index.js"]` in your MCP config, with the same `env` as Quick start. |

---

## Configuration

Required environment variables:

| Variable | Description |
|----------|-------------|
| `JIRA_BASE_URL` | JIRA base URL (e.g. `https://your-domain.atlassian.net`) |
| `JIRA_USERNAME` | JIRA user email |
| `JIRA_API_TOKEN` | JIRA API token |
| `ZEPHYR_API_TOKEN` | Zephyr Scale API token (JIRA → Apps → Zephyr Scale → API Access Tokens) |

Optional:

| Variable | Description |
|----------|-------------|
| `ZEPHYR_BASE_URL` | Zephyr Scale API base URL. Default: `https://api.zephyrscale.smartbear.com/v2` (US). For EU use `https://eu.api.zephyrscale.smartbear.com/v2`. |

When using the Docker image, pass these via your MCP config’s `env` (as in Quick start). For local development, copy `.env.example` to `.env`. Token creation: [Atlassian API tokens](https://id.atlassian.com/profile) (JIRA) and Zephyr Scale → API Access Tokens in your JIRA instance.

---

## Tools

| Tool | Description |
|------|-------------|
| **read_jira_issue** | Get JIRA issue details (optional fields). |
| **create_test_plan** / **list_test_plans** | Create and list test plans. |
| **create_test_cycle** / **list_test_cycles** | Create and list test cycles. |
| **list_folders** / **create_folder** | List and create folders (for organizing test cases or test cycles). Filter by folderType (TEST_CASE / TEST_CYCLE) and parentId for subfolders. |
| **list_priorities** / **list_statuses** | List test case priorities and statuses (id and name). Use the returned ids when creating or updating test cases. Optional projectKey. |
| **list_environments** / **get_environment** / **create_environment** / **update_environment** | List and manage test environments per project (`GET/POST/PUT /environments`). Use returned names with **create_test_cycle** / **update_test_cycle** (`environment`) and **create_test_execution** (`environmentName`). |
| **list_projects** | List Zephyr-visible projects (id, key, name). Optional `limit`, `startAt` for pagination. Use for projectKey discovery. |
| **list_test_executions_in_cycle** | List test cases and executions in a cycle. |
| **add_test_cases_to_cycle** | Add existing test cases to a test cycle (by cycle key and test case keys). On **EU API** this endpoint often returns 404; use **create_test_execution** instead (one call per test case, status “Not Executed”). |
| **create_test_execution** | Create a test execution (add a test case to a cycle). Use when `add_test_cases_to_cycle` returns 404 (e.g. EU). One call per test case; default status “Not Executed” mimics adding via UI. |
| **remove_test_case_from_cycle** | Remove a test case from a cycle by deleting its test execution (`DELETE /testexecutions/{id}`). Pass **`executionId`** from `list_test_executions_in_cycle`, or **`cycleKey` + `testCaseKey`** to resolve it. If the public API returns 404/405 on your instance, use the Zephyr UI or contact SmartBear. |
| **create_test_case** / **search_test_cases** / **get_test_case** / **update_test_case** / **create_multiple_test_cases** | Full test case lifecycle: create, search, get, update (including custom fields), bulk create. Test script types: STEP_BY_STEP (default), PLAIN_TEXT, CUCUMBER. |
| **archive_test_case** / **unarchive_test_case** / **delete_test_case** | Archive via PUT (`archived` flag), unarchive, or DELETE. **API support varies** — some instances reject `archived` or DELETE; see [ZEPHYR-SCALE-CLOUD-API-GAPS.md](docs/ZEPHYR-SCALE-CLOUD-API-GAPS.md). |
| **list_test_steps** / **create_test_step** / **update_test_step** / **delete_test_step** | Manage test steps for a test case independently (step-by-step scripts). |
| **execute_test** | Update test execution status (PASS/FAIL/WIP/BLOCKED). |
| **get_test_execution_status** | Execution progress and stats for a cycle. |
| **link_tests_to_issues** | Link a test case to Jira issue(s) as **coverage** ([`POST .../testcases/{key}/links/issues`](https://support.smartbear.com/zephyr-scale-cloud/api-docs/#tag/Test-Cases/operation/createTestCaseIssueLink)). Resolves each issue **key** to a numeric id via Jira REST, then calls Zephyr (v0.12.0; replaces the old `POST .../links` + `issueKeys` shape). |
| **get_test_case_links** | List Jira issue links and web links for a test case ([`GET .../testcases/{key}/links`](https://support.smartbear.com/zephyr-scale-cloud/api-docs/#tag/Test-Cases/operation/getTestCaseLinks)). |
| **generate_test_report** | Generate cycle report (JSON or HTML). |

---

## Tool usage examples

**JIRA issue**
```ts
read_jira_issue({ issueKey: "ABC-123" });
read_jira_issue({ issueKey: "ABC-123", fields: ["summary", "status", "assignee"] });
```

**Zephyr projects**
```ts
list_projects();
list_projects({ limit: 20, startAt: 0 });
```

**Test plans**
```ts
create_test_plan({ name: "Release 2.0", projectKey: "ABC", description: "..." });
list_test_plans({ projectKey: "ABC", limit: 50 });
```

**Test cycles**
```ts
create_test_cycle({ name: "Sprint 10", projectKey: "ABC", versionId: "10001", environment: "Production" });
list_test_cycles({ projectKey: "ABC", limit: 25 });
list_test_executions_in_cycle({ cycleId: "ABC-R1" });
add_test_cases_to_cycle({ cycleKey: "ABC-R1", testCaseKeys: ["ABC-T1", "ABC-T2"] });
// If add_test_cases_to_cycle returns 404 (e.g. EU API), use create_test_execution per test case:
create_test_execution({ projectKey: "ABC", testCycleKey: "ABC-R1", testCaseKey: "ABC-T1" });
// Remove from cycle: by execution id, or by cycle + case key
remove_test_case_from_cycle({ executionId: "12345" });
remove_test_case_from_cycle({ cycleKey: "ABC-R1", testCaseKey: "ABC-T1" });
```

**Folders**
```ts
list_folders({ projectKey: "ABC", folderType: "TEST_CASE", limit: 50 });
list_folders({ projectKey: "ABC", parentId: 12345 });  // subfolders of folder 12345
create_folder({ projectKey: "ABC", name: "Regression", folderType: "TEST_CASE" });
create_folder({ projectKey: "ABC", name: "Subfolder", parentId: 12345 });
```

**Priorities and statuses**
```ts
list_priorities({ projectKey: "ABC" });   // or omit projectKey for all
list_statuses({ projectKey: "ABC" });     // use returned id in create_test_case / update_test_case
create_test_case({ projectKey: "ABC", name: "...", priority: "365033" });  // priority/status sent as { id } to API
```

**Environments**
```ts
list_environments({ projectKey: "ABC", limit: 50, startAt: 0 });
get_environment({ environmentId: "101" });  // or key if your API returns one
create_environment({ projectKey: "ABC", name: "Staging", description: "Pre-prod" });
update_environment({ environmentId: "101", name: "Staging EU" });
```

**Test cases and script types**
```ts
create_test_case({ projectKey: "ABC", name: "Login test", objective: "...", testScript: { type: "STEP_BY_STEP", steps: [...] }, customFields: { "Execution": "Manual" } });
create_test_case({ projectKey: "ABC", name: "Free text test", testScript: { type: "PLAIN_TEXT", text: "Manual instructions here." } });
create_test_case({ projectKey: "ABC", name: "BDD scenario", testScript: { type: "CUCUMBER", text: "Given ... When ... Then ..." });  // CUCUMBER if supported by instance
search_test_cases({ projectKey: "ABC", query: "login", limit: 20 });
get_test_case({ testCaseId: "ABC-T123" });
update_test_case({ testCaseId: "ABC-T123", customFields: { "Created On": "2026-03-11" } });
create_multiple_test_cases({ testCases: [...], continueOnError: true });
archive_test_case({ testCaseKey: "ABC-T999" });
unarchive_test_case({ testCaseKey: "ABC-T999" });
delete_test_case({ testCaseKey: "ABC-T999" });  // may 404/405; remove from cycles first
```

**Test steps (step-by-step test cases)**
```ts
list_test_steps({ testCaseKey: "ABC-T123" });
create_test_step({ testCaseKey: "ABC-T123", description: "Click Login", expectedResult: "Form submits", testData: "user@example.com" });
update_test_step({ testCaseKey: "ABC-T123", stepId: 1, expectedResult: "Redirect to dashboard" });
delete_test_step({ testCaseKey: "ABC-T123", stepId: 2 });
```

**Execution and reporting**
```ts
execute_test({ executionId: "12345", status: "PASS", comment: "All passed" });
get_test_execution_status({ cycleId: "67890" });
link_tests_to_issues({ testCaseId: "ABC-T123", issueKeys: ["ABC-456"] });
get_test_case_links({ testCaseId: "ABC-T123" });
generate_test_report({ cycleId: "67890", format: "JSON" });
```

The Zephyr Scale API requires a full body for test case PUT; the server fetches the existing test case and merges your updates before sending.

---

## For developers and contributors

If you’re modifying the server or building the image yourself:

**Prerequisites:** Node.js **22+** (see `engines` in `package.json`), Docker (optional), JIRA with Zephyr Scale, JIRA and Zephyr API credentials.

```bash
git clone https://github.com/miklosbagi/jira-zephyr-mcp.git
cd jira-zephyr-mcp
npm install
npm run build
```

| Script | Purpose |
|--------|---------|
| `npm run build` | Compile TypeScript (server + optional script). |
| `npm run dev` | Build and watch. |
| `npm run lint` | ESLint. |
| `npm run typecheck` | TypeScript check. |
| `npm start` | Run `dist/index.js`. |

To test adding a test case to a cycle via Create Test Execution (e.g. when on EU and `add_test_cases_to_cycle` returns 404): set env (or use `.env`), then `node dist/scripts/test-create-execution.js [projectKey] [testCycleKey] [testCaseKey]` (defaults: CP, CP-R31, CP-T4305).

**Project layout:** `src/index.ts` (MCP server), `src/clients/` (JIRA and Zephyr API clients), `src/tools/` (tool handlers), `src/types/`, `src/utils/` (config, validation). To publish new image versions, see `scripts/push-multi-arch.sh`.

---

## Docker (CLI)

Run the published image (same as Quick start, but from the command line; image is pulled if missing):

```bash
docker run --rm -i \
  -e JIRA_BASE_URL=https://your-domain.atlassian.net \
  -e JIRA_USERNAME=your-email@company.com \
  -e JIRA_API_TOKEN=your-jira-api-token \
  -e ZEPHYR_API_TOKEN=your-zephyr-api-token \
  -e ZEPHYR_BASE_URL=https://eu.api.zephyrscale.smartbear.com/v2 \
  miklosbagi/jira-zephyr-mcp:latest
```

Use `ghcr.io/miklosbagi/jira-zephyr-mcp:latest` instead of the last line if you pull from GHCR.

To build and run from source (contributors): `docker build -t jira-zephyr-mcp:latest .` then use your tag in the command above instead of `miklosbagi/jira-zephyr-mcp:latest`.

---

## Roadmap

Planned additions (no dates; order may change). Based on [Zephyr Scale Cloud API](https://support.smartbear.com/zephyr-scale-cloud/api-docs/) capabilities not yet exposed by this server. See [docs/ZEPHYR-SCALE-CLOUD-API-GAPS.md](docs/ZEPHYR-SCALE-CLOUD-API-GAPS.md) for details.

- [x] **Add test cases to a test cycle** — `add_test_cases_to_cycle` calls `POST /testcycles/{key}/testcases`. On EU API this often returns 404; use **create_test_execution** (one per test case, status “Not Executed”) as a workaround.
- [x] **List test cases or executions in a cycle** — `list_test_executions_in_cycle` lists executions in a cycle (by cycle id/key).
- [x] **Create test execution** — `create_test_execution` creates a test execution (e.g. add test case to cycle with status “Not Executed”).
- [x] **Get single test plan / test cycle** — `get_test_plan` and `get_test_cycle` fetch one plan or cycle by key or ID.
- [x] **Folders** — `list_folders` and `create_folder` (filter by folderType, parentId for hierarchy).
- [x] **Priorities and statuses** — `list_priorities` and `list_statuses` (id and name for create/update test case).
- [x] **Zephyr projects list** — `list_projects` (id, key, name; pagination).
- [x] **Environments** — `list_environments`, `get_environment`, `create_environment`, `update_environment` (v0.10.0).
- [x] **Test case archive / delete** — `archive_test_case`, `unarchive_test_case`, `delete_test_case` (v0.11.0; API caveats in gaps doc).
- [x] **Test steps as separate resource** — `list_test_steps`, `create_test_step`, `update_test_step`, `delete_test_step` (v0.7). Test script types: STEP_BY_STEP (default), PLAIN_TEXT, CUCUMBER.
- [x] **Remove test case from cycle** — `remove_test_case_from_cycle` calls `DELETE /testexecutions/{id}` (resolve via `list_test_executions_in_cycle` or pass `cycleKey` + `testCaseKey`). Official docs may not advertise this; some tenants return 404/405.
- [x] **Test case ↔ Jira issue links (coverage)** — `link_tests_to_issues` uses **`POST /testcases/{key}/links/issues`** with numeric Jira issue id (v0.12.0). `get_test_case_links` lists links (**`GET /testcases/{key}/links`**). Older `POST .../links` + `issueKeys` is not used (405 on current API).
- [ ] **Update test plan / test cycle** — PUT for plans and cycles (rename, dates, status).
- [ ] **Bulk operations** — Bulk execution updates or bulk add-to-cycle (beyond `create_multiple_test_cases`).

---

## Contributing

Fork, create a feature branch, make changes, and open a **draft** pull request until it is ready for review.

---

## Security

- **Docker image (v0.11.1+; issue-link path fix in v0.12.0):** **Build** stage uses **`node:22-bookworm-slim`** with **`apt-get upgrade`** (toolchain only). **Runtime** uses Google’s **[distroless](https://github.com/GoogleContainerTools/distroless) Node 22** (`gcr.io/distroless/nodejs22-debian13:nonroot`): **no bundled `npm`**, no shell, minimal OS, **`nonroot`** user. Only **`npm prune --omit=dev`**’d **`node_modules`** plus **`dist/`** are copied in—so [Docker Scout](https://docs.docker.com/scout/) and similar tools see far fewer findings from **`npm`’s own dependency tree** (`tar`, `minimatch`, `glob`, …) that ship in official `node` images but are unused at runtime. **v0.11.0** and earlier images used `node:22-bookworm-slim` for both stages.
- Do not commit API tokens or credentials.
- Use environment variables for all secrets.
- Rotate tokens periodically and restrict JIRA/Zephyr access as needed.

---

## License

MIT — see [LICENSE](LICENSE).

---

## Support

- **Cursor + Docker:** The MCP log may show pull progress as `[error]` because Docker prints that to **stderr** while the UI treats stderr as errors. That is normal. A real problem is a **JSON parse** / “not valid JSON” line on startup: the MCP protocol requires a clean **stdout** stream. **v0.10.2+** loads dotenv with `quiet: true` so tip output does not break stdio. **v0.11.1+** published images use a **distroless** runtime (see [Security](#security)). **v0.12.0** fixes **`link_tests_to_issues`** to use the documented Zephyr Scale endpoint **`POST /testcases/{key}/links/issues`** with Jira issue ids (see [ZEPHYR-SCALE-CLOUD-API-GAPS.md](docs/ZEPHYR-SCALE-CLOUD-API-GAPS.md)).
- Open a [GitHub issue](https://github.com/miklosbagi/jira-zephyr-mcp/issues) with details and logs (no secrets).
- Upstream: [leorosignoli/jira-zephyr-mcp](https://github.com/leorosignoli/jira-zephyr-mcp).
