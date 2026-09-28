import type { ApiError } from '@/api/errors'
import type { CurrentUser } from '@/api/generated/models'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createTestQueryClient, TestQueryClientProvider } from '@/test/query-client'
import { AppRoutes } from './routes'
import { AppSettingsProvider } from './settings'

const apiMocks = vi.hoisted(() => ({
  useGetCurrentUser: vi.fn(),
}))

vi.mock('@/api/generated/admin-api', async () => {
  const actual = await vi.importActual<typeof import('@/api/generated/admin-api')>('@/api/generated/admin-api')
  return { ...actual, useGetCurrentUser: apiMocks.useGetCurrentUser }
})

const currentUser: CurrentUser = {
  id: '00000000-0000-4000-8000-000000000001',
  displayName: '测试管理员',
  email: 'admin@example.com',
  avatarUrl: null,
  permissions: ['*'],
  roleCodes: ['admin'],
  dataScope: 'all',
}

function LocationProbe() {
  const location = useLocation()
  return (
    <output data-testid="location-probe">
      {location.pathname}
      {location.search}
      {location.hash}
      {JSON.stringify(location.state)}
    </output>
  )
}

function renderRoutes(initialEntry = '/dashboard/workplace?tab=roles#details') {
  const queryClient = createTestQueryClient()
  return render(
    <TestQueryClientProvider client={queryClient}>
      <AppSettingsProvider>
        <MemoryRouter initialEntries={[initialEntry]}>
          <AppRoutes />
          <LocationProbe />
        </MemoryRouter>
      </AppSettingsProvider>
    </TestQueryClientProvider>,
  )
}

function apiError(kind: ApiError['kind'], detail: string, status?: number): ApiError {
  return {
    kind,
    status,
    title: detail,
    detail,
    cause: new Error(detail),
  }
}

describe('protected route session states', () => {
  beforeEach(() => {
    apiMocks.useGetCurrentUser.mockReset()
  })

  it('shows a pending state while the session query is unresolved', () => {
    apiMocks.useGetCurrentUser.mockReturnValue({ isPending: true, isError: false, data: undefined })

    renderRoutes()

    expect(screen.getByText('正在加载管理台')).toBeVisible()
    expect(screen.queryByLabelText('工作邮箱')).not.toBeInTheDocument()
  })

  it('renders a protected page after the session succeeds', async () => {
    apiMocks.useGetCurrentUser.mockReturnValue({ isPending: false, isError: false, data: currentUser })

    renderRoutes('/welcome')

    expect(await screen.findByText('欢迎使用 Arco Design Pro', { exact: true })).toBeVisible()
    expect(screen.getByTestId('location-probe')).toHaveTextContent('/welcome')
  })

  it('redirects an unauthenticated user to login with a safe return path', async () => {
    apiMocks.useGetCurrentUser.mockReturnValue({
      isPending: false,
      isError: true,
      data: undefined,
      error: apiError('unauthenticated', '登录已过期', 401),
    })

    renderRoutes('/users?page=2#roles')

    expect(await screen.findByLabelText('工作邮箱')).toBeVisible()
    expect(screen.getByTestId('location-probe')).toHaveTextContent('/login{"from":"/users?page=2#roles"}')
  })

  it.each([
    ['network', '网络不可用'],
    ['timeout', '请求超时'],
    ['server', '会话服务暂时不可用'],
  ] as const)('keeps %s session failures on the page with retry', async (kind, detail) => {
    const refetch = vi.fn()
    apiMocks.useGetCurrentUser.mockReturnValue({
      isPending: false,
      isError: true,
      data: undefined,
      error: apiError(kind, detail, kind === 'server' ? 503 : undefined),
      refetch,
    })

    const user = userEvent.setup()
    renderRoutes('/dashboard/workplace')

    expect(await screen.findByRole('alert')).toHaveTextContent(detail)
    expect(screen.queryByLabelText('工作邮箱')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '重试' }))
    expect(refetch).toHaveBeenCalledOnce()
    expect(screen.getByTestId('location-probe')).toHaveTextContent('/dashboard/workplace')
  })
})
