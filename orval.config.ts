import { defineConfig } from 'orval'

export default defineConfig({
  adminApi: {
    input: {
      target: './openapi/admin-api.yaml',
    },
    output: {
      target: process.env.ORVAL_OUTPUT_ROOT
        ? './.orval-temp/src/api/generated/admin-api.ts'
        : './src/api/generated/admin-api.ts',
      schemas: process.env.ORVAL_OUTPUT_ROOT
        ? './.orval-temp/src/api/generated/models'
        : './src/api/generated/models',
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
