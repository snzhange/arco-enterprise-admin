import type { CurrentUser } from '@/api/generated/models'

import { Modal } from '@arco-design/web-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from './auth'
import { getSessionExpiryNotice, SessionExpiryWatcher } from './session-expiry'
import { AppSettingsProvider } from './settings'

vi.mock('@arco-design/web-react', async () => {
  const actual = await vi.importActual<typeof import('@arco-design/web-react')>('@arco-design/web-react')
  return { ...actual, Modal: { ...actual.Modal, confirm: vi.fn(), warning: vi.fn() } }
})

const NOW = Date.parse('2026-10-21T00:00:00Z')
const at = (seconds: number) => new Date(NOW + seconds * 1_000).toISOString()

function sessionUser(expiresInSeconds: number, absoluteInSeconds: number): CurrentUser {
  const now = Date.now()
  return {
    id: 'user-1',
    displayName: 'One',
    email: 'one@example.test',
    permissions: [],
    roleCodes: [],
    dataScope: 'self',
    expiresAt: new Date(now + expiresInSeconds * 1_000).toISOString(),
    absoluteExpiresAt: new Date(now + absoluteInSeconds * 1_000).toISOString(),
  }
}

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location-probe">{location.pathname}</output>
}

function renderWatcher(user: CurrentUser) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const refetch = vi.spyOn(client, 'refetchQueries').mockResolvedValue()
  const view = render(
    <QueryClientProvider client={client}>
      <AppSettingsProvider>
        <MemoryRouter initialEntries={['/users?page=2']}>
          <AuthProvider user={user}>
            <SessionExpiryWatcher />
          </AuthProvider>
          <LocationProbe />
        </MemoryRouter>
      </AppSettingsProvider>
    </QueryClientProvider>,
  )
  return { refetch, view }
}

describe('session expiry notice', () => {
  it('stays quiet when no deadline is known', () => {
    expect(getSessionExpiryNotice(null, null, NOW)).toBe('none')
    expect(getSessionExpiryNotice(undefined, undefined, NOW)).toBe('none')
  })

  it('stays quiet while more than the notice window remains', () => {
    expect(getSessionExpiryNotice(at(121), at(3_600), NOW)).toBe('none')
  })

  it('offers renewal inside the notice window', () => {
    expect(getSessionExpiryNotice(at(120), at(3_600), NOW)).toBe('renewable')
    expect(getSessionExpiryNotice(at(30), undefined, NOW)).toBe('renewable')
  })

  it('stops offering renewal once the session sits on its absolute deadline', () => {
    expect(getSessionExpiryNotice(at(60), at(60), NOW)).toBe('final')
    expect(getSessionExpiryNotice(at(60), at(60.5), NOW)).toBe('final')
  })

  it('ignores a deadline that already passed so the 401 flow owns it', () => {
    expect(getSessionExpiryNotice(at(-1), at(3_600), NOW)).toBe('none')
  })
})

describe('session expiry watcher', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does not prompt before the notice window', () => {
    renderWatcher(sessionUser(30 * 60, 12 * 60 * 60))

    expect(Modal.confirm).not.toHaveBeenCalled()
    expect(Modal.warning).not.toHaveBeenCalled()
  })

  it('does not raise a dialog while the page is hidden', () => {
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    renderWatcher(sessionUser(60, 3_600))

    expect(Modal.confirm).not.toHaveBeenCalled()
  })

  it('asks before the idle deadline and renews the session query on confirmation', async () => {
    const { refetch } = renderWatcher(sessionUser(60, 3_600))

    expect(Modal.confirm).toHaveBeenCalledOnce()
    const [options] = vi.mocked(Modal.confirm).mock.calls[0]
    await act(async () => {
      await options.onOk?.()
    })
    expect(refetch).toHaveBeenCalledOnce()
  })

  it('sends the user to sign in when they decline renewal', async () => {
    renderWatcher(sessionUser(60, 3_600))

    const [options] = vi.mocked(Modal.confirm).mock.calls[0]
    await act(async () => {
      options.onCancel?.()
    })

    expect(screen.getByTestId('location-probe')).toHaveTextContent('/login')
  })

  it('only offers signing in again once the session reached its absolute deadline', async () => {
    renderWatcher(sessionUser(60, 60))

    expect(Modal.confirm).not.toHaveBeenCalled()
    expect(Modal.warning).toHaveBeenCalledOnce()
    const [options] = vi.mocked(Modal.warning).mock.calls[0]
    await act(async () => {
      options.onOk?.()
    })

    expect(screen.getByTestId('location-probe')).toHaveTextContent('/login')
  })

  it('does not repeat the same prompt when the page becomes visible again', () => {
    renderWatcher(sessionUser(60, 3_600))
    expect(Modal.confirm).toHaveBeenCalledOnce()

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(Modal.confirm).toHaveBeenCalledOnce()
  })
})
