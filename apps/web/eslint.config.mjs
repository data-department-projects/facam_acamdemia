/**
 * Config ESLint flat pour l'app Next.js (web).
 * Réplique les règles de next/core-web-vitals sans charger eslint-config-next,
 * pour éviter l'erreur "Failed to patch ESLint" de @rushstack/eslint-patch.
 * On n'étend pas plugin:react/recommended (incompatible ESLint 10 / getFilename).
 */
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import parser from '@typescript-eslint/parser';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import pluginJsxA11y from 'eslint-plugin-jsx-a11y';
import pluginImport from 'eslint-plugin-import';
import nextPlugin from '@next/eslint-plugin-next';

const __dirname = dirname(fileURLToPath(import.meta.url));

const tsParserOptions = {
  project: true,
  tsconfigRootDir: __dirname,
};

export default [
  {
    ignores: ['.next/**', 'node_modules/**', 'out/**'],
  },
  // Fichiers .js uniquement (configs)
  {
    files: ['**/*.js'],
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
    rules: {},
  },
  // Fichiers TypeScript (.ts) : parser TS uniquement
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser,
      parserOptions: tsParserOptions,
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
    rules: {},
  },
  // Fichiers React/Next (.tsx, .jsx) : parser TS pour .tsx + Next + react-hooks + jsx-a11y
  {
    files: ['**/*.tsx', '**/*.jsx'],
    languageOptions: {
      parser,
      parserOptions: {
        ...tsParserOptions,
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
      'react-hooks': pluginReactHooks,
      'jsx-a11y': pluginJsxA11y,
      import: pluginImport,
      '@next/next': nextPlugin,
    },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      'import/no-anonymous-default-export': 'warn',
      'jsx-a11y/alt-text': [
        'warn',
        { elements: ['img'], img: ['Image'] },
      ],
      'jsx-a11y/aria-props': 'warn',
      'jsx-a11y/aria-proptypes': 'warn',
      'jsx-a11y/aria-unsupported-elements': 'warn',
      'jsx-a11y/role-has-required-aria-props': 'warn',
      'jsx-a11y/role-supports-aria-props': 'warn',
    },
  },
];
