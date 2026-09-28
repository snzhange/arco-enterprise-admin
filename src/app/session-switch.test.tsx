import type { CurrentUser } from '@/api/generated/models'

import { QueryClient } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axios from 'axios'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getListUsersQueryKey } from '@/api/generated/admin-api'
import { httpClient, request } from '@/api/http'
import { AuthProvider, useAuth } from '@/app/auth'
import { getVisibleNavigationGroups } from '@/app/route-manifest'
import { configureSessionExpiredHandler, resetSessionExpired } from '@/app/session-expired'
import { AppSettingsProvider } from '@/app/settings'
import { LoginPage } from '@/pages/LoginPage'
import { TestQueryClientProvider } from '@/test/query-client'

const apiMocks = vi.hoisted(() => ({
  useLogin: vi.fn(),
}))

vi.mock('@/api/generated/admin-api', async () => {
  const actual = await vi.importActual<typeof import('@/api/generated/admin-api')>('@/api/generated/admin-api')
  return { ...actual, useLogin: apiMocks.useLogin }
})

interface MutationCallbacks {
  onSuccess?: (data: unknown, variables: unknown, context: unknown) => void | Promise<void>
}

const adminUser: CurrentUser = {
  id: '00000000-0000-0000-0000-000000000001',
  displayName: '旧管理员',
  email: 'admin@example.com',
  avatarUrl: null,
  permissions: ['*'],
  roleCodes: ['admin'],
  dataScope: 'all',
}

const operatorUser: CurrentUser = {
  id: '00000000-0000-0000-0000-000000000002',
  displayName: '新运营用户',
  email: 'operator@arco.dev',
  avatarUrl: null,
  permissions: ['dashboard:read', 'users:read'],
  roleCodes: ['operator'],
  dataScope: 'department',
}

function PermissionSnapshot() {
  const user = useAuth()
  const paths = getVisibleNavigationGroups(user).flatMap(group => group.children.map(item => item.key))
  return <output data-testid="visible-routes">{paths.join(',')}</output>
}

function axiosUnauthorized() {
  return new axios.AxiosError('expired', undefined, undefined, undefined, {
    status: 401,
    statusText: 'Unauthorized',
    headers: {},
    config: {},
    data: { title: 'Unauthorized', status: 401, detail: '登录已过期' },
  } as never)
}

describe('same-tab account switching', () => {
  let latestOptions: { mutation?: MutationCallbacks } | undefined
  let mutate: ReturnType<typeof vi.fn>

  beforeEach(() => {
    latestOptions = undefined
    mutate = vi.fn()
    apiMocks.useLogin.mockReset()
    apiMocks.useLogin.mockImplementation((options: { mutation?: MutationCallbacks }) => {
      latestOptions = options
      return { isPending: false, mutate }
    })
    resetSessionExpired()
    configureSessionExpiredHandler(undefined)
  })

  it('does not reuse old user data and applies the new account permissions', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 60_000 } } })
    const usersKey = getListUsersQueryKey({ page: 0, size: 10 })
    client.setQueryData(['/api/auth/session'], adminUser)
    client.setQueryData(usersKey, { content: [{ id: 'old-user' }], totalElements: 1 })
    const user = userEvent.setup()
    const view = render(
      <TestQueryClientProvider client={client}>
        <AppSettingsProvider>
          <MemoryRouter initialEntries={['/login']}>
            <LoginPage />
          </MemoryRouter>
        </AppSettingsProvider>
      </TestQueryClientProvider>,
    )

    await user.click(screen.getByRole('button', { name: '登录工作台' }))
    await waitFor(() => expect(mutate).toHaveBeenCalledOnce())
    await act(async () => {
      await latestOptions?.mutation?.onSuccess?.(undefined, { data: { email: 'operator@arco.dev', password: 'operator1234' } }, undefined)
    })

    expect(client.getQueryData(usersKey)).toBeUndefined()
    const freshUsers = [{ id: 'new-user', owner: operatorUser.email }]
    const result = await client.fetchQuery({
      queryKey: usersKey,
      queryFn: async () => ({ content: freshUsers, totalElements: freshUsers.length }),
    })
    expect(result.content).toEqual(freshUsers)

    view.unmount()
    render(
      <AuthProvider user={operatorUser}>
        <PermissionSnapshot />
      </AuthProvider>,
    )
    expect(screen.getByTestId('visible-routes')).toHaveTextContent('/users')
    expect(screen.getByTestId('visible-routes')).not.toHaveTextContent('/roles')
  })

  it('coordinates concurrent business 401 responses into one session-expired handling', async () => {
    const handler = vi.fn()
    configureSessionExpiredHandler(handler)
    vi.spyOn(httpClient, 'request').mockRejectedValue(axiosUnauthorized())

    const results = await Promise.allSettled([
      request({ url: '/api/users', method: 'GET' }),
      request({ url: '/api/dashboard/summary', method: 'GET' }),
    ])

    expect(results).toHaveLength(2)
    expect(results.every(result => result.status === 'rejected')).toBe(true)
    expect(handler).toHaveBeenCalledOnce()
  })
})
