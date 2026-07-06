---
name: jira-zephyr-mcp
description: >-
  Use when working with Jira Cloud issues and Zephyr Scale test management (test plans,
  cycles, cases, executions, coverage links) via the jira-zephyr-mcp MCP server. Apply
  when the user mentions Zephyr, test plans/cycles, test cases, test execution, or
  linking tests to Jira issues. Requires the MCP server to be configured in the host;
  this skill is guidance and conventions—not a substitute for the server process.
---

# Jira + Zephyr Scale (MCP)

## Prerequisites

1. **MCP server running** — The host (Claude Desktop, Claude Code, Cursor, etc.) must launch `jira-zephyr-mcp` with valid env: `JIRA_BASE_URL`, `JIRA_USERNAME`, `JIRA_API_TOKEN`, `ZEPHYR_API_TOKEN`. Optional: `ZEPHYR_BASE_URL` (EU: `https://eu.api.zephyrscale.smartbear.com/v2`).
2. **This skill** — Teaches *how* to call tools and avoid common API mistakes. It does not start HTTP or replace MCP.

If tools are unavailable, tell the user to add the server per the project README (Docker Hub image or local build).

## When to use which tools (overview)

| Goal | Typical tools |
|------|----------------|
| Read Jira issue | `read_jira_issue` |
| Zephyr projects / folders / priorities / statuses | `list_projects`, `list_folders`, `list_priorities`, `list_statuses` |
| Test plans | `create_test_plan`, `list_test_plans`, `get_test_plan`, `update_test_plan` |
| Test cycles | `create_test_cycle`, `list_test_cycles`, `get_test_cycle`, `update_test_cycle`, `add_test_cases_to_cycle` |
| Executions | `create_test_execution`, `get_test_execution`, `get_test_execution_links`, `get_test_execution_issue_links`, `get_test_execution_test_steps`, `sync_test_execution_test_steps`, `update_test_execution_test_steps`, `execute_test`, `bulk_execute_tests`, `list_test_executions_in_cycle`, `list_test_executions_nextgen`, `get_test_execution_status`, `remove_test_case_from_cycle`, `generate_test_report` |
| Test cases & steps | `list_folders` (discover folders), `search_test_cases` (list/filter via nextgen), `list_test_cases_nextgen`, `create_test_case`, `get_test_case`, `get_test_case_links`, `update_test_case`, `archive_test_case`, `unarchive_test_case`, `delete_test_case`, `create_multiple_test_cases`, `list_test_steps`, `create_test_step`, `update_test_step`, `delete_test_step` |
| Environments | `list_environments`, `get_environment`, `create_environment`, `update_environment` |
| Coverage (Jira ↔ Zephyr) | `link_tests_to_issues`, `link_test_cycle_to_issues`, `link_test_plan_to_issues` |

Prefer **listing** before **creating** when the user did not give keys/IDs. Use **cursor-paged** tools (`list_test_cases_nextgen`, `list_test_executions_nextgen`) for large result sets.

## Conventions (read this before mutating)

1. **Issue linking** — Zephyr expects **numeric Jira Cloud issue id** in `POST .../links/issues` bodies. The MCP tools `link_*_to_issues` accept **issue keys** and resolve them via Jira; do not invent legacy `issueKeys`-only Zephyr payloads.
2. **Updates that need full bodies** — Test plans, cycles, cases, and environments often use **GET → merge → PUT** on the server. If an update fails with 404/405, the tenant may not expose that route—say so and suggest an alternative (e.g. archive vs delete).
3. **Regions** — Default Zephyr API host is US; EU and others need `ZEPHYR_BASE_URL` set correctly or calls will fail or hit the wrong tenant.
4. **Execution results** — Whole case: **`execute_test`** with `PASS` | `FAIL` | `WIP` (In progress) | `BLOCKED`; optional **`environmentName`** to set or change environment on an existing execution (v0.18.0). Per step: **`update_test_execution_test_steps`** (`steps` array by index; `statusName` e.g. Pass, Fail). Read steps first with **`get_test_execution_test_steps`** when unsure of count/order.
5. **Responses** — Tool results are usually JSON strings in MCP content; parse and present clearly. On `success: false`, surface the `error` field.
6. **Test case discovery** — Cloud has no native text search API. Use **`list_folders`** (`folderType: "TEST_CASE"`) then **`list_test_cases_nextgen`** or **`search_test_cases`** with **`folderId`**. Optional **`query`** on **`search_test_cases`** filters client-side only.

## Known limitations (agents)

| Need | Use instead |
|------|-------------|
| Upload screenshot/GIF evidence to a test execution | **Not supported** — [issue #118](https://github.com/miklosbagi/jira-zephyr-mcp/issues/118). Attach to linked Jira defects or put artifact URLs in `execute_test` **comment**. |
| Change **environment** on an execution in a cycle | **`execute_test`** or **`bulk_execute_tests`** with optional **`environmentName`** (v0.18.0). Also at create: **`create_test_execution`**. Use **`list_environments`** for names. |
| Mark execution **In progress** from Not executed | **`execute_test`** with **`status: "WIP"`** (same as In progress in Zephyr). |
| Set each **step** to Pass/Fail / In progress / Blocked / Not executed | **`update_test_execution_test_steps`** with `statusName` per step (UI labels, e.g. Pass, Fail, In Progress). |
| Set execution back to Not executed | **Not via `execute_test`** — only `PASS` / `FAIL` / `WIP` / `BLOCKED` on update. |
| Server-style ZQL / `GET /testcases/search` text search | **`list_folders`** + **`list_test_cases_nextgen`** / **`search_test_cases`** (`folderId`, optional client-side `query`) |

See `docs/ZEPHYR-SCALE-CLOUD-API-GAPS.md` §22–§23.

For more detail, load `references/zephyr-jira-conventions.md` in this skill folder when debugging linking, EU/US URLs, or update semantics.

## What not to do

- Do not assume CodeQL, GitHub Actions, or repo CI—this skill is for **live Jira/Zephyr** via MCP.
- Do not expose or log API tokens or paste secrets into chat.

## Repository

Upstream patterns and gaps: `https://github.com/miklosbagi/jira-zephyr-mcp` — see `README.md`, `AGENTS.md`, `docs/ZEPHYR-SCALE-CLOUD-API-GAPS.md` for maintainers.
