import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  configureSessionExpiredHandler,
  isSessionExpiredHandled,
  notifySessionExpired,
  resetSessionExpired,
  toSafeReturnPath,
} from './session-expired'

const error = { kind: 'unauthenticated' as const, title: '过期', cause: new Error('expired') }

describe('session expiry coordinator', () => {
  beforeEach(() => {
    resetSessionExpired()
    configureSessionExpiredHandler(undefined)
  })

  it('handles concurrent expiry notifications once', () => {
    const handler = vi.fn()
    configureSessionExpiredHandler(handler)

    expect(notifySessionExpired(error)).toBe(true)
    expect(notifySessionExpired(error)).toBe(false)
    expect(handler).toHaveBeenCalledTimes(1)
    expect(isSessionExpiredHandled()).toBe(true)
  })

  it('can be reset after a successful login', () => {
    configureSessionExpiredHandler(vi.fn())
    notifySessionExpired(error)
    resetSessionExpired()
    expect(notifySessionExpired(error)).toBe(true)
  })
})

describe('safe return paths', () => {
  it('keeps same-origin path, search and hash', () => {
    expect(toSafeReturnPath('/users?tab=roles#details')).toBe('/users?tab=roles#details')
  })

  it('rejects absolute and protocol-relative URLs', () => {
    expect(toSafeReturnPath('https://evil.example/')).toBe('/dashboard/workplace')
    expect(toSafeReturnPath('//evil.example/')).toBe('/dashboard/workplace')
  })
})
