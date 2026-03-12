/**
 * One-off test: list Zephyr projects (GET /projects).
 * Run from repo root with .env set (ZEPHYR_API_TOKEN, ZEPHYR_BASE_URL).
 *
 * Usage: node dist/scripts/test-list-projects.js [limit] [startAt]
 * Default: limit 20, startAt 0
 */
import { ZephyrClient } from '../clients/zephyr-client.js';

async function main() {
  const limit = parseInt(process.argv[2] || '20', 10);
  const startAt = parseInt(process.argv[3] || '0', 10);

  const client = new ZephyrClient();

  console.log(`Listing Zephyr projects (limit=${limit}, startAt=${startAt})...`);
  try {
    const result = await client.getProjects(limit, startAt);
    console.log('Total:', result.total);
    console.log('Projects:', JSON.stringify(result.projects, null, 2));
  } catch (err: any) {
    console.error('Error:', err.response?.data || err.message);
    process.exit(1);
  }
}

main();
