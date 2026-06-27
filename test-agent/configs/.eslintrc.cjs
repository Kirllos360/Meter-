module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint', 'security'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-expressions': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'security/detect-possible-timing-attacks': 'warn',
    'security/detect-eval-with-expression': 'error',
    'security/detect-non-literal-fs-filename': 'warn',
    'security/detect-non-literal-require': 'warn',
    'security/detect-child-process': 'warn',
    'security/detect-buffer-noassert': 'error',
    'security/detect-new-buffer': 'warn',
    'security/detect-object-injection': 'warn',
    'security/detect-disable-mustache-escape': 'error'
  },
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  ignorePatterns: ['dist/', 'node_modules/', 'jest.config.ts', 'test/']
};
