import { defineConfig } from 'orval'

export default defineConfig({
  adminApi: {
    input: {
      target: './openapi/admin-api.yaml',
    },
    output: {
      target: './src/api/generated/admin-api.ts',
      schemas: './src/api/generated/models',
      client: 'react-query',
      httpClient: 'axios',
      clean: true,
      override: {
        mutator: {
          path: './src/api/http.ts',
          name: 'request',
        },
        query: {
          signal: true,
        },
      },
    },
  },
})
