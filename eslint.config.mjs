/**
 * Config ESLint racine (format flat v9+) pour lint-staged lors des commits.
 * Utilise le parser TypeScript pour .ts/.tsx (décorateurs NestJS, JSX, types).
 * Chaque app (web, api) garde sa propre config pour `npm run lint`.
 */
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import parser from '@typescript-eslint/parser';
import plugin from '@typescript-eslint/eslint-plugin';
import pluginReactHooks from 'eslint-plugin-react-hooks';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/coverage/**',
      '**/.turbo/**',
      '**/build/**',
      '**/next-env.d.ts',
    ],
  },
  // Fichiers JS purs (configs, etc.)
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'writable',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  // Fichiers TypeScript (.ts)
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser,
      parserOptions: {
        project: [
          './apps/api/tsconfig.json',
          './apps/web/tsconfig.json',
          './packages/shared/tsconfig.json',
        ],
        tsconfigRootDir: __dirname,
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'writable',
      },
    },
    plugins: { '@typescript-eslint': plugin },
    rules: {
      ...plugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  // Fichiers TypeScript + JSX (.tsx, .jsx)
  {
    files: ['**/*.tsx', '**/*.jsx'],
    languageOptions: {
      parser,
      parserOptions: {
        project: [
          './apps/api/tsconfig.json',
          './apps/web/tsconfig.json',
          './packages/shared/tsconfig.json',
        ],
        tsconfigRootDir: __dirname,
        ecmaFeatures: { jsx: true },
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        React: 'readonly',
        JSX: 'readonly',
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'writable',
      },
    },
    plugins: {
      '@typescript-eslint': plugin,
      'react-hooks': pluginReactHooks,
    },
    rules: {
      ...plugin.configs.recommended.rules,
      ...pluginReactHooks.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
];
