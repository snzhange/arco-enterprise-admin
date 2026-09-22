import type { CurrentUser } from '@/api/generated/models'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '@/app/auth'
import { UsersPage } from './UsersPage'

const apiMocks = vi.hoisted(() => ({
  useListRoleOptions: vi.fn(),
}))

vi.mock('@/api/generated/admin-api', () => ({
  getListUsersQueryKey: () => ['/api/users'],
  useCreateUser: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useListRoleOptions: apiMocks.useListRoleOptions,
  useListUsers: () => ({
    data: { content: [], page: 0, size: 10, totalElements: 0, totalPages: 0 },
    isPending: false,
  }),
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
        <UsersPage />
      </AuthProvider>
    </QueryClientProvider>,
  )
}

describe('users page role directory states', () => {
  beforeEach(() => {
    apiMocks.useListRoleOptions.mockReset()
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

    expect(await screen.findByText(message)).toBeVisible()
    expect(screen.getByRole('button', { name: '保存' })).toBeDisabled()
  })
})
