import type { CurrentUser, DashboardSummary } from '@/api/generated/models'

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '@/app/auth'
import { DashboardPage } from './DashboardPage'

const apiMocks = vi.hoisted(() => ({
  useGetDashboardSummary: vi.fn(),
}))

vi.mock('@/api/generated/admin-api', () => ({
  useGetDashboardSummary: apiMocks.useGetDashboardSummary,
}))

const user: CurrentUser = {
  id: '00000000-0000-4000-8000-000000000001',
  displayName: '测试管理员',
  email: 'admin@example.com',
  avatarUrl: null,
  permissions: ['dashboard:read'],
  roleCodes: ['admin'],
  dataScope: 'all',
}

const summary: DashboardSummary = {
  activeUsers: 128,
  pendingApprovals: 6,
  monthlyRevenue: 98000,
  systemHealth: 99,
  trends: [],
  recentActivities: [],
}

function renderDashboard() {
  return render(
    <AuthProvider user={user}>
      <DashboardPage />
    </AuthProvider>,
  )
}

describe('dashboard page query states', () => {
  beforeEach(() => {
    cleanup()
    apiMocks.useGetDashboardSummary.mockReset()
  })

  it('renders a loading state while the summary query is pending', () => {
    apiMocks.useGetDashboardSummary.mockReturnValue({ data: undefined, isPending: true, isError: false, refetch: vi.fn() })
    const { container } = renderDashboard()

    expect(container.querySelector('.page-skeleton')).toBeInTheDocument()
    expect(screen.queryByText(/欢迎回来/)).not.toBeInTheDocument()
  })

  it('renders the normal workplace after a successful summary query', () => {
    apiMocks.useGetDashboardSummary.mockReturnValue({ data: summary, isPending: false, isError: false, refetch: vi.fn() })
    renderDashboard()

    expect(screen.getByText('欢迎回来，测试管理员')).toBeVisible()
    expect(screen.getByText('线上热门内容')).toBeVisible()
    expect(screen.queryByText('暂时无法加载工作台')).not.toBeInTheDocument()
  })

  it('renders the error detail and trace id, supports retry, and hides workplace content', async () => {
    const userEventController = userEvent.setup()
    const refetch = vi.fn()
    apiMocks.useGetDashboardSummary.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      error: { kind: 'server', title: '服务暂时不可用', detail: '工作台暂时不可用', traceId: 'dashboard-500', cause: null },
      refetch,
    })
    renderDashboard()

    expect(screen.getByRole('alert')).toHaveTextContent('工作台暂时不可用')
    expect(screen.getByText('诊断编号：dashboard-500')).toBeVisible()
    expect(screen.queryByText(/欢迎回来/)).not.toBeInTheDocument()
    expect(screen.queryByText('线上热门内容')).not.toBeInTheDocument()

    await userEventController.click(screen.getByRole('button', { name: '重试' }))
    expect(refetch).toHaveBeenCalledOnce()
  })
})
