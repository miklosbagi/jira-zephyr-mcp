/**
 * One-off test: list priorities and statuses. Run from repo root with .env set.
 * Usage: node dist/scripts/test-priorities-statuses.js [projectKey]
 */
import { ZephyrClient } from '../clients/zephyr-client.js';

async function main() {
  const projectKey = process.argv[2] || undefined;
  const client = new ZephyrClient();

  console.log('Fetching priorities' + (projectKey ? ` (projectKey=${projectKey})` : '') + '...');
  const priorities = await client.getPriorities(projectKey);
  console.log('Priorities:', JSON.stringify(priorities, null, 2));

  console.log('\nFetching statuses' + (projectKey ? ` (projectKey=${projectKey})` : '') + '...');
  const statuses = await client.getStatuses(projectKey);
  console.log('Statuses:', JSON.stringify(statuses, null, 2));
}

main().catch((err) => {
  console.error(err.response?.data || err.message);
  process.exit(1);
});
