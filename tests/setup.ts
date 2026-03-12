/**
 * Test setup: load .env so real credentials are available for contract tests.
 * Unit tests must set dummy env in their own beforeAll so nock intercepts (see zephyr-client.test.ts).
 */
import { config } from 'dotenv';
config();
