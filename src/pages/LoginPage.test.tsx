import type { QueryClient } from '@tanstack/react-query'
import type { ApiError } from '@/api/errors'
import type { CurrentUser } from '@/api/generated/models'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getGetCurrentUserQueryKey } from '@/api/generated/admin-api'
import { AppSettingsProvider } from '@/app/settings'
import { createTestQueryClient, TestQueryClientProvider } from '@/test/query-client'
import { LoginPage } from './LoginPage'

const apiMocks = vi.hoisted(() => ({
  useLogin: vi.fn(),
}))

vi.mock('@/api/generated/admin-api', async () => {
  const actual = await vi.importActual<typeof import('@/api/generated/admin-api')>('@/api/generated/admin-api')
  return { ...actual, useLogin: apiMocks.useLogin }
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
  return (
    <output data-testid="location-probe">
      {location.pathname}
      {location.search}
      {location.hash}
      {JSON.stringify(location.state)}
    </output>
  )
}

function renderLogin(
  client: QueryClient,
  initialEntry: string | { pathname: string, state?: unknown } = '/login',
) {
  return render(
    <TestQueryClientProvider client={client}>
      <AppSettingsProvider>
        <MemoryRouter initialEntries={[initialEntry]}>
          <LoginPage />
          <LocationProbe />
        </MemoryRouter>
      </AppSettingsProvider>
    </TestQueryClientProvider>,
  )
}

function apiError(overrides: Partial<ApiError>): ApiError {
  return {
    kind: 'unknown',
    title: '登录失败',
    cause: new Error('login failed'),
    ...overrides,
  }
}

describe('login page authentication boundaries', () => {
  let latestOptions: { mutation?: MutationCallbacks } | undefined
  let mutate: ReturnType<typeof vi.fn>

  beforeEach(() => {
    window.localStorage.clear()
    latestOptions = undefined
    mutate = vi.fn()
    apiMocks.useLogin.mockReset()
    apiMocks.useLogin.mockImplementation((options: { mutation?: MutationCallbacks }) => {
      latestOptions = options
      return { isPending: false, mutate }
    })
  })

  it('keeps required field validation in the form and does not submit', async () => {
    const user = userEvent.setup()
    renderLogin(createTestQueryClient())

    await user.clear(screen.getByLabelText('工作邮箱'))
    await user.clear(screen.getByLabelText('密码'))
    await user.click(screen.getByRole('button', { name: '登录工作台' }))

    expect(await screen.findByText('邮箱不能为空')).toBeVisible()
    expect(screen.getByText('密码不能为空')).toBeVisible()
    expect(mutate).not.toHaveBeenCalled()
  })

  it('keeps invalid credentials and the entered form context on the login page', async () => {
    const user = userEvent.setup()
    renderLogin(createTestQueryClient())

    await user.click(screen.getByRole('button', { name: '登录工作台' }))
    await waitFor(() => expect(mutate).toHaveBeenCalledOnce())
    await act(async () => {
      latestOptions?.mutation?.onError?.(apiError({
        kind: 'unauthenticated',
        status: 401,
        title: '登录失败',
        detail: '邮箱或密码错误',
      }), { data: { email: 'admin@arco.dev', password: 'admin1234' } }, undefined)
    })

    expect(screen.getByRole('alert')).toHaveTextContent('邮箱或密码错误')
    expect(screen.getByLabelText('工作邮箱')).toHaveValue('admin@arco.dev')
    expect(screen.getByLabelText('密码')).toHaveValue('admin1234')
    expect(screen.getByTestId('location-probe')).toHaveTextContent('/login')
  })

  it('renders field errors while preserving the form-level detail', async () => {
    const user = userEvent.setup()
    renderLogin(createTestQueryClient())

    await user.click(screen.getByRole('button', { name: '登录工作台' }))
    await waitFor(() => expect(mutate).toHaveBeenCalledOnce())
    await act(async () => {
      latestOptions?.mutation?.onError?.(apiError({
        kind: 'validation',
        status: 400,
        detail: '请检查登录信息',
        fieldErrors: [{ field: 'email', message: '邮箱格式无效' }],
      }), { data: { email: 'admin@arco.dev', password: 'admin1234' } }, undefined)
    })

    expect(screen.getByText('请检查登录信息')).toBeVisible()
    expect(screen.getByText('邮箱格式无效')).toBeVisible()
  })

  it('clears old identity cache and restores an internal return path after success', async () => {
    const client = createTestQueryClient()
    client.setQueryData(getGetCurrentUserQueryKey(), currentUser)
    client.setQueryData(['/api/users'], { content: ['old-user'] })
    const user = userEvent.setup()
    renderLogin(client, { pathname: '/login', state: { from: '/users?page=2#roles' } })

    await user.click(screen.getByRole('button', { name: '登录工作台' }))
    await waitFor(() => expect(mutate).toHaveBeenCalledOnce())
    await act(async () => {
      await latestOptions?.mutation?.onSuccess?.(undefined, { data: { email: 'admin@arco.dev', password: 'admin1234' } }, undefined)
    })

    expect(screen.getByTestId('location-probe')).toHaveTextContent('/users?page=2#roles')
    expect(client.getQueryCache().getAll()).toHaveLength(0)
  })

  it('falls back to the workbench when a return path is external', async () => {
    const user = userEvent.setup()
    renderLogin(createTestQueryClient(), { pathname: '/login', state: { from: 'https://evil.example/phish' } })

    await user.click(screen.getByRole('button', { name: '登录工作台' }))
    await waitFor(() => expect(mutate).toHaveBeenCalledOnce())
    await act(async () => {
      await latestOptions?.mutation?.onSuccess?.(undefined, { data: { email: 'admin@arco.dev', password: 'admin1234' } }, undefined)
    })

    expect(screen.getByTestId('location-probe')).toHaveTextContent('/dashboard/workplace')
    expect(screen.getByTestId('location-probe')).not.toHaveTextContent('evil.example')
  })
})
