# Zephyr Scale Cloud API – Gaps vs MCP Server

This document lists **Zephyr Scale for Jira Cloud API** capabilities that are **not yet implemented** in this MCP server. It is based on the [official API documentation](https://support.smartbear.com/zephyr-scale-cloud/api-docs/) and the [REST API overview](https://support.smartbear.com/zephyr-scale-cloud/docs/en/rest-api/rest-api--overview-.html). Base URL: `https://api.zephyrscale.smartbear.com/v2/`.

---

## What the MCP server already implements

| Area | Implemented |
|------|-------------|
| **Test plans** | Create, list (by projectKey) |
| **Test cycles** | Create, list (by projectKey, optional versionId) |
| **Test executions** | Get one, update status/comment/defects, summary by cycle |
| **Test cases** | Get one, search, create, update, create multiple |
| **Links** | Link test case to Jira issue(s) (POST testcases/{id}/links) |
| **Reporting** | Generate test report for a cycle (JSON/HTML) |

---

## Not implemented (API or common use cases)

### 1. **Add test cases to a test cycle**

- **API:** `POST /testcycles/{testCycleKey}/testcases`
- **Body:** `{ "items": [ { "testCaseKey": "PROJ-1" }, ... ] }`
- **Gap:** The server can create a cycle and create test cases, but there is no tool to add existing test cases to an existing cycle. Required for “create cycle → add tests → run” workflows.
- **Ref:** [Community: add test cases to cycle](https://community.smartbear.com/discussions/zephyrscale/use-zephyr-scale-cloud-api-to-add-existing-test-cases-to-and-newly-created-test-/277335)

### 2. **Get single test plan**

- **API:** `GET /testplans/{testPlanKey}` or by id (if supported).
- **Gap:** Only `list_test_plans` exists; no tool to fetch one test plan by key/id for details or linking.

### 3. **Get single test cycle**

- **API:** `GET /testcycles/{testCycleKey}` (or id).
- **Gap:** The client uses this internally for `generateTestReport`, but there is no MCP tool to get a cycle by key/id (name, description, status, dates, etc.).

### 4. **List test cases (or executions) in a cycle**

- **API:** e.g. `GET /testcycles/{testCycleKey}/testexecutions` (or testcases, depending on API).
- **Gap:** No tool to list which test cases or executions belong to a cycle. Needed to inspect cycle contents and drive execution flows.

### 5. **Create test execution**

- **API:** Likely `POST` to create a new execution (e.g. “run” a test in a cycle).
- **Gap:** Only **update** of an existing execution is implemented (`execute_test`). Creating new executions (e.g. “start run” for a test case in a cycle) is not exposed.

### 6. **Folders**

- **API:** Folder endpoints for organizing test cases (list/create folders, possibly update/delete if documented).
- **Gap:** Test cases can be created with `folderId`, but there is no tool to list folders or create a folder. Users cannot discover valid `folderId` values or create structure via MCP.
- **Ref:** [Community: folder/test case delete](https://community.smartbear.com/discussions/zephyrscale/zephyr-scale-api---how-to-delete-folder--test-case/266801)

### 7. **Zephyr projects**

- **API:** `GET /projects` (with pagination, e.g. `maxResults`, `startAt`).
- **Gap:** No tool to list Zephyr-visible projects. Jira project/versions are used via the Jira client; a Zephyr-specific project list could help with projectKey discovery and validation.

### 8. **Priorities and statuses (lookups)**

- **API:** Likely `GET /priorities`, `GET /statuses` (or similar) for test case metadata.
- **Gap:** Create/update test case accept priority/status ids, but there is no tool to list valid priorities or statuses. Users must get ids from elsewhere.

### 9. **Environments**

- **API:** Environment-related endpoints (list/create if available) for test cycles.
- **Gap:** Cycles can be created with `environment` (string); no tool to list or manage environments. Harder to keep environment values consistent.

### 10. **Test case archive / delete**

- **API:** Archive and/or delete test cases (exact endpoints to be confirmed in API docs; deletion may be async or batch in UI).
- **Gap:** No archive or delete. Only create, read, update, and link are supported.
- **Ref:** [Deleting test cases (UI)](https://support.smartbear.com/zephyr-scale-cloud/docs/en/test-cases/deleting-test-cases.html)

### 11. **Test steps as a separate resource**

- **API:** If the Cloud v2 API exposes e.g. `GET/POST/PUT/DELETE /testcases/{key}/teststeps` for managing steps independently.
- **Gap:** Steps are only supported inline in create/update test case (`testScript.steps`). No dedicated “list/edit/delete steps” for an existing test case if the API supports it.

### 12. **Remove test case from cycle**

- **API:** DELETE or similar for “test case in cycle” association (if documented).
- **Gap:** No tool to remove a test case from a cycle. Only “add to cycle” is missing; “remove from cycle” would complete the lifecycle.

### 13. **Update test plan / Update test cycle**

- **API:** `PUT /testplans/{key}`, `PUT /testcycles/{key}` (if supported).
- **Gap:** Only create and list for plans and cycles. No update (e.g. rename, change dates, status) even if the API allows it.

### 14. **Bulk or batch operations**

- **API:** Any bulk endpoints (e.g. bulk update executions, bulk add to cycle) if present in the docs.
- **Gap:** Only `create_multiple_test_cases` exists. No bulk execution updates or bulk cycle operations exposed.

---

## Summary table

| # | Capability | Typical API | MCP status |
|---|------------|-------------|------------|
| 1 | Add test cases to cycle | POST testcycles/{key}/testcases | Not implemented |
| 2 | Get test plan by key/id | GET testplans/{key} | Not implemented |
| 3 | Get test cycle by key/id | GET testcycles/{key} | Not implemented |
| 4 | List test cases/executions in cycle | GET testcycles/{key}/... | Not implemented |
| 5 | Create test execution | POST (executions) | Not implemented |
| 6 | List/create folders | GET/POST folders | Not implemented |
| 7 | List Zephyr projects | GET projects | Not implemented |
| 8 | List priorities/statuses | GET priorities, statuses | Not implemented |
| 9 | List/manage environments | GET (environments) | Not implemented |
| 10 | Archive/delete test case | Archive + delete (per docs) | Not implemented |
| 11 | Test steps CRUD (if separate) | testcases/{key}/teststeps | Not implemented |
| 12 | Remove test case from cycle | DELETE (if exists) | Not implemented |
| 13 | Update test plan / test cycle | PUT testplans, testcycles | Not implemented |
| 14 | Bulk operations (executions, cycle) | Bulk endpoints (if any) | Not implemented |

---

## References

- [Zephyr Scale for Jira Cloud API](https://support.smartbear.com/zephyr-scale-cloud/api-docs/)
- [REST API (overview)](https://support.smartbear.com/zephyr-scale-cloud/docs/en/rest-api/rest-api--overview-.html)
- [Deleting test cases](https://support.smartbear.com/zephyr-scale-cloud/docs/en/test-cases/deleting-test-cases.html)
