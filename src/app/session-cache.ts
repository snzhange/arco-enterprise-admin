import type { QueryClient } from '@tanstack/react-query'

// An authentication boundary invalidates every user-scoped result, including in-flight requests.
export async function clearSessionCache(queryClient: QueryClient): Promise<void> {
  await queryClient.cancelQueries()
  queryClient.clear()
}
