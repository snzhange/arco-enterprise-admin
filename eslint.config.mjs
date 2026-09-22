import antfu from '@antfu/eslint-config'

export default antfu(
  {
    react: true,
    typescript: true,
    ignores: [
      'coverage/**',
      'dist/**',
      'playwright-report/**',
      'public/mockServiceWorker.js',
      'src/api/generated/**',
      'test-results/**',
      'vendor/**',
    ],
  },
  {
    rules: {
      'node/prefer-global/process': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },
)
