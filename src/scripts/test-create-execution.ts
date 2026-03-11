/**
 * One-off test: add a test case to a cycle via Create Test Execution (workaround
 * when POST /testcycles/{key}/testcases returns 404). Run from repo root with
 * .env set (ZEPHYR_API_TOKEN, ZEPHYR_BASE_URL, JIRA_*).
 *
 * Usage: node dist/scripts/test-create-execution.js [projectKey] [testCycleKey] [testCaseKey]
 * Default: CP CP-R31 CP-T4305
 */
import { ZephyrClient } from '../clients/zephyr-client.js';

async function main() {
  const projectKey = process.argv[2] || 'CP';
  const testCycleKey = process.argv[3] || 'CP-R31';
  const testCaseKey = process.argv[4] || 'CP-T4305';

  const client = new ZephyrClient();

  console.log(
    `Creating test execution: ${testCaseKey} in cycle ${testCycleKey} (project ${projectKey}), status Not Executed...`
  );
  try {
    const execution = await client.createTestExecution({
      projectKey,
      testCaseKey,
      testCycleKey,
      statusName: 'Not Executed',
    });
    console.log('Success:', JSON.stringify(execution, null, 2));
  } catch (err: any) {
    console.error('Error:', err.response?.data || err.message);
    process.exit(1);
  }
}

main();
