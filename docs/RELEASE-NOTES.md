# Release notes (for GitHub releases)

Copy the section for each version when creating the corresponding release on GitHub.

---

## v0.4

**Title (suggested):** Cycle test cases: list executions, add to cycle, create execution workaround

**Description:**

- **List test executions in cycle** — List test cases and their execution status in a given test cycle.
- **Add test cases to cycle** — Add existing test cases to a test cycle (`POST /testcycles/{key}/testcases`). Note: this endpoint can return 404 in some environments (e.g. EU).
- **Create test execution (workaround)** — When add-to-cycle returns 404, create a test execution for the test case in the cycle so it appears in the cycle view.
- **Fixes** — List executions in cycle via `GET /testexecutions?testCycle=...` (Cloud API); guard `list_test_cycles` for missing `executionSummary` and `total`.

Includes a small script `test-create-execution` for manually testing the create-execution workaround.

---

## v0.5

**Title (suggested):** Folders: list and create for test case / cycle structure

**Description:**

- **list_folders** — List folders by project (optional: folder type, parent ID) for organizing test cases and cycles.
- **create_folder** — Create a folder in a project (optional parent and folder type).

Enables organizing test cases and test cycles in folder structures via the Zephyr Scale Cloud API.

---

## v0.6

**Title (suggested):** Priorities & statuses, cycle folder, update test cycle

**Description:**

- **list_priorities** — List available priorities for test cases (optional project key).
- **list_statuses** — List available statuses for test cases (optional project key).
- **Test cycle folder** — Create and list test cycles with `folderId` for folder-based organization.
- **update_test_cycle** — Update an existing test cycle (e.g. name, dates, folder).

Use priorities and statuses when creating or updating test cases; use folder and update cycle for better cycle management.

---

## v0.6.1

**Title (suggested):** Fix: priority and status payload when creating test cases

**Description:**

- **Fix** — When creating a test case with `priority` or `status`, the client now sends them as `{ id }` objects as required by the Zephyr Scale Cloud API. Previously, sending raw values could cause create to fail or be ignored.

Patch release; no new features.

---

## v0.7.0

**Title (suggested):** Test script types (step-by-step, plain text, BDD) and test steps CRUD

**Description:**

### New tools

- **list_test_steps** — List step-by-step test steps for a test case.
- **create_test_step** — Add a single step (description, expected result, optional test data).
- **update_test_step** — Update an existing step.
- **delete_test_step** — Delete a step.

### Test script types on create/update

- **Step-by-step** — Create or update a test case with a list of steps. Steps are added one-by-one via the API (bulk endpoint fails with `createTestCaseTestSteps.mode` in many environments). Inline steps only (no `testCase` in item) to satisfy “inline or call to test, not both” on EU.
- **Plain text** — Set test script to free-form text via `plainScript` (PUT/POST with fallbacks).
- **BDD (Cucumber/Gherkin)** — Set script content via `bddScript`; **script type does not switch to BDD in the UI** when using the public API (documented as a known issue).

### Documentation

- **Known issues** — BDD: API docs do not describe creating BDD via API; type cannot be set via public API (likely bug or undocumented). Step-by-step: bulk create steps fails; workaround is one-by-one with flat body.
- **Gaps doc** — Updated with test steps CRUD (v0.7) and the known issues above.

### Script

- **test-100-steps** — Optional script to create a step-by-step and a plain-text test case with 100 steps from a JSON payload (for load/regression; requires env vars).

**Compatibility:** Zephyr Scale for Jira Cloud (US and EU). EU users: use `ZEPHYR_BASE_URL` (or `ZEPHYR_API_BASE_URL`) pointing to your region.

---

## v0.8.0

**Title (suggested):** Get test plan/cycle by key, list Zephyr projects

**Description:**

### New tools

- **get_test_plan** — Get a single test plan by key or ID (`GET /testplans/{planKey}`). Returns id, key, name, description, status, dates, createdBy.
- **get_test_cycle** — Get a single test cycle by key or ID (`GET /testcycles/{cycleKey}`). Returns id, key, name, description, status, dates, executionSummary, etc.
- **list_projects** — List Zephyr-visible projects (`GET /projects`) with pagination (`limit`, `startAt`). Returns id, key, name for projectKey discovery and validation.

### Documentation

- **ZEPHYR-SCALE-CLOUD-API-GAPS.md** — Retrospectively added version numbers (v0.4, v0.5, v0.6, v0.7, v0.8) for each implemented capability in the summary table and section text.
- **README.md** — Updated checklist: get test plan/cycle and list_projects marked as implemented; list_projects added to tool table and examples.
- **PLAN.md** — Removed; content was redundant with README and existing docs.

### Script

- **test-list-projects** — Optional script to exercise `GET /projects` from the command line (`node dist/scripts/test-list-projects.js [limit] [startAt]`). Requires env vars (ZEPHYR_*, JIRA_*).
