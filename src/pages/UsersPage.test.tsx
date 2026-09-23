import type { CurrentUser } from '@/api/generated/models'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '@/app/auth'
import { UsersPage } from './UsersPage'

const apiMocks = vi.hoisted(() => ({
  useListRoleOptions: vi.fn(),
  useListUsers: vi.fn(),
}))

vi.mock('@/api/generated/admin-api', () => ({
  getListUsersQueryKey: () => ['/api/users'],
  useCreateUser: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useListRoleOptions: apiMocks.useListRoleOptions,
  useListUsers: apiMocks.useListUsers,
  useUpdateUser: () => ({ isPending: false, mutateAsync: vi.fn() }),
}))

const adminUser: CurrentUser = {
  id: '00000000-0000-4000-8000-000000000001',
  displayName: '测试管理员',
  email: 'admin@example.com',
  avatarUrl: null,
  permissions: ['users:read', 'users:write'],
  roleCodes: ['admin'],
  dataScope: 'all',
}

function renderUsersPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider user={adminUser}>
        <MemoryRouter>
          <UsersPage />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  )
}

describe('users page role directory states', () => {
  beforeEach(() => {
    apiMocks.useListRoleOptions.mockReset()
    apiMocks.useListRoleOptions.mockReturnValue({ data: [{ code: 'operator', name: '运营人员', active: true }], isPending: false, isError: false })
    apiMocks.useListUsers.mockReset()
    apiMocks.useListUsers.mockReturnValue({
      data: { content: [], page: 0, size: 10, totalElements: 0, totalPages: 0 },
      isPending: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    })
  })

  it.each([
    {
      name: 'failed',
      query: { data: undefined, isPending: false, isError: true },
      message: '角色目录加载失败，请稍后重试。',
    },
    {
      name: 'empty',
      query: { data: [], isPending: false, isError: false },
      message: '暂无可分配角色。',
    },
  ])('disables user submission when the role directory is $name', async ({ query, message }) => {
    apiMocks.useListRoleOptions.mockReturnValue(query)
    const user = userEvent.setup()
    renderUsersPage()

    await user.click(screen.getByRole('button', { name: '新增用户' }))

    expect(await screen.findByText(message, { selector: '.arco-typography' })).toBeVisible()
    expect(screen.getByRole('button', { name: '保存' })).toBeDisabled()
  })

  it('keeps keyword local while restoring list state from the URL and requests only needed role data', async () => {
    const user = userEvent.setup()
    const { container } = renderUsersPage()
    const queryCall = apiMocks.useListUsers.mock.calls.find(call => call[0] && typeof call[0] === 'object')
    expect(queryCall?.[0]).toMatchObject({ page: 0, size: 10 })

    await user.type(screen.getByLabelText('关键词'), 'private-name@example.com')
    await user.click(screen.getByRole('button', { name: '查询' }))
    expect(apiMocks.useListUsers.mock.calls.some(call => (call[0] as { keyword?: string } | undefined)?.keyword === 'private-name@example.com')).toBe(true)
    expect(container.querySelector('.users-page')).toBeInTheDocument()
    expect(apiMocks.useListRoleOptions.mock.calls.some(call => call[0]?.query?.enabled === true)).toBe(true)
  })

  it('does not request the role directory for a read-only user', () => {
    apiMocks.useListRoleOptions.mockReturnValue({ data: undefined, isPending: false, isError: false })
    render(
      <QueryClientProvider client={new QueryClient()}>
        <AuthProvider user={{ ...adminUser, permissions: ['users:read'], roleCodes: ['list-reader'] }}>
          <MemoryRouter><UsersPage /></MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>,
    )

    expect(apiMocks.useListRoleOptions.mock.calls.some(call => call[0]?.query?.enabled === false)).toBe(true)
  })
})
