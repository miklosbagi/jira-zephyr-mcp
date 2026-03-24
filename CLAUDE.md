# Jira Zephyr MCP Server

## MCP Server Configuration

This is an MCP (Model Context Protocol) server that provides integration with JIRA's Zephyr test management system.

### Environment Variables

The following environment variables are required:

- `JIRA_BASE_URL`: Your JIRA instance URL (e.g., https://yourcompany.atlassian.net)
- `JIRA_USERNAME`: Your JIRA email address
- `JIRA_API_TOKEN`: Your JIRA API token (generate from Account Settings > Security > API tokens)
- `ZEPHYR_API_TOKEN`: Your Zephyr Scale API token

### Available Tools

- `read_jira_issue`: Read JIRA issue details and metadata
- `create_test_plan`: Create a new test plan in Zephyr
- `list_test_plans`: List existing test plans
- `create_test_cycle`: Create a new test execution cycle
- `list_test_cycles`: List existing test cycles with execution status
- `execute_test`: Update test execution results
- `get_test_execution_status`: Get test execution progress and statistics
- `remove_test_case_from_cycle`: Remove a test case from a cycle (delete test execution by id or cycle + case key)
- `link_tests_to_issues`: Link a test case to Jira issue(s) as coverage — `POST /testcases/{key}/links/issues` with `{ issueId }` (Jira Cloud numeric id); resolves keys via Jira REST `GET /issue/{key}` (v0.12.0)
- `link_test_cycle_to_issues`: Same for a test cycle — `POST /testcycles/{key}/links/issues`
- `link_test_plan_to_issues`: Same for a test plan — `POST /testplans/{key}/links/issues`
- `get_test_case_links`: List issue and web links — `GET /testcases/{key}/links` (OpenAPI `getTestCaseLinks`)
- `generate_test_report`: Generate test execution report
- `create_test_case`: Create a new test case in Zephyr
- `create_multiple_test_cases`: Create multiple test cases in Zephyr at once
- `search_test_cases`: Search for test cases in a project
- `get_test_case`: Get detailed information about a specific test case
- `archive_test_case` / `unarchive_test_case` / `delete_test_case`: Archive, unarchive, or delete a test case (API support varies by tenant)
- `list_environments` / `get_environment` / `create_environment` / `update_environment`: List and manage Zephyr test environments per project

### Setup Instructions

1. Build the project: `npm run build`
2. Set your environment variables
3. Run: `node dist/index.js`

### Development

- `npm run dev`: Watch mode for development
- `npm run build`: Build the project
- `npm run typecheck`: Check TypeScript types
- `npm run lint`: Lint the code

### Docker releases

Published images (**v0.11.1+**; **`link_tests_to_issues`** fix in **v0.12.0**): final stage is **`gcr.io/distroless/nodejs22-debian13:nonroot`** (Node 22 only, no `npm`/shell). Build stage is **`node:22-bookworm-slim`** with `npm ci`, `npm run build`, and `npm prune --omit=dev` before copying `node_modules` + `dist/` into distroless. **v0.11.0** and earlier used `node:22-bookworm-slim` for runtime too.