# Zephyr Scale Cloud API – Gaps vs MCP Server

This document lists **Zephyr Scale for Jira Cloud API** capabilities that are **not yet implemented** in this MCP server. It is based on the [official API documentation](https://support.smartbear.com/zephyr-scale-cloud/api-docs/) and the [REST API overview](https://support.smartbear.com/zephyr-scale-cloud/docs/en/rest-api/rest-api--overview-.html). Base URL: `https://api.zephyrscale.smartbear.com/v2/`.

---

## What the MCP server already implements

| Area | Implemented |
|------|-------------|
| **Test plans** | Create, list (by projectKey) |
| **Test cycles** | Create, list (by projectKey, optional versionId) |
| **Test executions** | Create (add test case to cycle), get one, update status/comment/defects, list in cycle, summary by cycle |
| **Test cases** | Get one, search, create, update, create multiple |
| **Folders** | List (by projectKey, optional folderType, parentId), create (with optional parentId, folderType) |
| **Priorities / statuses** | List priorities and statuses (GET /priorities, GET /statuses; optional projectKey) for test case create/update |
| **Links** | Link test case to Jira issue(s) (POST testcases/{id}/links) |
| **Reporting** | Generate test report for a cycle (JSON/HTML) |

---

## Not implemented (API or common use cases)

### 1. **Add test cases to a test cycle**

- **API (documented):** `POST /testcycles/{testCycleKey}/testcases`
- **Body:** `{ "items": [ { "testCaseKey": "PROJ-1" }, ... ] }`
- **MCP status:** Implemented (`add_test_cases_to_cycle`, v0.4). The API is documented in [Zephyr Scale Cloud API docs](https://support.smartbear.com/zephyr-scale-cloud/api-docs/) (Test Cycles). In practice the endpoint can return 404 (“path doesn’t exist”) in some setups—e.g. EU base URL vs US, or when using a cycle key from **list** vs a key from **create**. If you create a cycle via the API and use the returned `key` immediately to add test cases, that flow is the one documented; keys from `GET /testcycles` may or may not be accepted depending on environment.
- **Ref:** [Community: add test cases to cycle (same path, 404 reported)](https://community.smartbear.com/discussions/zephyrscale/use-zephyr-scale-cloud-api-to-add-existing-test-cases-to-and-newly-created-test-/277335)

### 2. **Get single test plan**

- **API:** `GET /testplans/{testPlanKey}` or by id (if supported).
- **MCP status:** Implemented (`get_test_plan`). Fetches one test plan by key or ID. Use `planKey` (e.g. `CP-P1` or numeric id).

### 3. **Get single test cycle**

- **API:** `GET /testcycles/{testCycleKey}` (or id).
- **MCP status:** Implemented (`get_test_cycle`, v0.8). Fetches one test cycle by key or ID (name, description, status, dates, executionSummary, etc.). Use `cycleKey` (e.g. `CP-R34` or numeric id).

### 4. **List test cases (or executions) in a cycle**

- **API:** `GET /testexecutions?testCycle={cycleId}` (path `/testcycles/{id}/testexecutions` may not exist on all regions).
- **MCP status:** Implemented (`list_test_executions_in_cycle`, v0.4). Lists executions in a cycle by cycle id or key.

### 5. **Create test execution**

- **API:** `POST /testexecutions` with `projectKey`, `testCaseKey`, `testCycleKey`, `statusName` (e.g. “Not Executed”).
- **MCP status:** Implemented (`create_test_execution`, v0.4). Use to add a test case to a cycle by creating an execution with status “Not Executed”—this is the **recommended workaround when `add_test_cases_to_cycle` returns 404** (e.g. on EU API). Verified on EU.

### 6. **Folders**

- **API:** `GET /folders` (projectKey, folderType, parentId, pagination), `POST /folders` (projectKey, name, parentId?, folderType?).
- **MCP status:** Implemented (`list_folders`, `create_folder`, v0.5). List with optional folderType (TEST_CASE / TEST_CYCLE) and parentId for subfolders; create with optional parentId and folderType. Enables coherent folder structure for test cases and cycles; use returned folder `id` as `folderId` when creating/updating test cases.
- **Ref:** [Community: folder/test case delete](https://community.smartbear.com/discussions/zephyrscale/zephyr-scale-api---how-to-delete-folder--test-case/266801)

### 7. **Zephyr projects**

- **API:** `GET /projects` (with pagination, e.g. `maxResults`, `startAt`).
- **MCP status:** Implemented (`list_projects`, v0.8). Lists Zephyr-visible projects (id, key, name) with optional `limit` (default 50) and `startAt` (default 0) for projectKey discovery and validation.

### 8. **Priorities and statuses (lookups)**

- **API:** `GET /priorities`, `GET /statuses` (optional projectKey).
- **MCP status:** Implemented (`list_priorities`, `list_statuses`, v0.6). Returns id and name for each; use these ids when creating or updating test cases (priority, status fields). Create test case sends priority/status as `{ id: <id> }` so the API accepts them (v0.6.1).

### 9. **Environments**

- **API:** Environment-related endpoints (list/create if available) for test cycles.
- **Gap:** Cycles can be created with `environment` (string); no tool to list or manage environments. Harder to keep environment values consistent.

### 10. **Test case archive / delete**

- **API:** Archive and/or delete test cases (exact endpoints to be confirmed in API docs; deletion may be async or batch in UI).
- **Gap:** No archive or delete. Only create, read, update, and link are supported.
- **Ref:** [Deleting test cases (UI)](https://support.smartbear.com/zephyr-scale-cloud/docs/en/test-cases/deleting-test-cases.html)

### 11. **Test steps as a separate resource**

- **API:** Cloud v2 exposes `GET/POST/PUT/DELETE /testcases/{key}/teststeps` for managing steps independently.
- **MCP status:** Implemented (v0.7). `list_test_steps`, `create_test_step`, `update_test_step`, `delete_test_step`. Steps are normalized (description, expectedResult, testData) regardless of API field names (step/data/result). Test script types supported in create/update test case: **STEP_BY_STEP** (default when steps provided), **PLAIN_TEXT** (free text), **CUCUMBER** (BDD/Gherkin; support may vary by instance).

### 11b. **Setting test script type to BDD (Gherkin) via public API**

- **Observed behaviour:** Plain text works via Scale API `PUT /testcases/{key}/testscript` with `{ plainScript: { text } }`. The same endpoint accepts `{ bddScript: { text } }` (no error) but the test case remains **Step-by-step** in the UI; the script type is not changed.
- **UI behaviour:** When switching to BDD in the Zephyr UI, the browser calls **TM4J app backend** `PUT https://eu.app.tm4j.smartbear.com/backend/rest/tests/2.0/testcase/{id}` with body `{ id, projectId, testScript: { bddScript: { text } } }`. That backend is not the public Scale API; calling it with the same Bearer token returns **404 Tenant could not be found** (tenant likely resolved from session/cookies in the browser).
- **What users report:** Community threads ([Create test script](https://community.smartbear.com/discussions/zephyrscale/api-documentation-for-create-test-script/215537), [Step-by-step vs Plain text](https://community.smartbear.com/discussions/zephyrscale/does-zephyr-support-both-test-script-types-step-by-step-and-plain-text-for-same-/219729)) describe the **Create test script** endpoint with a `type` parameter (e.g. `"steps"`); examples for multiple steps or non-steps types are limited. No clear success stories for setting BDD via the **public** Scale API only.
- **Other product (Zephyr Squad Cloud):** The [BDD Content API](https://zephyr-squad-cloud-v1.sb-docs.com/en/zephyr-squad-cloud-rest-api/bdd-content-api) uses a different base URL (`prod-api.zephyr4jiracloud.com`), works with issues that have labels `BDD_Feature` / `BDD_Scenario`, and uses Jira issue ID (not test case key). That is a different product/API from Zephyr Scale.
- **Conclusion / workaround:** With the **public Zephyr Scale API** (api.zephyrscale.smartbear.com) we can create test cases and set **plain text** script; **BDD** type appears to be applied only via the **TM4J app backend**, which is not reliably callable with the same API token (tenant/404). Workaround: create the test case via API, then set script type to BDD and paste Gherkin content **manually in the UI**, or use a different integration (e.g. Atlassian Connect–style endpoint or session-based auth) if available.

### 12. **Remove test case from cycle**

- **API (used):** `DELETE /testexecutions/{executionId}` — removing the execution removes the test case from the cycle (same net effect as the UI in typical setups).
- **MCP status:** Implemented (`remove_test_case_from_cycle`). Pass **`executionId`** from `list_test_executions_in_cycle`, or **`cycleKey` + `testCaseKey`** to resolve a single matching execution. If more than one execution exists for the same case in the cycle, you must pass **`executionId`**.
- **Caveat:** The public API reference does not always list this operation; some tenants return **404/405**. The Zephyr UI may use other backends for bulk removal; this tool targets the Scale Cloud v2 REST surface only.

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
| 1 | Add test cases to cycle | POST testcycles/{key}/testcases | Implemented (v0.4); 404 in some envs |
| 2 | Get test plan by key/id | GET testplans/{key} | Implemented (`get_test_plan`, v0.8) |
| 3 | Get test cycle by key/id | GET testcycles/{key} | Implemented (`get_test_cycle`, v0.8) |
| 4 | List test cases/executions in cycle | GET testexecutions?testCycle=... | Implemented (v0.4) |
| 5 | Create test execution | POST testexecutions | Implemented (v0.4; workaround for add-to-cycle on EU) |
| 6 | List/create folders | GET/POST folders | Implemented (v0.5) |
| 7 | List Zephyr projects | GET projects | Implemented (`list_projects`, v0.8) |
| 8 | List priorities/statuses | GET priorities, statuses | Implemented (v0.6) |
| 9 | List/manage environments | GET (environments) | Not implemented |
| 10 | Archive/delete test case | Archive + delete (per docs) | Not implemented |
| 11 | Test steps CRUD | testcases/{key}/teststeps | Implemented (v0.7) |
| 12 | Remove test case from cycle | DELETE /testexecutions/{id} | Implemented (`remove_test_case_from_cycle`; API support varies by tenant) |
| 13 | Update test plan / test cycle | PUT testplans, testcycles | Not implemented |
| 14 | Bulk operations (executions, cycle) | Bulk endpoints (if any) | Not implemented |

---

## Known issues (with evidence)

These are limitations or bugs we have confirmed and for which we have references (community threads, API behaviour).

### BDD script type cannot be set via the public Scale API

- **Conclusion:** The public Zephyr Scale API does not switch a test case’s script type to BDD. Sending `PUT /testcases/{key}/testscript` with `{ bddScript: { text } }` is accepted (no error) but the UI stays Step-by-step. The UI uses the **TM4J app backend** (`eu.app.tm4j.smartbear.com/backend/rest/tests/2.0/testcase/{id}`) to set BDD; calling that backend with the same Bearer token returns **404 Tenant could not be found**.
- **References:**
  - [API Documentation for Create test script](https://community.smartbear.com/discussions/zephyrscale/api-documentation-for-create-test-script/215537) — describes Create test script with limited examples for script types.
  - [Step-by-step vs Plain text (same test case)](https://community.smartbear.com/discussions/zephyrscale/does-zephyr-support-both-test-script-types-step-by-step-and-plain-text-for-same-/219729) — discussion of script types; no clear success for BDD via public API only.
- **Documentation:** The official API docs do not describe how to create or set BDD script type via the API; BDD is documented only in the UI (Test Script tab → Type dropdown → BDD - Gherkin). So BDD via API is **underdocumented** at best.
- **Tried:** On create: `testScript: { type: 'bdd' }` and `type: 'bddScript'`; after create: PUT with `bddScript: { text }`, and PUT with `{ type: 'bdd' | 'bddScript', bddScript: { text } }` or `{ type, text }`. All accepted; UI still shows Step-by-step. Plain text and step-by-step work via the same API. **Conclusion: likely a product bug or undocumented limitation** (only BDD cannot be set via the public API).
- **Workaround:** Create the test case via API, then set script type to BDD and paste Gherkin in the UI; or use an integration that can call the TM4J app backend with session/tenant context.

### Step-by-step: bulk “createTestCaseTestSteps” fails; add steps one-by-one

- **Observed:** When creating a test case with step-by-step script, a post-create call to add steps using the documented bulk shape fails. Sending `POST /testcases/{key}/teststeps` with `{ mode: "APPEND", items: [ { inline: { description, testData, expectedResult }, testCase: { testCaseKey, self } } ] }` returns **400** with message like **`createTestCaseTestSteps: must not be null`** (US) or **`createTestCaseTestSteps.mode: must not be null`** (EU). Wrapping in `{ createTestCaseTestSteps: { mode, items } }` does not resolve it on EU.
- **Community evidence:** [Test to write to Zephyr Scale – createTestCaseTestSteps: must not be null](https://community.smartbear.com/discussions/zephyrscale/test-to-write-to-zphyr-scales--errorcode400messagecreatetestcaseteststeps-must-n/235621) — same payload and same error (bulk with `mode` and `items`).
- **Workaround:** Add steps **one at a time** with a **flat** body per step: `POST /testcases/{key}/teststeps` with `{ description, expectedResult, testData }` (or `step` / `result` / `data`). The MCP server uses this single-step contract for `create_test_step` and for the step-by-step fallback after create.

---

## References

- [Zephyr Scale for Jira Cloud API](https://support.smartbear.com/zephyr-scale-cloud/api-docs/)
- [REST API (overview)](https://support.smartbear.com/zephyr-scale-cloud/docs/en/rest-api/rest-api--overview-.html)
- [Deleting test cases](https://support.smartbear.com/zephyr-scale-cloud/docs/en/test-cases/deleting-test-cases.html)
