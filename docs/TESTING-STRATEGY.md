# Service tests: strategy

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
   - `.github/workflows/test.yml`: on push/PR to main and feat/**; install deps, run `npm run test`, then `npm run typecheck`.  
   - No secrets needed; all requests are mocked.

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

1. **nock** and **vitest** added as devDependencies; **`npm run test`** runs `vitest run`, **`npm run test:watch`** runs vitest in watch mode.
2. **tests/setup.ts** sets minimal `process.env` so `getAppConfig()` passes when the client is created.
3. **tests/zephyr-client.test.ts** tests four client methods with nock and fixtures: `getTestPlans`, `searchTestCases`, `createTestCase`, `getTestSteps`.
4. **.github/workflows/test.yml** runs on push/PR to main and feat/**: `npm ci`, `npm run test`, `npm run typecheck`.
5. **Next:** Add fixtures and tests for the remaining Zephyr client methods (test plans create, test cycles, folders, priorities, statuses, executions, test script, steps create/update/delete, etc.), then Jira client if desired.

## Alternatives considered

- **Real stub server (Express):** Would need to implement every route and keep it in sync with the API. More work; HTTP mocking is enough for “we call the right URL and handle the response.”
- **MSW (Mock Service Worker) in Node:** Possible with `msw-node`; nock is simpler for Node + axios and is widely used.
- **node:test only:** Would avoid Vitest but requires a TS build or loader for tests; Vitest was chosen for simple TypeScript and ESM support.
