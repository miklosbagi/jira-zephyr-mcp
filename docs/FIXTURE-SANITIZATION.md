# Fixture sanitization rules

Fixtures under `tests/fixtures/` are used in **unit tests** with mocked HTTP (nock). They **must not** contain real data from live Zephyr or Jira, so they can be committed to GitHub safely.

## What to sanitize

| Data | Replace with | Example |
|------|--------------|--------|
| Real Jira/Zephyr base URLs | Generic or placeholder | `https://api.zephyrscale.smartbear.com` (generic) or `https://example.atlassian.net` |
| Account IDs, user IDs | Placeholder IDs | `account-id-1`, `user-123` |
| Real display names / emails | Placeholder strings | `Test User`, `test@example.com` |
| Real project keys (if sensitive) | Generic keys | `PROJ`, `CP` (CP is often used as public example) |
| Real test plan/cycle/case keys | Generic keys | `PROJ-P1`, `PROJ-R1`, `PROJ-T1` |
| Tokens, API keys | Placeholder | `test-token`, never real tokens |
| Tenant-specific IDs | Small integers or placeholders | `10000`, `1`, `2` |
| Dates | Fixed or relative | `2024-01-01` or keep if not sensitive |

## Rules

1. **Never commit** responses copied directly from a live system without sanitizing.
2. **Prefer synthetic data**: build minimal JSON that matches the API shape (see Zephyr types in `src/types/zephyr-types.ts`).
3. **Self links**: use generic host or omit; do not include real tenant hostnames.
4. **createdBy / executedBy**: use `{ "accountId": "test-account", "displayName": "Test User" }` or omit.
5. **Project keys**: `CP` is commonly used in public Zephyr examples; otherwise use `PROJ` or `ABC`.

## Fixture inventory (Zephyr)

| Fixture | Purpose | Sanitized |
|---------|---------|-----------|
| testplans-list.json | GET /testplans (list) | Yes – synthetic |
| testplan-get.json | GET /testplans/{key} (single) | Yes – synthetic |
| testcycles-list.json | GET /testcycles (list) | Yes – synthetic |
| testcycle-get.json | GET /testcycles/{key} (single) | Yes – synthetic |
| testcases-search.json | GET /testcases/search | Yes – synthetic |
| testcase-get.json | GET /testcases/{key} | Yes – synthetic |
| testcase-create.json | POST /testcases (response) | Yes – synthetic |
| teststeps-list.json | GET /testcases/{key}/teststeps | Yes – synthetic |
| projects-list.json | GET /projects | Yes – synthetic |
| folders-list.json | GET /folders | Yes – synthetic |
| priorities-list.json | GET /priorities | Yes – synthetic |
| statuses-list.json | GET /statuses | Yes – synthetic |
| testexecution-create.json | POST /testexecutions (response) | Yes – synthetic |
| testexecutions-in-cycle.json | GET /testexecutions?testCycle= | Yes – synthetic |

When adding new fixtures, update this table and ensure no real account IDs, names, or tenant URLs are present.
