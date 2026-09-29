import type { CurrentUser } from '@/api/generated/models'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '@/app/auth'
import { AppSettingsProvider } from '@/app/settings'
import { AppLayout } from '@/components/AppLayout'
import { PageErrorState } from '@/components/page/PageState'
import { TestQueryClientProvider } from '@/test/query-client'
import { clearChunkRetryMarker } from './error-recovery'
import { ErrorBoundary, RouteErrorBoundary } from './ErrorBoundary'
import { RecoveryErrorState } from './RecoveryErrorState'

const apiMocks = vi.hoisted(() => ({ useLogout: vi.fn() }))

vi.mock('@/api/generated/admin-api', () => ({
  useLogout: apiMocks.useLogout,
}))

const currentUser: CurrentUser = {
  id: '00000000-0000-4000-8000-000000000001',
  displayName: '测试管理员',
  email: 'admin@example.com',
  avatarUrl: null,
  permissions: ['*'],
  roleCodes: ['admin'],
  dataScope: 'all',
}

function ThrowingPage({ message = 'private implementation detail' }: { message?: string }): never {
  throw new Error(message)
}

describe('recovery error state', () => {
  it('exposes safe alert content and keyboard-operable recovery buttons', async () => {
    const user = userEvent.setup()
    const retry = vi.fn()
    const back = vi.fn()
    render(<RecoveryErrorState kind="route" diagnosticId="UI-12345" onRetry={retry} onBackToWorkplace={back} />)

    expect(screen.getByRole('alert')).toHaveTextContent('页面暂时无法显示')
    expect(screen.getByTestId('error-diagnostic-id')).toHaveTextContent('诊断编号：UI-12345')
    expect(screen.queryByText('private implementation detail')).not.toBeInTheDocument()

    await user.tab()
    expect(screen.getByRole('button', { name: '重试当前页面' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(retry).toHaveBeenCalledOnce()

    await user.tab()
    await user.keyboard('{Enter}')
    expect(back).toHaveBeenCalledOnce()
  })
})

describe('error boundary', () => {
  beforeEach(() => {
    apiMocks.useLogout.mockReturnValue({ isPending: false, mutate: vi.fn() })
    clearChunkRetryMarker('/chunk-test')
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('remounts a failed page on retry without exposing the thrown message', async () => {
    let allowRecovery = false
    const user = userEvent.setup()
    function ThrowOnce() {
      if (!allowRecovery)
        throw new Error('secret implementation detail')
      return <div>恢复后的页面</div>
    }

    render(
      <ErrorBoundary kind="route" onBackToWorkplace={vi.fn()}>
        <ThrowOnce />
      </ErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('页面暂时无法显示')
    expect(screen.queryByText('secret implementation detail')).not.toBeInTheDocument()
    allowRecovery = true
    await user.click(screen.getByRole('button', { name: '重试当前页面' }))
    expect(await screen.findByText('恢复后的页面')).toBeVisible()
  })

  it('reloads a failed chunk once and does not loop on a second retry', async () => {
    const user = userEvent.setup()
    const reload = vi.fn()
    render(
      <ErrorBoundary kind="route" retryRoute="/chunk-test" reload={reload} onBackToWorkplace={vi.fn()}>
        <ThrowingPage message="Failed to fetch dynamically imported module" />
      </ErrorBoundary>,
    )

    const retry = screen.getByRole('button', { name: '重试当前页面' })
    await user.click(retry)
    expect(reload).toHaveBeenCalledOnce()
    await user.click(screen.getByRole('button', { name: '重试当前页面' }))
    expect(reload).toHaveBeenCalledOnce()
    expect(screen.getByRole('alert')).toHaveTextContent('页面资源加载失败')
  })

  it('keeps handled API errors and cancelled requests out of the render boundary', () => {
    const retry = vi.fn()
    const { rerender } = render(
      <ErrorBoundary kind="route" onBackToWorkplace={vi.fn()}>
        <PageErrorState
          error={{ kind: 'server', title: '服务暂时不可用', detail: '业务列表不可用', cause: new Error('server') }}
          onRetry={retry}
        />
      </ErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('业务列表不可用')
    expect(screen.queryByText('页面暂时无法显示')).not.toBeInTheDocument()

    rerender(
      <ErrorBoundary kind="route" onBackToWorkplace={vi.fn()}>
        <PageErrorState
          error={{ kind: 'unknown', title: '请求已取消', cause: new Error('cancelled'), cancelled: true }}
          onRetry={retry}
        />
      </ErrorBoundary>,
    )
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('provides a root recovery action for initialization failures', async () => {
    const user = userEvent.setup()
    const reload = vi.fn()
    render(
      <ErrorBoundary kind="root" reload={reload} onBackToWorkplace={vi.fn()}>
        <ThrowingPage />
      </ErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('管理台暂时无法加载')
    await user.click(screen.getByRole('button', { name: '重新加载应用' }))
    expect(reload).toHaveBeenCalledOnce()
  })

  it('keeps the application navigation shell when a route page throws', async () => {
    const user = userEvent.setup()
    render(
      <TestQueryClientProvider>
        <AppSettingsProvider>
          <AuthProvider user={currentUser}>
            <MemoryRouter initialEntries={['/broken']}>
              <Routes>
                <Route element={<AppLayout />}>
                  <Route path="/broken" element={<RouteErrorBoundary><ThrowingPage /></RouteErrorBoundary>} />
                  <Route path="/dashboard/workplace" element={<div>工作台内容</div>} />
                </Route>
              </Routes>
            </MemoryRouter>
          </AuthProvider>
        </AppSettingsProvider>
      </TestQueryClientProvider>,
    )

    expect(screen.getByText('系统管理', { exact: true })).toBeVisible()
    expect(screen.getByRole('alert')).toHaveTextContent('页面暂时无法显示')
    await user.click(screen.getByRole('button', { name: '返回工作台' }))
    expect(await screen.findByText('工作台内容')).toBeVisible()
  })
})
