import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { getGetCurrentUserQueryKey, getListUsersQueryKey } from '@/api/generated/admin-api'
import { clearSessionCache } from './session-cache'

describe('clearSessionCache', () => {
  it('removes both the previous identity and its cached business results', async () => {
    const client = new QueryClient()
    const sessionKey = getGetCurrentUserQueryKey()
    const usersKey = getListUsersQueryKey({ page: 0, size: 10 })
    client.setQueryData(sessionKey, { id: 'previous-user' })
    client.setQueryData(usersKey, { content: [{ email: 'previous@example.com' }] })

    await clearSessionCache(client)

    expect(client.getQueryData(sessionKey)).toBeUndefined()
    expect(client.getQueryData(usersKey)).toBeUndefined()
    expect(client.getQueryCache().getAll()).toHaveLength(0)
  })

  it('cancels in-flight results before the next identity can use the cache', async () => {
    const client = new QueryClient()
    const queryKey = ['/api/users', { page: 1 }]
    let aborted = false
    const pending = client.fetchQuery({
      queryKey,
      queryFn: ({ signal }) => new Promise<string>((resolve) => {
        signal.addEventListener('abort', () => {
          aborted = true
          resolve('result from previous user')
        }, { once: true })
      }),
    }).catch(() => undefined)

    await clearSessionCache(client)
    await pending

    expect(aborted).toBe(true)
    expect(client.getQueryData(queryKey)).toBeUndefined()
  })
})
