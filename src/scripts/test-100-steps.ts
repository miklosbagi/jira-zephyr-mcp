/**
 * One-off test: create a step-by-step test case with 100 steps and a plain-text
 * test case with the same 100 steps as text. Run from repo root with env set
 * (ZEPHYR_API_TOKEN, ZEPHYR_BASE_URL or ZEPHYR_API_BASE_URL, JIRA_*).
 *
 * Usage: node dist/scripts/test-100-steps.js [path-to-payloads.json]
 * Requires env: JIRA_BASE_URL, JIRA_USERNAME, JIRA_API_TOKEN, ZEPHYR_API_TOKEN (and ZEPHYR_API_BASE_URL for EU).
 * Generate payloads with: node -e "const steps=[...]; const plain=...; require('fs').writeFileSync('payloads.json', JSON.stringify({stepByStep:{projectKey:'CP',name:'Step-by-step 100 steps',testScript:{type:'STEP_BY_STEP',steps}}, plainText:{projectKey:'CP',name:'Plain text 100 steps',testScript:{type:'PLAIN_TEXT',text:plain}}}));"
 */
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { ZephyrClient } from '../clients/zephyr-client.js';

async function main() {
  const payloadPath =
    process.argv[2] ||
    resolve(process.cwd(), 'tmp-zephyr-100steps.json');
  const raw = await readFile(payloadPath, 'utf8');
  const { stepByStep, plainText } = JSON.parse(raw);

  const client = new ZephyrClient();

  console.log('Creating step-by-step test case (100 steps)...');
  try {
    const createdSteps = await client.createTestCase(stepByStep);
    console.log('Step-by-step:', createdSteps.key, createdSteps.id);
  } catch (err: any) {
    console.error('Step-by-step error:', err.response?.data?.message ?? err.message);
    process.exit(1);
  }

  console.log('Creating plain-text test case (same 100 steps as text)...');
  try {
    const createdPlain = await client.createTestCase(plainText);
    console.log('Plain text:', createdPlain.key, createdPlain.id);
  } catch (err: any) {
    console.error('Plain-text error:', err.response?.data?.message ?? err.message);
    process.exit(1);
  }

  console.log('Done.');
}

main();
