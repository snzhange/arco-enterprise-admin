import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
}

export function TestQueryClientProvider({ client, children }: { client?: QueryClient, children: ReactNode }) {
  return <QueryClientProvider client={client ?? createTestQueryClient()}>{children}</QueryClientProvider>
}

export async function cleanupTestQueryClient(client: QueryClient): Promise<void> {
  await client.cancelQueries()
  client.clear()
}
