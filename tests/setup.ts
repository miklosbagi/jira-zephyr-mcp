/**
 * Test setup: set minimal env so getAppConfig() passes when the client is created.
 * Must run before any code that imports config or ZephyrClient.
 */
process.env.JIRA_BASE_URL = 'https://example.atlassian.net';
process.env.JIRA_USERNAME = 'test@example.com';
process.env.JIRA_API_TOKEN = 'test-jira-token';
process.env.ZEPHYR_API_TOKEN = 'test-zephyr-token';
process.env.ZEPHYR_BASE_URL = 'https://api.zephyrscale.smartbear.com/v2';
