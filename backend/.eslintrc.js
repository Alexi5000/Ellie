module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/triple-slash-reference': 'warn',
    '@typescript-eslint/no-var-requires': 'warn',
    '@typescript-eslint/no-this-alias': 'warn',
    '@typescript-eslint/ban-types': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    'no-debugger': 'error',
    'no-inner-declarations': 'warn',
    'prefer-const': 'warn',
    'no-case-declarations': 'warn',
  },
  ignorePatterns: [
    'dist',
    'node_modules',
    '*.config.js',
    'coverage',
  ],
};
