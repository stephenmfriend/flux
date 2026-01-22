import tailwindcss from 'eslint-plugin-tailwindcss'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'

export default [
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      tailwindcss,
    },
    rules: {
      'tailwindcss/no-custom-classname': 'warn',
      'tailwindcss/classnames-order': 'warn',
    },
    settings: {
      tailwindcss: {
        config: './tailwind.config.js',
      },
    },
  },
]
