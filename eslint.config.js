import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**', 'playwright-report/**', 'test-results/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['packages/engine/src/**/*.ts'],
    rules: {
      'no-restricted-globals': ['error', 'window', 'document', 'localStorage', 'indexedDB'],
      'no-restricted-imports': [
        'error',
        { patterns: ['react', 'react-dom', 'openai', '@openai/*'] },
      ],
    },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}', 'packages/content-runtime/src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@psychsim/engine/*', '**/engine/src/*', '**/engine/src/**'],
              message:
                'Web and content-runtime code may import only the ordinary @psychsim/engine root. Use @psychsim/engine/authoring only from quarantined developer-side tooling.',
            },
          ],
        },
      ],
    },
  },
);
