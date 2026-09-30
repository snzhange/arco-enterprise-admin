import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const analyze = process.env.BUILD_ANALYZE === 'true'

  return {
    plugins: [
      react(),
      ...(analyze ? [visualizer({ filename: 'dist/bundle-analysis.html', gzipSize: true, brotliSize: true, open: false })] : []),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy: env.VITE_API_PROXY_TARGET
        ? {
            '/api': {
              target: env.VITE_API_PROXY_TARGET,
              changeOrigin: true,
            },
          }
        : undefined,
    },
    preview: {
      port: 4173,
      strictPort: true,
    },
  }
})
