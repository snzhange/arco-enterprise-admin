import { describe, expect, it } from 'vitest'
import { cleanupTestQueryClient, createTestQueryClient } from './query-client'

describe('test query client helper', () => {
  it('cancels in-flight queries and clears cache between tests', async () => {
    const client = createTestQueryClient()
    const queryKey = ['isolated-query']
    let aborted = false
    const pending = client.fetchQuery({
      queryKey,
      queryFn: ({ signal }) => new Promise<string>((resolve) => {
        signal.addEventListener('abort', () => {
          aborted = true
          resolve('cancelled')
        }, { once: true })
      }),
    }).catch(() => undefined)

    client.setQueryData(['previous-test'], { value: true })
    await cleanupTestQueryClient(client)
    await pending

    expect(aborted).toBe(true)
    expect(client.getQueryCache().getAll()).toHaveLength(0)
    expect(client.getQueryData(['previous-test'])).toBeUndefined()
  })
})
