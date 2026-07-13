# Zephyr Scale Cloud API – Gaps vs MCP Server

This document lists **Zephyr Scale for Jira Cloud API** capabilities that are **not yet implemented** in this MCP server. It is based on the [official API documentation](https://support.smartbear.com/zephyr-scale-cloud/api-docs/) and the [REST API overview](https://support.smartbear.com/zephyr-scale-cloud/docs/en/rest-api/rest-api--overview-.html). Base URL: `https://api.zephyrscale.smartbear.com/v2/`.

---

## What the MCP server already implements

| Area | Implemented |
|------|-------------|
| **Test plans** | Create, list (by projectKey), get one, update (**`update_test_plan`**: GET-merge-PUT — **not** in public OpenAPI; see §14) |
| **Test cycles** | Create, list (by projectKey, optional versionId), get one, **`update_test_cycle`** (PUT `testcycles/{key}`, OpenAPI `updateTestCycle`) |
| **Test executions** | Create (add test case to cycle), **get one** (**`get_test_execution`**, `GET /testexecutions/{idOrKey}`, v0.15.0), **links & steps** (**`get_test_execution_links`**, **`get_test_execution_issue_links`**, **`get_test_execution_test_steps`**, **`sync_test_execution_test_steps`**, **`update_test_execution_test_steps`**, v0.16.0–v0.17.0), update status/comment/defects/**environment** (**`execute_test`**: `PASS`/`FAIL`/`WIP`/In progress/`BLOCKED`, optional **`environmentName`** v0.18.0), list in cycle, cursor list (**`list_test_executions_nextgen`**, v0.14.0), summary by cycle, **`bulk_execute_tests`** (sequential PUTs — not one API call) |
| **Test cases** | Get one, search, cursor list (**`list_test_cases_nextgen`**, v0.14.0), create, update, create multiple |
| **Folders** | List (by projectKey, optional folderType, parentId), create (with optional parentId, folderType) |
| **Priorities / statuses** | List priorities and statuses (GET /priorities, GET /statuses; optional projectKey) for test case create/update |
| **Links** | Coverage links to Jira issues: POST `testcases/{key}/links/issues`, `testcycles/{key}/links/issues`, `testplans/{key}/links/issues` (numeric `issueId`; MCP resolves keys via Jira REST). List (test case only): GET `testcases/{key}/links` (`get_test_case_links`). **v0.12.0+** — see note below. |
| **Reporting** | Generate test report for a cycle (JSON/HTML) |

**Issue links (v0.12.0):** The [OpenAPI spec](https://support.smartbear.com/zephyr-scale-cloud/api-docs/) defines **`POST .../links/issues`** with **`{ "issueId": <int64> }`** for **test cases**, **test cycles**, and **test plans** (`createTestCaseIssueLink`, `createTestCycleIssueLink`, `createTestPlanIssueLink`). **`GET /testcases/{key}/links`** lists links for a test case; the public spec does **not** expose an aggregate **`GET /testplans/{key}/links`** (plan linking uses POST under `/links/issues`, `/links/weblinks`, `/links/testcycles` only). Older MCP builds used **`POST /testcases/{key}/links`** with **`issueKeys`**, which no longer matches the documented API and often returns **405 Method Not Allowed** on GET-only `/links`. The server resolves issue keys with Jira **`GET /rest/api/3/issue/{issueIdOrKey}`** and posts **`issueId`** to **`/links/issues`**.

**Test executions in cycle / removal / labels ([issue #67](https://github.com/miklosbagi/jira-zephyr-mcp/issues/67)):** `list_test_executions_in_cycle` exposes **`testCaseKey`** and **`testCaseId`** (entity id). If GET `/testexecutions` omits `testCase.key` but includes `testCase.id` / `testCaseId`, the MCP server may GET `/testcases/{id}` to fill keys. `remove_test_case_from_cycle` matches by key (**case-insensitive**) or by **numeric test case id** as a string. `update_test_case` **deduplicates `labels`** (trim, case-insensitive) before PUT; tool errors prefer full Zephyr **response bodies** when present so option/custom-field messages are visible.

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

- **API:** `GET /environments` (e.g. `projectKey`, pagination), `GET /environments/{id}`, `POST /environments`, `PUT /environments/{id}` ([path layout](https://support.smartbear.com/zephyr-scale-cloud/api-docs/) aligns with `environments` in Scale Cloud).
- **MCP status:** Implemented (v0.10.0). `list_environments`, `get_environment`, `create_environment`, `update_environment`. Use returned **names** with `create_test_cycle` / `update_test_cycle` (`environment`) and `create_test_execution` (`environmentName`). **Update** loads the current environment then merges fields before PUT (some instances clear omitted fields on PUT).

### 10. **Test case archive / delete**

- **API (used by MCP):** `PUT /testcases/{key}` with a full body including **`archived: true|false`** (after `GET` merge, same pattern as `update_test_case`). `DELETE /testcases/{key}` for permanent removal.
- **MCP status:** Implemented (v0.11.0): `archive_test_case`, `unarchive_test_case`, `delete_test_case`.
- **Caveat:** SmartBear’s public reference and community threads often state that **delete/archive are UI-first** or not guaranteed on the Scale Cloud v2 surface. **`archived` on PUT** may be ignored or rejected (400) on some tenants. **`DELETE`** may return **404/405**. Prefer **`archive_test_case`** when supported; use **[Deleting test cases (UI)](https://support.smartbear.com/zephyr-scale-cloud/docs/en/test-cases/deleting-test-cases.html)** for permanent delete if the API refuses (dependencies must be removed first).

### 11. **Test steps as a separate resource**

- **API (verified against `api.cloud.expanded.yml`):** Cloud v2 exposes only `GET /testcases/{key}/teststeps` (paged list) and `POST /testcases/{key}/teststeps` (`createTestCaseTestSteps`, body `{ mode: "APPEND"|"OVERWRITE", items: [...] }`, max 100 items/request). **There is no `PUT`/`DELETE` on this path, and no per-step id or index parameter in the schema** — `TestStep` items are `{ inline: { description, testData, expectedResult, customFields } }` (or `{ testCase: {...} }` to delegate to another test case), addressed only by their position in the list.
- **MCP status:** Implemented (v0.7; step-identity/endpoint fix landed after [issue #137](https://github.com/miklosbagi/jira-zephyr-mcp/issues/137)-adjacent AIQA reports — see Known issues below). `list_test_steps` / `create_test_step` return/take a **0-based `index`**. `update_test_step` / `delete_test_step` emulate a per-step PUT/DELETE client-side: `GET` the full list, mutate/remove the item at `index`, then `POST` the whole list back with `mode: OVERWRITE` (deletes and recreates all steps + custom field values; existing attachments are kept, but attachments on removed steps are deleted). `create_test_step` without an `index` fast-paths to `mode: APPEND`; with an `index` it splices into the fetched list and OVERWRITEs.

### 11b. **Setting test script type to BDD (Gherkin) via public API**

- **Observed behaviour:** Plain text works via Scale API `POST /testcases/{key}/testscript` with `{ type: "plain", text }`. The same endpoint accepts `{ type: "bdd", text }` (no error) but the test case remains **Step-by-step** in the UI; the script type is not changed.
- **UI behaviour:** When switching to BDD in the Zephyr UI, the browser calls **TM4J app backend** `PUT https://eu.app.tm4j.smartbear.com/backend/rest/tests/2.0/testcase/{id}` with body `{ id, projectId, testScript: { bddScript: { text } } }`. That backend is not the public Scale API; calling it with the same Bearer token returns **404 Tenant could not be found** (tenant likely resolved from session/cookies in the browser).
- **What users report:** Community threads ([Create test script](https://community.smartbear.com/discussions/zephyrscale/api-documentation-for-create-test-script/215537), [Step-by-step vs Plain text](https://community.smartbear.com/discussions/zephyrscale/does-zephyr-support-both-test-script-types-step-by-step-and-plain-text-for-same-/219729)) describe the **Create test script** endpoint with a `type` parameter (e.g. `"steps"`); examples for multiple steps or non-steps types are limited. No clear success stories for setting BDD via the **public** Scale API only.
- **Other product (Zephyr Squad Cloud):** The [BDD Content API](https://zephyr-squad-cloud-v1.sb-docs.com/en/zephyr-squad-cloud-rest-api/bdd-content-api) uses a different base URL (`prod-api.zephyr4jiracloud.com`), works with issues that have labels `BDD_Feature` / `BDD_Scenario`, and uses Jira issue ID (not test case key). That is a different product/API from Zephyr Scale.
- **Conclusion / workaround:** With the **public Zephyr Scale API** (api.zephyrscale.smartbear.com) we can create test cases and set **plain text** script; **BDD** type appears to be applied only via the **TM4J app backend**, which is not reliably callable with the same API token (tenant/404). Workaround: create the test case via API, then set script type to BDD and paste Gherkin content **manually in the UI**, or use a different integration (e.g. Atlassian Connect–style endpoint or session-based auth) if available.

### 12. **Remove test case from cycle**

- **API (used):** `DELETE /testexecutions/{executionId}` — removing the execution removes the test case from the cycle (same net effect as the UI in typical setups).
- **MCP status:** Implemented (`remove_test_case_from_cycle`). Pass **`executionId`** from `list_test_executions_in_cycle`, or **`cycleKey` + `testCaseKey`** to resolve a single matching execution. If more than one execution exists for the same case in the cycle, you must pass **`executionId`**.
- **Caveat:** The public API reference does not always list this operation; some tenants return **404/405**. The Zephyr UI may use other backends for bulk removal; this tool targets the Scale Cloud v2 REST surface only.

### 13. **Update test cycle**

- **API (OpenAPI):** **`PUT /testcycles/{testCycleIdOrKey}`** — `operationId: updateTestCycle`. Request body is **`TestCycle`**; docs warn that omitted fields may be cleared and custom fields may need to be sent in full.
- **MCP status:** Implemented (**`update_test_cycle`**, v0.6+; extended v0.13.0). Client **`GET`s** the cycle, **merges** partial fields (including **`status`** id, **`versionId`** → **`jiraProjectVersion`**, **`ownerAccountId`**, **`customFields`**), then **`PUT`s** so updates do not wipe the rest of the payload.

### 14. **Update test plan**

- **API (OpenAPI, [api.cloud.stripped.yml](https://support.smartbear.com/zephyr-scale-cloud/api-docs/)):** **`GET /testplans/{testPlanIdOrKey}`** (`getTestPlan`) and **`POST /testplans`** (`createTestPlan`) are documented. The published spec does **not** list **`PUT /testplans/{key}`** for that path.
- **MCP status (v0.13.0+):** **`update_test_plan`** uses the same **GET → merge → PUT** pattern as test cases and test cycles, calling **`PUT /testplans/{planKey}`** with the merged **`TestPlan`**-shaped body. This matches how the product UI typically persists plan edits, but **it is not guaranteed** on every region or tenant: you may see **404** or **405** if the endpoint is disabled. If so, edit the plan in the Zephyr UI or contact SmartBear.

### 15. **Bulk or batch operations**

- **API (OpenAPI):** There is **no** documented endpoint that accepts **multiple test execution updates in one request**. **`GET /testcases/nextgen`** (`listTestCasesCursorPaginated`) and **`GET /testexecutions/nextgen`** (`listTestExecutionsNextgen`) are **cursor-paged list** APIs for **large read volumes** (use `nextStartAtId` / `next` for the next page). **`POST /testcycles/{key}/testcases`** with an `items` array adds several cases to a cycle in one call — already exposed as **`add_test_cases_to_cycle`** (may 404 on some regions).
- **MCP status (v0.14.0+):** **`list_test_cases_nextgen`** and **`list_test_executions_nextgen`** call the documented nextgen GET routes. **`bulk_execute_tests`** applies the same payload as **`execute_test`** via **sequential `PUT /testexecutions/{id}`** calls (optional **`continueOnError`**, same pattern as **`create_multiple_test_cases`**). **`execute_test`** / **`bulk_execute_tests`** accept optional **`environmentName`** on update (v0.18.0; OpenAPI `TestExecutionUpdate`). For very large batches, prefer external orchestration or rate limits to avoid throttling.

### 16. Additional test execution endpoints (links, steps, sync)

- **API:** `GET /testexecutions/{testExecutionIdOrKey}` — OpenAPI **`getTestExecution`** ([Test Executions](https://support.smartbear.com/zephyr-scale-cloud/api-docs/#tag/Test-Executions)).
- **MCP status (v0.15.0):** Implemented as **`get_test_execution`** (`executionId`). Returns the same normalized row as **`list_test_executions_in_cycle`** (including **`testCaseKey`** / **`testCaseId`**); if GET omits **`testCase.key`** but includes a test case entity id, the server may GET **`/testcases/{id}`** to fill the key (same behaviour as issue #67 for list).
- **API:** `GET /testexecutions/{testExecutionIdOrKey}/links` — **`getTestExecutionLinks`**; **`GET .../links/issues`** — **`getTestExecutionIssueLinks`**; **`GET .../teststeps`** — **`getTestExecutionTestSteps`**; **`PUT .../teststeps`** — **`putTestExecutionTestSteps`**; **`POST .../teststeps/sync`** — **`syncTestExecutionTestSteps`** (optional JSON **`body`**; defaults to **`{}`**).
- **MCP status (v0.16.0+):** **`get_test_execution_links`**, **`get_test_execution_issue_links`**, **`get_test_execution_test_steps`**, **`sync_test_execution_test_steps`**. **`update_test_execution_test_steps`** (v0.17.0) wraps **`PUT .../teststeps`** — `steps` array index matches step order; `statusName` e.g. Pass, Fail, In Progress. Core execution create/update/list/remove unchanged (**`execute_test`**, **`get_test_execution`**, etc.).

### 17. Web link endpoints (not wrapped as MCP tools)

- **API:** `POST /testcases/{key}/links/weblinks`
- **API:** `POST /testcycles/{key}/links/weblinks`
- **API:** `POST /testplans/{key}/links/weblinks`
- **MCP status:** Only coverage links for Jira issues (`.../links/issues`) and test case link retrieval (`GET /testcases/{key}/links`) are exposed.

### 18. Test plan ↔ test cycle linkage endpoints (not wrapped as MCP tools)

- **API:** `POST /testplans/{testPlanIdOrKey}/links/testcycles`
- **MCP status:** Not implemented as an MCP tool yet (plan issue linking is implemented via `.../links/issues`).

### 19. Test case versions endpoints (not wrapped as MCP tools)

- **API:** `GET /testcases/{testCaseKey}/versions`
- **API:** `GET /testcases/{testCaseKey}/versions/{version}`
- **MCP status:** Not implemented as an MCP tool yet.

### 20. Single-resource GETs / link retrievals not exposed (partial coverage via lists)

- **Folders:** `GET /folders/{folderId}`
- **Projects:** `GET /projects/{projectIdOrKey}`
- **Priorities / statuses:** `GET /priorities/{priorityId}`, `GET /statuses/{statusId}`
- **Links:** `GET /links/{linkId}`
- **MCP status:** Current server primarily exposes list endpoints (and a few entity-specific GETs, e.g. environments + plans/cycles/cases); the above per-id “direct GET” endpoints are not wrapped as MCP tools yet.

### 21. Automation-related test case endpoints (not wrapped as MCP tools)

- **API (OpenAPI):** `GET/POST /automations/testcases/...` (automation operations for test cases)
- **MCP status:** Not implemented as MCP tools yet.

### 22. **Attachments (upload / download evidence)**

- **API (public Scale Cloud v2):** No documented **`POST`/`GET`** attachment routes on test cases, test executions, or execution steps in the [OpenAPI spec](https://support.smartbear.com/zephyr-scale-cloud/api-docs/). Server/DC paths (e.g. `POST /rest/atm/1.0/testresult/{id}/attachments`) do **not** apply to Cloud tenants.
- **MCP status:** **Not implemented** — blocked on upstream API support. Tracked as [issue #118](https://github.com/miklosbagi/jira-zephyr-mcp/issues/118).
- **SmartBear / community:** Support repeatedly states Cloud attachment upload/download is **UI-only** via the public REST API — e.g. [Cloud API: Uploading an attachment to a test result](https://community.smartbear.com/discussions/zephyrscale/cloud-api-uploading-an-attachment-to-a-test-result/210086), [How to upload an attachment file to a test execution via REST API?](https://community.smartbear.com/discussions/zephyrscale/how-to-upload-an-attachment-file-to-a-test-execution-via-zephyr-scale-cloud-rest/277229), [accessing images](https://community.smartbear.com/discussions/zephyrscale/accessing-images/260279) (CloudFront URLs need session JWT, not the Scale API token). Upstream: [SmartBear/smartbear-mcp#456](https://github.com/SmartBear/smartbear-mcp/issues/456) (official attachment endpoints planned).
- **Undocumented private TM4J backend:** The UI uses `app.tm4j.smartbear.com/backend/rest/tests/2.0/` with **Context JWT** (Jira Basic auth) + S3 upload — see community package [`@rbaileysr/zephyr-managed-api`](https://www.npmjs.com/package/@rbaileysr/zephyr-managed-api). Same auth/tenant problems as BDD via TM4J (§11b). **Not** planned for this MCP without explicit opt-in.
- **Workarounds:** Jira issue attachments on linked defects (`POST /rest/api/3/issue/{key}/attachments`); artifact URLs in execution **comments**; manual upload in the Zephyr UI.

### 23. **Update execution step results (per-step Pass / Fail / In progress)**

- **Implemented (v0.17.0):** **`update_test_execution_test_steps`** — see §16. **`get_test_execution_test_steps`** / **`sync_test_execution_test_steps`** (v0.16.0) remain read/sync only.
- **Execution reads (v0.18.0):** Scale Cloud returns `testExecutionStatus` (not a flat `status` string). The server normalizes to **`status`** (`PASS`/`FAIL`/…) and **`statusName`** on **`get_test_execution`**, **`list_test_executions_in_cycle`**, **`list_test_executions_nextgen`**, and **`get_test_execution_status`**. Cycle lists auto-paginate past the API default of 10 results per page.
- **Whole-execution status (write):** **`execute_test`** / **`bulk_execute_tests`** — `PASS`, `FAIL`, `WIP` (In progress), `BLOCKED`. Optional **`environmentName`** to assign or change environment on an existing execution (v0.18.0). No `NOT_EXECUTED` on update.

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
| 9 | List/manage environments | GET/POST/PUT environments | Implemented (`list_environments`, `get_environment`, `create_environment`, `update_environment`, v0.10.0) |
| 10 | Archive/delete test case | PUT archived; DELETE testcases/{key} | Implemented (`archive_test_case`, `unarchive_test_case`, `delete_test_case`, v0.11.0); API support varies by tenant |
| 11 | Test steps CRUD | `GET`/`POST testcases/{key}/teststeps` (no per-step id/PUT/DELETE) | Implemented (v0.7); `update`/`delete_test_step` emulate per-step ops via GET+`mode: OVERWRITE`, addressed by 0-based `index` |
| 12 | Remove test case from cycle | DELETE /testexecutions/{id} | Implemented (`remove_test_case_from_cycle`; API support varies by tenant) |
| 13 | Update test cycle | PUT `testcycles/{key}` | Implemented (`update_test_cycle`; GET-merge-PUT vs OpenAPI `updateTestCycle`) |
| 14 | Update test plan | PUT `testplans/{key}` (undocumented in public OpenAPI) | Implemented (**`update_test_plan`**, v0.13.0); GET-merge-PUT — may 404/405 on some tenants |
| 15 | Bulk / high-volume reads & batch execution updates | `.../nextgen` GET; no multi-execution PUT in spec | **`list_test_cases_nextgen`**, **`list_test_executions_nextgen`**; **`bulk_execute_tests`** (sequential PUTs, v0.14.0) |
| 16 | Test case ↔ Jira issue links | GET/POST `.../links` and `.../links/issues` | Implemented (**v0.12.0**); test case, cycle, and plan issue links |
| 17 | Single test execution retrieval | `GET /testexecutions/{idOrKey}` (`getTestExecution`) | Implemented (**`get_test_execution`**, v0.15.0) |
| 18 | Execution links and execution test steps | `GET /testexecutions/{id}/links`, `.../links/issues`, `.../teststeps`, `PUT .../teststeps`, `POST .../teststeps/sync` | Implemented (**v0.16.0**–**v0.17.0**): **`get_test_execution_links`**, **`get_test_execution_issue_links`**, **`get_test_execution_test_steps`**, **`sync_test_execution_test_steps`**, **`update_test_execution_test_steps`** |
| 19 | Web links on test resources | `POST .../links/weblinks` | Not exposed as MCP tools yet |
| 20 | Plan ↔ cycle linkage | `POST /testplans/{key}/links/testcycles` | Not exposed as MCP tools yet |
| 21 | Test case versions | `GET /testcases/{key}/versions` | Not exposed as MCP tools yet |
| 22 | Per-id GETs and link retrieval | `GET /folders/{id}`, `GET /projects/{idOrKey}`, `GET /links/{linkId}` | Not exposed as MCP tools yet |
| 23 | Test case automations | `/automations/testcases/...` | Not exposed as MCP tools yet |
| 24 | Attachments (evidence files) | None in public OpenAPI | **Not implemented** — [issue #118](https://github.com/miklosbagi/jira-zephyr-mcp/issues/118); wait for official Cloud API |
| 25 | Per-step execution results | `PUT /testexecutions/{id}/teststeps` (`putTestExecutionTestSteps`) | Implemented (**`update_test_execution_test_steps`**, v0.17.0); whole-execution **`execute_test`** (`PASS`/`FAIL`/`WIP`/`BLOCKED`) |

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

### `create_test_step` / `update_test_step` no-op or 400/404 (fixed)

- **Observed (pre-fix):** `update_test_case.testScript` returned `success: true` but steps stayed blank on re-fetch; `update_test_step` returned **404**; `create_test_step` returned **400 `createTestCaseTestSteps: must not be null`** — reported via an AIQA agent run, filed alongside [issue #137](https://github.com/miklosbagi/jira-zephyr-mcp/issues/137).
- **Root cause:** Three separate bugs, all from the MCP server not matching the real `api.cloud.expanded.yml` contract:
  1. `update_test_case`/`create_test_case` sent `testScript` **inline on the main test case PUT/POST body**. `testScript` on the `TestCase` entity is a **read-only link** — the API silently ignores it, so the PUT/POST 200s but nothing changes.
  2. `create_test_step` sent a **flat** `{ description, expectedResult, testData }` body. The real endpoint only accepts the bulk shape `{ mode, items: [{ inline: {...} }] }`; a flat body is missing `mode`, hence the 400.
  3. `update_test_step` / `delete_test_step` called `PUT`/`DELETE /testcases/{key}/teststeps/{stepId}` — **that path does not exist** in the spec (no per-step id, no per-step verb), hence the 404.
- **Fix:** `testScript` is now applied via its own endpoints (`POST .../testscript` for plain/BDD text, `POST .../teststeps` with `mode: OVERWRITE` for step-by-step) **after** the main test case PUT/POST succeeds, never inline on the entity body. `create_test_step` always sends the bulk `{ mode, items: [{ inline }] }` shape. `update_test_step`/`delete_test_step` fetch the current list, mutate/remove by **0-based `index`**, and re-`POST` with `mode: OVERWRITE` — see §11.
- **Community evidence for the original 400 misdiagnosis:** [Test to write to Zephyr Scale – createTestCaseTestSteps: must not be null](https://community.smartbear.com/discussions/zephyrscale/test-to-write-to-zphyr-scales--errorcode400messagecreatetestcaseteststeps-must-n/235621) shows the same 400 from a malformed item (`{ inline: {...}, testCase: {...} }` — the schema requires exactly one of `inline` or `testCase`, not both). The fix's item shape (`inline`-only or `testCase`-only, never both) avoids this.

### Attachments cannot be uploaded or downloaded via the public Scale Cloud API

- **Conclusion:** Zephyr Scale Cloud has **no supported public REST API** for uploading or downloading attachments (screenshots, GIFs, PDFs) on test cases or test executions. The MCP server has **no attachment tools**.
- **GitHub:** [issue #118](https://github.com/miklosbagi/jira-zephyr-mcp/issues/118) — full references, private TM4J/S3 reverse-engineering notes, and workarounds.
- **When to implement:** After SmartBear documents stable Cloud **`POST`/`GET`** attachment endpoints ([smartbear-mcp#456](https://github.com/SmartBear/smartbear-mcp/issues/456)).

---

## References

- [Zephyr Scale for Jira Cloud API](https://support.smartbear.com/zephyr-scale-cloud/api-docs/)
- [REST API (overview)](https://support.smartbear.com/zephyr-scale-cloud/docs/en/rest-api/rest-api--overview-.html)
- [Deleting test cases](https://support.smartbear.com/zephyr-scale-cloud/docs/en/test-cases/deleting-test-cases.html)
