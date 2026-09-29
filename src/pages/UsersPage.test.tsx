import type { CurrentUser, User } from '@/api/generated/models'

import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '@/app/auth'
import { createTestQueryClient, TestQueryClientProvider } from '@/test/query-client'
import { UsersPage } from './UsersPage'

const apiMocks = vi.hoisted(() => ({
  createUser: vi.fn(),
  useListRoleOptions: vi.fn(),
  useListUsers: vi.fn(),
  updateUser: vi.fn(),
}))

vi.mock('@/api/generated/admin-api', () => ({
  getListUsersQueryKey: () => ['/api/users'],
  useCreateUser: () => ({ isPending: false, mutateAsync: apiMocks.createUser }),
  useListRoleOptions: apiMocks.useListRoleOptions,
  useListUsers: apiMocks.useListUsers,
  useUpdateUser: () => ({ isPending: false, mutateAsync: apiMocks.updateUser }),
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

const operatorUser: User = {
  id: '00000000-0000-4000-8000-000000000102',
  name: '周明',
  email: 'zhou.ming@arco.dev',
  department: '技术平台部',
  status: 'active',
  roleCodes: ['operator'],
  lastActiveAt: '2026-09-06T09:21:00+08:00',
}

function renderUsersPage(user: CurrentUser = adminUser, client = createTestQueryClient()) {
  return render(
    <TestQueryClientProvider client={client}>
      <AuthProvider user={user}>
        <MemoryRouter>
          <UsersPage />
        </MemoryRouter>
      </AuthProvider>
    </TestQueryClientProvider>,
  )
}

function getEditorDrawer(title: '新增用户' | '编辑用户'): HTMLElement {
  const drawer = screen
    .getAllByText(title, { exact: true })
    .map(element => element.closest('.arco-drawer'))
    .find((element): element is HTMLElement => Boolean(element))
  if (!drawer)
    throw new Error(`未找到${title}抽屉`)
  return drawer
}

describe('users page role directory states', () => {
  beforeEach(() => {
    apiMocks.createUser.mockReset()
    apiMocks.createUser.mockResolvedValue(undefined)
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
    apiMocks.updateUser.mockReset()
    apiMocks.updateUser.mockResolvedValue(undefined)
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
      <TestQueryClientProvider>
        <AuthProvider user={{ ...adminUser, permissions: ['users:read'], roleCodes: ['list-reader'] }}>
          <MemoryRouter><UsersPage /></MemoryRouter>
        </AuthProvider>
      </TestQueryClientProvider>,
    )

    expect(apiMocks.useListRoleOptions.mock.calls.some(call => call[0]?.query?.enabled === false)).toBe(true)
  })
})

describe('users page core workflows', () => {
  beforeEach(() => {
    apiMocks.createUser.mockReset()
    apiMocks.createUser.mockResolvedValue(undefined)
    apiMocks.updateUser.mockReset()
    apiMocks.updateUser.mockResolvedValue(undefined)
    apiMocks.useListRoleOptions.mockReset()
    apiMocks.useListRoleOptions.mockReturnValue({
      data: [
        { code: 'operator', name: '运营人员', active: true },
        { code: 'finance', name: '财务人员', active: false },
      ],
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    })
    apiMocks.useListUsers.mockReset()
    apiMocks.useListUsers.mockReturnValue({
      data: { content: [operatorUser], page: 0, size: 10, totalElements: 1, totalPages: 1 },
      isPending: false,
      isFetching: false,
      isError: false,
      isPlaceholderData: false,
      refetch: vi.fn(),
    })
  })

  it('opens details, edits with stable role codes, and creates a user', async () => {
    const user = userEvent.setup()
    renderUsersPage()

    const row = screen.getByRole('row', { name: /周明/ })
    await user.click(within(row).getByRole('button', { name: '查看' }))
    expect(screen.getByText('用户详情')).toBeVisible()
    expect(screen.getAllByText('zhou.ming@arco.dev').at(-1)).toBeVisible()
    const detailDrawer = screen.getByText('用户详情', { selector: '.arco-drawer-header-title' }).closest('.arco-drawer') as HTMLElement
    fireEvent.click(detailDrawer.querySelector('.arco-drawer-close-icon') as HTMLElement)
    await waitFor(() => expect(screen.queryByText('用户详情', { selector: '.arco-drawer-header-title' })).not.toBeInTheDocument())

    await user.click(within(row).getByRole('button', { name: '编辑' }))
    expect(screen.getByText('编辑用户')).toBeVisible()
    await user.click(screen.getAllByRole('button', { name: '保存' }).at(-1) as HTMLElement)
    await waitFor(() => expect(apiMocks.updateUser).toHaveBeenCalledWith({
      userId: operatorUser.id,
      data: { name: '周明', department: '技术平台部', status: 'active', roleCodes: ['operator'] },
    }))
    expect(apiMocks.updateUser.mock.calls[0][0].data).not.toHaveProperty('email')
    expect(apiMocks.updateUser.mock.calls[0][0].data).not.toHaveProperty('roles')

    await user.click(screen.getByRole('button', { name: '新增用户' }))
    const drawer = getEditorDrawer('新增用户')
    await user.type(within(drawer).getByLabelText('姓名'), '新用户')
    await user.type(within(drawer).getByLabelText('工作邮箱'), 'new-user@arco.dev')
    await user.type(within(drawer).getByLabelText('部门'), '产品部')
    await user.click(within(drawer).getByText('选择角色', { exact: true }))
    const createOption = await screen.findByRole('option', { name: '运营人员' })
    fireEvent.click(within(createOption).getByText('运营人员', { exact: true }))
    await user.click(within(drawer).getByRole('button', { name: '保存' }))
    await waitFor(() => expect(apiMocks.createUser).toHaveBeenCalledWith({
      data: { name: '新用户', email: 'new-user@arco.dev', department: '产品部', roleCodes: ['operator'] },
    }))
  })

  it('keeps the editor open with field and form errors after a validation failure', async () => {
    const user = userEvent.setup()
    apiMocks.createUser.mockRejectedValue({
      kind: 'validation',
      title: '请求参数有误',
      detail: '请检查用户信息',
      fieldErrors: [{ field: 'email', message: '邮箱已存在' }],
      cause: null,
    })
    renderUsersPage()
    await user.click(screen.getByRole('button', { name: '新增用户' }))
    const drawer = getEditorDrawer('新增用户')
    await user.type(within(drawer).getByLabelText('姓名'), '新用户')
    await user.type(within(drawer).getByLabelText('工作邮箱'), 'duplicate@arco.dev')
    await user.type(within(drawer).getByLabelText('部门'), '产品部')
    await user.click(within(drawer).getByText('选择角色', { exact: true }))
    const validationOption = await screen.findByRole('option', { name: '运营人员' })
    fireEvent.click(within(validationOption).getByText('运营人员', { exact: true }))
    await user.click(within(drawer).getByRole('button', { name: '保存' }))

    expect(await within(drawer).findByText('请检查用户信息', { selector: '.form-error' })).toBeVisible()
    expect(screen.getByText('邮箱已存在')).toBeVisible()
    expect(within(drawer).getByDisplayValue('duplicate@arco.dev')).toBeVisible()
    expect(within(drawer).getByText('新增用户', { selector: '.arco-drawer-header-title' })).toBeVisible()
  })

  it('keeps the editor after a forbidden mutation and renders retryable list errors', async () => {
    const user = userEvent.setup()
    apiMocks.updateUser.mockRejectedValue({ kind: 'forbidden', title: '没有操作权限', cause: null })
    renderUsersPage()
    const row = screen.getByRole('row', { name: /周明/ })
    await user.click(within(row).getByRole('button', { name: '编辑' }))
    await user.click(screen.getAllByRole('button', { name: '保存' }).at(-1) as HTMLElement)
    await waitFor(() => expect(screen.getAllByRole('alert').some(element => element.textContent?.includes('没有操作权限'))).toBe(true))
    expect(screen.getByText('编辑用户')).toBeVisible()

    cleanup()
    const refetch = vi.fn()
    apiMocks.useListUsers.mockReturnValue({
      data: undefined,
      isPending: false,
      isFetching: false,
      isError: true,
      error: { kind: 'server', title: '服务暂时不可用', detail: '用户列表暂时不可用', traceId: 'users-500', cause: null },
      refetch,
    })
    renderUsersPage()
    expect(screen.getByText('用户列表暂时不可用', { exact: true })).toBeVisible()
    expect(screen.getByText('诊断编号：users-500')).toBeVisible()
    await user.click(screen.getByRole('button', { name: '重试' }))
    expect(refetch).toHaveBeenCalledOnce()
  })

  it('clears selection when filter, sort, or page size changes and stays read-only without role requests', async () => {
    const user = userEvent.setup()
    const { container } = renderUsersPage()
    const row = screen.getByRole('row', { name: /周明/ })
    const rowCheckboxes = within(row).getAllByRole('checkbox')
    await user.click(rowCheckboxes[0])
    expect(screen.getByText(/已选择\s*1\s*人/)).toBeVisible()

    await user.type(screen.getByLabelText('关键词'), '周')
    await user.click(screen.getByRole('button', { name: '查询' }))
    expect(screen.queryByText(/已选择\s*1\s*人/)).not.toBeInTheDocument()

    const header = screen.getByRole('columnheader', { name: /用户/ })
    await user.click(header)
    expect(screen.queryByText(/已选择\s*1\s*人/)).not.toBeInTheDocument()

    const pageSize = container.querySelector('.arco-pagination-size-changer')
    if (pageSize)
      fireEvent.click(pageSize)
    const sizeOption = screen.queryByText('20 条/页', { exact: true })
    if (sizeOption)
      fireEvent.click(sizeOption)
    expect(screen.queryByText(/已选择\s*1\s*人/)).not.toBeInTheDocument()

    cleanup()
    apiMocks.useListRoleOptions.mockReturnValue({ data: undefined, isPending: false, isError: false })
    renderUsersPage({ ...adminUser, permissions: ['users:read'], roleCodes: ['list-reader'] })
    expect(screen.getByRole('button', { name: '查看' })).toBeVisible()
    expect(screen.queryByRole('button', { name: '新增用户' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '编辑' })).not.toBeInTheDocument()
    expect(apiMocks.useListRoleOptions.mock.calls.some(call => call[0]?.query?.enabled === false)).toBe(true)
  })
})
