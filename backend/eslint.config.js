const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const globals = require('globals');
const localRules = require('./eslint-local-rules');

// Flat-config port of the old .eslintrc.json. Same narrow surface: eslint:recommended
// + the @typescript-eslint parser and three rules, plus the local COPPA rule.
module.exports = tseslint.config(
  { ignores: ['dist/**', 'coverage/**', 'node_modules/**'] },

  js.configs.recommended,

  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
      globals: { ...globals.node, ...globals.es2020, ...globals.jest },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      'local-rules': { rules: localRules },
    },
    rules: {
      'no-console': 'warn',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      'local-rules/no-exact-dob-or-gps': 'error',
    },
  },

  {
    files: [
      'src/__tests__/compliance/pii-scrubbing.test.ts',
      'src/services/openweather.ts',
      'src/routes/external-apis.ts',
    ],
    rules: { 'local-rules/no-exact-dob-or-gps': 'off' },
  },
);
