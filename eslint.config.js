import tseslintPlugin from '@typescript-eslint/eslint-plugin';

/**
 * ESLint flat config (ESM).
 * - Uses @typescript-eslint's `flat/recommended` baseline.
 * - Adds a few "best practices" rules that typically pay off quickly without
 *   enforcing heavy type-aware constraints.
 *
 * Run via `npm run lint` / `lint:fix` so the CLI uses `--max-warnings=0`
 * (any warning fails). Prefer that over raw `eslint` so CI and local match.
 */
export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  },
  ...tseslintPlugin.configs['flat/recommended'],
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        Buffer: 'readonly',
      },
    },
    rules: {
      // This repo intentionally uses `any` in a few places (Axios error payloads,
      // partially typed Zephyr responses, etc.). We keep lint coverage focused on
      // higher-signal issues, and avoid making this rule a blocker.
      '@typescript-eslint/no-explicit-any': 'off',

      // Prevent unused variables while keeping the common convention
      // of prefixing unused args with `_`.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // Encourage `import type` usage for type-only imports (error: no warnings).
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],

      // Safer JS best practice. (Low risk for this codebase.)
      'prefer-const': 'error',
    },
  },
];

