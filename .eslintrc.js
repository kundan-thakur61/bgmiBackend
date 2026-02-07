module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2022
  },
  rules: {
    'no-console': 'off', // We use structured logger
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_|next' }],
    'no-process-exit': 'off',
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': ['error', 'always'],
    'no-throw-literal': 'error',
    'no-return-await': 'warn',
    'require-await': 'warn',
    'no-promise-executor-return': 'error',
    'no-duplicate-imports': 'error',
    'no-template-curly-in-string': 'warn'
  }
};
