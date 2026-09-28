import axios from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  configureSessionExpiredHandler,
  resetSessionExpired,
} from '@/app/session-expired'
import { getErrorMessage, httpClient, request } from './http'

function axiosError(status?: number, data?: unknown, code?: string) {
  return new axios.AxiosError('request failed', code, undefined, undefined, status
    ? { status, statusText: '', headers: {}, config: {}, data } as never
    : undefined)
}

beforeEach(() => {
  resetSessionExpired()
  configureSessionExpiredHandler(undefined)
  vi.restoreAllMocks()
})

describe('getErrorMessage', () => {
  it('returns regular Error messages', () => {
    expect(getErrorMessage(new Error('连接失败'))).toBe('连接失败')
  })

  it('returns a safe fallback for unknown values', () => {
    expect(getErrorMessage({ reason: 'unknown' })).toBe('请求失败，请稍后重试')
  })
})

describe('request policies', () => {
  it('returns response data and keeps request policy out of the axios config', async () => {
    const requestSpy = vi.spyOn(httpClient, 'request').mockResolvedValue({ data: { ok: true } } as never)

    await expect(request<{ ok: boolean }>(
      { url: '/api/example', method: 'GET', errorPolicy: 'session' },
      { errorPolicy: 'business', headers: { 'X-Test': '1' } },
    )).resolves.toEqual({ ok: true })

    expect(requestSpy).toHaveBeenCalledWith(expect.objectContaining({
      url: '/api/example',
      method: 'GET',
      headers: { 'X-Test': '1' },
    }))
    expect(requestSpy.mock.calls[0]?.[0]).not.toHaveProperty('errorPolicy')
  })

  it.each([
    ['business', true],
    ['session', false],
    ['login', false],
    ['logout', false],
  ] as const)('applies the %s 401 policy', async (policy, shouldNotify) => {
    const handler = vi.fn()
    configureSessionExpiredHandler(handler)
    const onApiError = vi.fn()
    vi.spyOn(httpClient, 'request').mockRejectedValue(axiosError(401, {
      title: 'Unauthorized',
      detail: '登录已过期',
      code: 'SESSION_EXPIRED',
    }))

    await expect(request(
      { url: '/api/example', method: 'GET' },
      { errorPolicy: policy, onApiError },
    )).rejects.toMatchObject({
      kind: 'unauthenticated',
      status: 401,
      detail: '登录已过期',
    })

    expect(onApiError).toHaveBeenCalledWith(expect.objectContaining({ kind: 'unauthenticated' }))
    expect(handler).toHaveBeenCalledTimes(shouldNotify ? 1 : 0)
  })

  it('allows callers to suppress the business session-expiry notification', async () => {
    const handler = vi.fn()
    configureSessionExpiredHandler(handler)
    const onApiError = vi.fn()
    vi.spyOn(httpClient, 'request').mockRejectedValue(axiosError(401))

    await expect(request(
      { url: '/api/example', method: 'GET' },
      { errorPolicy: 'business', suppressSessionExpiry: true, onApiError },
    )).rejects.toMatchObject({ kind: 'unauthenticated' })

    expect(handler).not.toHaveBeenCalled()
    expect(onApiError).toHaveBeenCalledOnce()
  })

  it('normalizes and rethrows transport failures without session expiry', async () => {
    const handler = vi.fn()
    configureSessionExpiredHandler(handler)
    const onApiError = vi.fn()
    const cases = [
      [axiosError(undefined, undefined, axios.AxiosError.ERR_NETWORK), 'network'],
      [axiosError(undefined, undefined, axios.AxiosError.ETIMEDOUT), 'timeout'],
      [new axios.CanceledError('cancelled'), 'unknown'],
    ] as const

    for (const [cause, kind] of cases) {
      vi.spyOn(httpClient, 'request').mockRejectedValueOnce(cause)
      await expect(request({ url: '/api/example', method: 'GET' })).rejects.toMatchObject({ kind })
    }

    expect(onApiError).not.toHaveBeenCalled()
    expect(handler).not.toHaveBeenCalled()
  })

  it('passes Problem Details through onApiError before rethrowing', async () => {
    const onApiError = vi.fn()
    vi.spyOn(httpClient, 'request').mockRejectedValue(axiosError(400, {
      title: '参数错误',
      detail: '邮箱已经存在',
      code: 'USER_EXISTS',
      traceId: 'trace-123',
      fieldErrors: [{ field: 'email', message: '邮箱已被占用' }],
    }))

    await expect(request(
      { url: '/api/example', method: 'POST' },
      { errorPolicy: 'login', onApiError },
    )).rejects.toMatchObject({
      kind: 'validation',
      code: 'USER_EXISTS',
      traceId: 'trace-123',
      fieldErrors: [{ field: 'email', message: '邮箱已被占用' }],
    })
    expect(onApiError).toHaveBeenCalledWith(expect.objectContaining({ detail: '邮箱已经存在' }))
  })
})
