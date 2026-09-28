import type { CurrentUser } from '@/api/generated/models'

import { QueryClient } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '@/app/auth'
import { AppSettingsProvider } from '@/app/settings'
import { createTestQueryClient, TestQueryClientProvider } from '@/test/query-client'
import { AppLayout } from './AppLayout'

const apiMocks = vi.hoisted(() => ({
  useLogout: vi.fn(),
}))

const sessionMocks = vi.hoisted(() => ({
  clearMockSession: vi.fn(),
}))

vi.mock('@/api/generated/admin-api', async () => {
  const actual = await vi.importActual<typeof import('@/api/generated/admin-api')>('@/api/generated/admin-api')
  return { ...actual, useLogout: apiMocks.useLogout }
})

vi.mock('@/mocks/session', async () => {
  const actual = await vi.importActual<typeof import('@/mocks/session')>('@/mocks/session')
  return { ...actual, clearMockSession: sessionMocks.clearMockSession }
})

interface MutationCallbacks {
  onError?: (error: unknown, variables: unknown, context: unknown) => void
  onSuccess?: (data: unknown, variables: unknown, context: unknown) => void | Promise<void>
}

const currentUser: CurrentUser = {
  id: '00000000-0000-0000-0000-000000000001',
  displayName: '测试管理员',
  email: 'admin@example.com',
  avatarUrl: null,
  permissions: ['*'],
  roleCodes: ['admin'],
  dataScope: 'all',
}

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location-probe">{location.pathname}</output>
}

function renderLayout(client: QueryClient) {
  return render(
    <TestQueryClientProvider client={client}>
      <AppSettingsProvider>
        <AuthProvider user={currentUser}>
          <MemoryRouter initialEntries={['/dashboard/workplace']}>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/dashboard/workplace" element={<div>当前工作台</div>} />
              </Route>
              <Route path="/login" element={<div data-testid="login-placeholder">登录页</div>} />
            </Routes>
            <LocationProbe />
          </MemoryRouter>
        </AuthProvider>
      </AppSettingsProvider>
    </TestQueryClientProvider>,
  )
}

describe('logout boundaries', () => {
  let latestOptions: { mutation?: MutationCallbacks } | undefined
  let mutate: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.stubEnv('VITE_ENABLE_MOCK', 'true')
    latestOptions = undefined
    mutate = vi.fn()
    apiMocks.useLogout.mockReset()
    apiMocks.useLogout.mockImplementation((options: { mutation?: MutationCallbacks }) => {
      latestOptions = options
      return { isPending: false, mutate }
    })
    sessionMocks.clearMockSession.mockReset()
  })

  it('clears mock session and query cache before navigating after a successful logout', async () => {
    const client = createTestQueryClient()
    client.setQueryData(['/api/auth/session'], currentUser)
    client.setQueryData(['/api/users'], { content: ['old-user'] })
    const user = userEvent.setup()
    renderLayout(client)

    await user.click(screen.getByText('测', { exact: true }))
    fireEvent.click(await screen.findByText('退出登录', { exact: true }))
    await waitFor(() => expect(mutate).toHaveBeenCalledOnce())
    await act(async () => {
      await latestOptions?.mutation?.onSuccess?.(undefined, undefined, undefined)
    })

    expect(sessionMocks.clearMockSession).toHaveBeenCalledOnce()
    expect(client.getQueryCache().getAll()).toHaveLength(0)
    expect(screen.getByTestId('login-placeholder')).toBeVisible()
    expect(screen.getByTestId('location-probe')).toHaveTextContent('/login')
  })

  it('keeps the current session and route when logout fails', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 60_000 } } })
    const cachedSession = { ...currentUser, displayName: '当前会话' }
    client.setQueryData(['/api/auth/session'], cachedSession)
    client.setQueryData(['/api/users'], { content: ['current-user-data'] })
    const user = userEvent.setup()
    renderLayout(client)

    await user.click(screen.getByText('测', { exact: true }))
    fireEvent.click(await screen.findByText('退出登录', { exact: true }))
    await waitFor(() => expect(mutate).toHaveBeenCalledOnce())
    await act(async () => {
      latestOptions?.mutation?.onError?.(new Error('logout failed'), undefined, undefined)
    })

    expect(screen.getByText('当前工作台')).toBeVisible()
    expect(screen.getByTestId('location-probe')).toHaveTextContent('/dashboard/workplace')
    expect(client.getQueryData(['/api/auth/session'])).toEqual(cachedSession)
    expect(client.getQueryData(['/api/users'])).toEqual({ content: ['current-user-data'] })
    expect(sessionMocks.clearMockSession).not.toHaveBeenCalled()
  })
})
