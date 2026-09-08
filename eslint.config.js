import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      'dist',
      'dev-dist',
      'coverage',
      'node_modules',
      'playwright-report',
      'test-results',
      // Scratch worktrees; they are whole checkouts and lint themselves.
      '.claude/worktrees',
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        project: ['./tsconfig.app.json', './tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-restricted-syntax': [
        'error',
        {
          // ADR-002 / PLAN §6: lib code must take `today` as a parameter so
          // every derived value is testable at a fixed date.
          selector: 'NewExpression[callee.name="Date"]',
          message: 'Pass `today` in as a parameter instead of reading the clock here.',
        },
      ],
    },
  },
  {
    // Only `lib/` is held to the no-clock rule; the app shell has to read it once.
    files: ['src/**/*.{ts,tsx}', 'scripts/**/*.ts', 'tests/**/*.{ts,tsx}'],
    ignores: ['src/lib/**/*.ts'],
    rules: { 'no-restricted-syntax': 'off' },
  },
  prettier,
);
