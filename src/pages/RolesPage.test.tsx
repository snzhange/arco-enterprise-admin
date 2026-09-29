import type { CurrentUser, PermissionOption, RoleSummary } from '@/api/generated/models'

import { QueryClient } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '@/app/auth'
import { TestQueryClientProvider } from '@/test/query-client'
import { RolesPage } from './RolesPage'

const apiMocks = vi.hoisted(() => ({
  useListPermissions: vi.fn(),
  useListRoles: vi.fn(),
  useUpdateRole: vi.fn(),
}))

vi.mock('@/api/generated/admin-api', () => ({
  getListRolesQueryKey: () => ['/api/roles'],
  useListPermissions: apiMocks.useListPermissions,
  useListRoles: apiMocks.useListRoles,
  useUpdateRole: apiMocks.useUpdateRole,
}))

const adminUser: CurrentUser = {
  id: '00000000-0000-4000-8000-000000000001',
  displayName: '测试管理员',
  email: 'admin@example.com',
  avatarUrl: null,
  permissions: ['roles:read', 'roles:write'],
  roleCodes: ['admin'],
  dataScope: 'all',
}

const roleReader: CurrentUser = {
  ...adminUser,
  permissions: ['roles:read'],
  roleCodes: ['role-reader'],
}

const roles: RoleSummary[] = [
  { code: 'operator', name: '运营人员', dataScope: 'department', permissions: ['dashboard:read', 'users:read'] },
  { code: 'auditor', name: '审计员', dataScope: 'all', permissions: ['dashboard:read', 'audit:read', 'legacy:read'] },
  { code: 'admin', name: '系统管理员', dataScope: 'all', permissions: ['*'] },
]

const permissions: PermissionOption[] = [
  { code: '*', name: '全部权限', group: '系统', assignable: false },
  { code: 'dashboard:read', name: '查看仪表盘', group: '仪表盘', assignable: true },
  { code: 'users:read', name: '查看用户', group: '用户管理', assignable: true },
  { code: 'audit:read', name: '查看审计日志', group: '审计', assignable: true },
]

function renderRoles(user: CurrentUser = adminUser, client = new QueryClient({ defaultOptions: { queries: { retry: false } } })) {
  return {
    client,
    ...render(
      <TestQueryClientProvider client={client}>
        <AuthProvider user={user}>
          <MemoryRouter>
            <RolesPage />
          </MemoryRouter>
        </AuthProvider>
      </TestQueryClientProvider>,
    ),
  }
}

function roleRow(name: string): HTMLElement {
  return screen.getByRole('row', { name: new RegExp(name) })
}

describe('roles page workflow states', () => {
  beforeEach(() => {
    apiMocks.useListRoles.mockReset()
    apiMocks.useListPermissions.mockReset()
    apiMocks.useUpdateRole.mockReset()
    apiMocks.useListRoles.mockReturnValue({ data: roles, isPending: false, isError: false, refetch: vi.fn() })
    apiMocks.useListPermissions.mockReturnValue({ data: permissions, isPending: false, isError: false, refetch: vi.fn() })
    apiMocks.useUpdateRole.mockReturnValue({ isPending: false, mutateAsync: vi.fn() })
  })

  it('renders loaded roles, empty directory, errors, and read/write enabled boundaries', async () => {
    renderRoles()
    expect(screen.getByText('运营人员')).toBeVisible()
    expect(screen.getByText('审计员')).toBeVisible()
    expect(apiMocks.useListRoles.mock.calls.some(call => call[0]?.query?.enabled === true)).toBe(true)
    expect(apiMocks.useListPermissions.mock.calls.some(call => call[0]?.query?.enabled === true)).toBe(true)

    const readOnlyRow = roleRow('运营人员')
    expect(within(readOnlyRow).getByRole('button', { name: '保存' })).toBeDisabled()

    cleanup()
    apiMocks.useListPermissions.mockReturnValue({ data: [], isPending: false, isError: false, refetch: vi.fn() })
    const view = renderRoles()
    expect(screen.getByText('暂无权限目录')).toBeVisible()
    view.unmount()

    const refetchRoles = vi.fn()
    const refetchPermissions = vi.fn()
    apiMocks.useListRoles.mockReturnValue({ data: undefined, isPending: false, isError: true, error: new Error('角色目录失败'), refetch: refetchRoles })
    apiMocks.useListPermissions.mockReturnValue({ data: undefined, isPending: false, isError: true, error: new Error('权限目录失败'), refetch: refetchPermissions })
    renderRoles()
    expect(screen.getByRole('alert')).toHaveTextContent('角色目录失败')
    await userEvent.setup().click(screen.getByRole('button', { name: '重试' }))
    expect(refetchRoles).toHaveBeenCalledOnce()
    expect(refetchPermissions).toHaveBeenCalledOnce()

    cleanup()
    apiMocks.useListRoles.mockReturnValue({ data: roles, isPending: false, isError: false, refetch: vi.fn() })
    apiMocks.useListPermissions.mockReturnValue({ data: permissions, isPending: false, isError: false, refetch: vi.fn() })
    renderRoles(roleReader)
    const roleReaderRow = roleRow('运营人员')
    expect(within(roleReaderRow).getByText('只读')).toBeVisible()
    expect(within(roleReaderRow).getByRole('checkbox', { name: '查看用户' })).toBeDisabled()
    expect(within(roleReaderRow).queryByRole('button', { name: '保存' })).not.toBeInTheDocument()
    expect(apiMocks.useListRoles.mock.calls.at(-1)?.[0]?.query?.enabled).toBe(true)
    expect(apiMocks.useListPermissions.mock.calls.at(-1)?.[0]?.query?.enabled).toBe(true)
  })

  it('tracks permission and data-scope drafts, protects wildcard, preserves unknown permissions, and cancels', async () => {
    const user = userEvent.setup()
    renderRoles()

    const auditor = roleRow('审计员')
    expect(within(auditor).getByRole('checkbox', { name: 'legacy:read' })).toBeChecked()
    expect(within(auditor).getByRole('checkbox', { name: '查看用户' })).not.toBeChecked()
    await user.click(within(auditor).getByRole('checkbox', { name: '查看用户' }))
    expect(within(auditor).getByRole('button', { name: '保存' })).toBeEnabled()

    const auditorSelect = auditor.querySelector('.arco-select')
    expect(auditorSelect).toBeInTheDocument()
    await user.click(auditorSelect as HTMLElement)
    fireEvent.click(screen.getByText('本人数据', { exact: true }))
    expect(within(auditor).getByText('本人数据')).toBeVisible()

    const admin = roleRow('系统管理员')
    expect(within(admin).getByRole('checkbox', { name: '全部权限' })).toBeDisabled()
    expect(within(admin).getByRole('checkbox', { name: '查看用户' })).toBeDisabled()

    await user.click(within(auditor).getByRole('button', { name: '取消' }))
    expect(within(auditor).getByRole('checkbox', { name: '查看用户' })).not.toBeChecked()
    expect(within(auditor).getByText('全部数据')).toBeVisible()
    expect(within(auditor).getByRole('button', { name: '保存' })).toBeDisabled()
  })

  it('submits the complete draft, invalidates role queries, and clears the draft after success', async () => {
    const user = userEvent.setup()
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    apiMocks.useUpdateRole.mockReturnValue({ isPending: false, mutateAsync })
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    renderRoles(adminUser, client)

    const auditor = roleRow('审计员')
    await user.click(within(auditor).getByRole('checkbox', { name: '查看用户' }))
    await user.click(within(auditor).getByRole('button', { name: '保存' }))
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({
      roleCode: 'auditor',
      data: { dataScope: 'all', permissions: ['dashboard:read', 'audit:read', 'legacy:read', 'users:read'] },
    }))
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['/api/roles'] })
    await waitFor(() => expect(within(auditor).getByRole('button', { name: '保存' })).toBeDisabled())
  })

  it.each([
    ['403', { kind: 'forbidden', title: '没有操作权限', cause: null }],
    ['400', { kind: 'validation', title: '请求参数有误', detail: '权限组合无效', cause: null }],
    ['network', { kind: 'network', title: '网络不可用', cause: null }],
  ])('keeps the draft and allows retry after a %s save failure', async (_name, error) => {
    const user = userEvent.setup()
    const mutateAsync = vi.fn().mockRejectedValueOnce(error).mockResolvedValueOnce(undefined)
    apiMocks.useUpdateRole.mockReturnValue({ isPending: false, mutateAsync })
    renderRoles()

    const auditor = roleRow('审计员')
    await user.click(within(auditor).getByRole('checkbox', { name: '查看用户' }))
    await user.click(within(auditor).getByRole('button', { name: '保存' }))
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1))
    expect(within(auditor).getByRole('checkbox', { name: '查看用户' })).toBeChecked()
    expect(within(auditor).getByRole('button', { name: '取消' })).toBeEnabled()

    await user.click(within(auditor).getByRole('button', { name: '保存' }))
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(2))
  })
})
