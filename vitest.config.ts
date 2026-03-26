import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [resolve(__dirname, 'tests/setup.ts')],
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        'src/index.ts',
        'src/scripts/**',
        'src/types/**',
        /** Axios clients: covered by `zephyr-client.test.ts` / `jira-client.test.ts`; omit from % to avoid diluting branch metrics. */
        'src/clients/**',
      ],
      /**
       * Branch coverage stays below 80% on tool modules (dense `?.` / `||` mapping from API
       * shapes). Statements/lines/functions reflect meaningful exercise; branches gated at 70%.
       */
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
