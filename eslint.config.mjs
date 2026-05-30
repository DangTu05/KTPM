import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import importPlugin from 'eslint-plugin-import';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default [
  {
    ignores: [
      'dist/**/*',
      'node_modules/**/*',
      'test/**/*',
      '**/*.test.ts',
      '**/*.spec.ts',
      'prisma/**',
      'prisma.config.ts',
      'src/generated/**',
    ],
  },

  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{ts,js}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      import: importPlugin,
      prettier: eslintPluginPrettier,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn'],
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/no-floating-promises': 'error',
      'no-console': 'warn',
      'no-unused-vars': 'off',
      'prettier/prettier': 'error',

      eqeqeq: ['error', 'always'],
      'no-lonely-if': 'error',
      'no-trailing-spaces': 'warn',
      'no-multi-spaces': 'warn',
      'no-multiple-empty-lines': ['warn', { max: 1 }],
      'space-before-blocks': ['error', 'always'],
      'object-curly-spacing': ['warn', 'always'],

      'import/no-cycle': 'warn',
      'import/order': [
        'warn',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          'newlines-between': 'always',
        },
      ],
    },
  },
];
