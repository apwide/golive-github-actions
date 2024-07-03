import parser from '@typescript-eslint/parser'
import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

export default [
  {
    ignores: ['dist/', 'src/client/', 'test/', 'vitest.config.ts']
  },
  {
    name: 'github-apwide',
    files: ['*.ts'],
    languageOptions: {
      parser,
      ecmaVersion: 2023
    }
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended
]
