import js from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import reactHooks from 'eslint-plugin-react-hooks'

const sharedGlobals = {
  URL: 'readonly',
  clearInterval: 'readonly',
  clearTimeout: 'readonly',
  console: 'readonly',
  setInterval: 'readonly',
  setTimeout: 'readonly',
}

const nodeGlobals = {
  ...sharedGlobals,
  Buffer: 'readonly',
  __dirname: 'readonly',
  module: 'readonly',
  process: 'readonly',
  require: 'readonly',
}

const browserGlobals = {
  ...sharedGlobals,
  HTMLElement: 'readonly',
  document: 'readonly',
  fetch: 'readonly',
  window: 'readonly',
}

export default [
  {
    ignores: [
      'dist-web/**',
      'dist-electron/**',
      'out/**',
      'node_modules/**',
      '.eslintrc-auto-import.json',
      'auto-imports.d.ts',
      'vite.config.ts',
      'postcss.config.js',
      'tailwind.config.js',
      'dev-electron.mjs',
      'test.js',
      'resources/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      globals: nodeGlobals,
    },
  },
  {
    files: ['plugins/dev-inspect-client.js'],
    languageOptions: {
      globals: {
        ...browserGlobals,
        __WBX_BASE__: 'readonly',
        __WBX_ROOT__: 'readonly',
      },
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...nodeGlobals,
        ...browserGlobals,
        React: 'readonly',
        useState: 'readonly',
        useEffect: 'readonly',
        useRef: 'readonly',
        useMemo: 'readonly',
        useCallback: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooks,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-undef': 'off',
    },
  },
]
