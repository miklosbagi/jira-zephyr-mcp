# Service tests: strategy

## Test layers

| Layer | What | How | Run |
|-------|------|-----|-----|
| **Integration (mocked)** | Zephyr client with all API calls mocked | nock + fixtures; fake Jira URL and tokens only; no .env or real credentials | `npm run test:integration` or `npm run test:unit` |
| **Contract** | Real Zephyr API (read-only) | No mocks; `.env` / secrets; assert response shape | `npm run test:contract` |

We do **not** have separate “unit” tests in the narrow sense (e.g. pure functions only). The mocked suite is **integration tests** (mocked responses for all calls).

## Goal

- **Mock** Zephyr (and optionally Jira) API responses.
- **Test every call** the MCP server makes (client methods and/or tool handlers).
- **Run in GitHub Actions** with no real API keys or external services.

## Approach: HTTP-level mocking + Node test runner

1. **Mock at HTTP level**  
   Use **nock** to intercept requests from the axios client. Each test sets up nock for the exact method + path (+ body matcher if needed), returns a fixture response, then calls the real client method and asserts on the returned shape (and optionally that the request was made as expected).

2. **Test runner**  
   **Vitest** is used so we can run TypeScript tests directly and import from `src/` without a separate test build. GHA runs `npm run test` (vitest run).

3. **Fixtures**  
   Store one or more JSON files per endpoint under **`tests/fixtures/`** (e.g. `zephyr/testplans-list.json`, `zephyr/testcases-create.json`). Tests require these fixtures and pass them to nock as the response body.

4. **Config in tests**  
   The Zephyr client reads `getZephyrBaseUrl()` and `getZephyrHeaders()` at construction. For tests, either:
   - **Option A:** Set minimal `process.env` before importing the client (e.g. in a `tests/setup.ts` or at the top of each test file) so `getAppConfig()` succeeds and returns a known base URL (e.g. `https://api.zephyrscale.smartbear.com/v2`), then nock that host; or  
   - **Option B:** Refactor the client to accept an optional `baseURL` (and optionally `headers`) in the constructor for testing, and pass a base URL that nock will intercept (e.g. `https://api.zephyrscale.smartbear.com`).  
   Option A avoids code changes; Option B keeps production code unchanged at runtime and makes tests independent of config.

5. **Scope of tests**  
   - **Phase 1:** Test **ZephyrClient** methods only (one describe per method or per resource: test plans, cycles, folders, test cases, test steps, executions, etc.). Each test: nock one or more HTTP calls, call the client method, assert return value (and optionally nock.isDone()).  
   - **Phase 2 (optional):** Add tests for **tool handlers** (e.g. `createTestCase` in `tools/test-cases.ts`) that use the client; same idea, mock the client’s HTTP and assert the tool’s return shape.

6. **Coverage**  
   - List one fixture per “happy path” (and optionally one per error, e.g. 400/404) for each endpoint the client uses.  
   - Cover every `this.client.get/post/put/delete` in `zephyr-client.ts` (and later `jira-client.ts`) at least once.

7. **GHA workflow**  
   - **Integration (mocked):** `.github/workflows/test.yml` on push/PR to main and feat/**; `npm run test:unit` (same as `test:integration`), `npm run typecheck`. No secrets; all requests mocked.  
   - **Contract:** `.github/workflows/contract.yml` is **manual only** (`workflow_dispatch`) for now; run once repo secrets are set. Required secrets: `ZEPHYR_BASE_URL`, `ZEPHYR_API_TOKEN`, `JIRA_BASE_URL`, `JIRA_USERNAME`, `JIRA_API_TOKEN`; optional: `ZEPHYR_CONTRACT_PROJECT_KEY`, `ZEPHYR_CONTRACT_PLAN_KEY`, `ZEPHYR_CONTRACT_CYCLE_KEY`. You can add a schedule later (e.g. daily) and a badge: `![Zephyr contract](https://github.com/OWNER/REPO/actions/workflows/contract.yml/badge.svg)`.

## Suggested layout

```
tests/
  fixtures/
    zephyr/
      testplans-list.json
      testplans-create.json
      testcycles-list.json
      testcycles-create.json
      testcases-search.json
      testcases-get.json
      testcases-create.json
      teststeps-list.json
      teststeps-create.json
      ... (one or more per endpoint)
  setup.ts          # optional: set process.env for config, or create test client with injected baseURL
  zephyr-client.test.ts
  jira-client.test.ts   # optional, later
```

## Implementation (done)

1. **nock** and **vitest** added as devDependencies; **`npm run test`** runs all; **`npm run test:integration`** / **`npm run test:unit`** run integration (mocked) only; **`npm run test:contract`** runs contract only; **`npm run test:watch`** runs vitest in watch mode.
2. **tests/setup.ts** loads `.env` (for contract tests). Integration tests need no real config: they set fake Jira endpoint and fake tokens in their own `beforeAll` so nock intercepts; no .env required.
3. **tests/zephyr-client.test.ts** = **integration tests (mocked):** Zephyr client with nock and sanitized fixtures; each test asserts request (method, path, query, body) and response shape (`scope.isDone()`). **tests/link-tests-to-issues.test.ts** exercises **`linkTestsToIssues`** (Jira `GET /issue/{key}` then Zephyr `POST .../links/issues`). **tests/test-case-links-tools.test.ts** exercises **`getTestCaseLinks`** (`GET .../links`).
4. **.github/workflows/test.yml** runs on push/PR: `npm run test:unit` (integration mocked), `npm run typecheck`. No secrets.
5. **Contract suite:** **tests/contract/zephyr-contract.test.ts** calls the real Zephyr API (read-only). Its `beforeAll` calls `dotenv.config()` so real credentials are used. **.github/workflows/contract.yml** runs `npm run test:contract` on manual trigger (`workflow_dispatch` only for now).
6. **Run by file:** `npm run test` = all; `npm run test:integration` or `npm run test:unit` = integration (mocked) only; `npm run test:contract` = contract only.
7. **Fixtures** are sanitized (see `docs/FIXTURE-SANITIZATION.md`); no real account IDs, names, or tokens in repo.

## Alternatives considered

- **Real stub server (Express):** Would need to implement every route and keep it in sync with the API. More work; HTTP mocking is enough for “we call the right URL and handle the response.”
- **MSW (Mock Service Worker) in Node:** Possible with `msw-node`; nock is simpler for Node + axios and is widely used.
- **node:test only:** Would avoid Vitest but requires a TS build or loader for tests; Vitest was chosen for simple TypeScript and ESM support.
