import { config } from 'dotenv';
import { z } from 'zod';

config();

const configSchema = z.object({
  JIRA_BASE_URL: z.string().url(),
  JIRA_USERNAME: z.string().email(),
  JIRA_API_TOKEN: z.string().min(1),
  ZEPHYR_API_TOKEN: z.string().min(1),
  ZEPHYR_BASE_URL: z.string().url().optional(),
  ZEPHYR_TM4J_PROJECT_ID: z.string().optional(),
});

let cachedConfig: z.infer<typeof configSchema> | null = null;

const validateConfig = () => {
  try {
    const result = configSchema.safeParse(process.env);
    
    if (!result.success) {
      const errors = result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`);
      const errorMessage = `Configuration validation failed:\n${errors.join('\n')}`;
      console.error(errorMessage);
      console.error('Please ensure the following environment variables are set:');
      console.error('- JIRA_BASE_URL (valid URL)');
      console.error('- JIRA_USERNAME (valid email)');
      console.error('- JIRA_API_TOKEN (non-empty string)');
      console.error('- ZEPHYR_API_TOKEN (non-empty string)');
      throw new Error(errorMessage);
    }
    
    return result.data;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Failed to validate configuration:', errorMessage);
    throw error;
  }
};

export const getAppConfig = () => {
  if (!cachedConfig) {
    cachedConfig = validateConfig();
  }
  return cachedConfig;
};

export const getJiraAuth = () => {
  const config = getAppConfig();
  return {
    username: config.JIRA_USERNAME,
    password: config.JIRA_API_TOKEN,
  };
};

const DEFAULT_ZEPHYR_BASE_URL = 'https://api.zephyrscale.smartbear.com/v2';

export const getZephyrBaseUrl = (): string => {
  const config = getAppConfig();
  return config.ZEPHYR_BASE_URL ?? DEFAULT_ZEPHYR_BASE_URL;
};

export const getZephyrHeaders = () => {
  const config = getAppConfig();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.ZEPHYR_API_TOKEN}`,
  };
};

/** TM4J backend URL used to set test script type (e.g. BDD). Derive from Zephyr Scale base URL. */
export const getTm4jBackendBaseUrl = (): string => {
  const scaleUrl = getZephyrBaseUrl();
  const u = new URL(scaleUrl);
  const host = u.host.replace('api.zephyrscale.', 'app.tm4j.');
  return `${u.protocol}//${host}/backend/rest/tests/2.0`;
};

/** Optional TM4J project id for backend PUT (set BDD script). If unset, use project.id from test case. */
export const getTm4jProjectId = (): number | undefined => {
  const raw = process.env.ZEPHYR_TM4J_PROJECT_ID;
  if (raw == null || raw === '') return undefined;
  const n = Number(raw);
  return Number.isInteger(n) ? n : undefined;
};