import eslint from '@eslint/js';
import perfectionist from 'eslint-plugin-perfectionist';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: ['node_modules', '**/*.js'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    files: ['**/*.{ts}'],
    plugins: {
      perfectionist,
    },
    rules: {
      'no-unused-vars': 'off', // use only typescript variant
      '@typescript-eslint/no-unused-vars': [
        {
          varsIgnorePattern: '^[A-Z_]',
          argsIgnorePattern: '^_',
        },
      ],
      semi: ['error', 'always'],
      quotes: ['error', 'single'],
      'no-console': 'error',
      'perfectionist/sort-imports': [
        'error',
        {
          type: 'alphabetical',
          customGroups: [
            {
              groupName: 'shared-constants',
              elementNamePattern: ['constants'],
            },
            {
              groupName: 'shared-utils',
              elementNamePattern: ['utils'],
            },
          ],
          groups: [
            ['type-external'],
            ['builtin'],
            ['external'],
            ['shared-constants'],
            ['shared-utils'],
            ['parent', 'sibling'],
            ['named-type-parent', 'named-type-sibling'],
          ],
          newlinesBetween: 1,
        },
      ],
    },
  },
];
