import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'scripts/**/*.{test,spec}.{js,mjs}'],
    exclude: ['node_modules/**', 'vendor/**'],
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      thresholds: {
        lines: 33,
        branches: 42,
      },
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/api/generated/**',
        'src/main.tsx',
        'src/mocks/**',
        'src/test/**',
      ],
    },
  },
})
