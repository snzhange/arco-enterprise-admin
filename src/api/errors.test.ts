import type { FormInstance } from '@arco-design/web-react'

import axios from 'axios'
import { describe, expect, it, vi } from 'vitest'

import {
  applyFieldErrors,
  getErrorMessage,
  getFieldErrors,
  getTraceMessage,
  isCancelledError,
  toApiError,
} from './errors'

function axiosError(status?: number, data?: unknown, code?: string) {
  return new axios.AxiosError('request failed', code, undefined, undefined, status
    ? { status, statusText: '', headers: {}, config: {}, data } as never
    : undefined)
}

describe('toApiError', () => {
  it('keeps Problem Details fields and prefers detail for messages', () => {
    const error = toApiError(axiosError(400, {
      title: '参数错误',
      detail: '邮箱已经存在',
      code: 'USER_EXISTS',
      traceId: 'trace-123',
      fieldErrors: [{ field: 'email', message: '邮箱已被占用' }],
    }))

    expect(error.kind).toBe('validation')
    expect(error.status).toBe(400)
    expect(error.code).toBe('USER_EXISTS')
    expect(error.traceId).toBe('trace-123')
    expect(getFieldErrors(error)).toEqual([{ field: 'email', message: '邮箱已被占用' }])
    expect(getErrorMessage(error)).toBe('邮箱已经存在')
    expect(getTraceMessage(error)).toBe('诊断编号：trace-123')
  })

  it.each([
    [401, 'unauthenticated'],
    [403, 'forbidden'],
    [404, 'not-found'],
    [500, 'server'],
    [503, 'server'],
  ] as const)('classifies HTTP %s as %s', (status, kind) => {
    expect(toApiError(axiosError(status, { title: 'error' })).kind).toBe(kind)
  })

  it('distinguishes network and timeout failures', () => {
    expect(toApiError(axiosError(undefined, undefined, axios.AxiosError.ERR_NETWORK)).kind).toBe('network')
    expect(toApiError(axiosError(undefined, undefined, axios.AxiosError.ETIMEDOUT)).kind).toBe('timeout')
  })

  it('keeps cancellation silent and provides an unknown fallback', () => {
    const cancelled = toApiError(new axios.CanceledError('cancelled'))
    expect(cancelled.cancelled).toBe(true)
    expect(isCancelledError(cancelled)).toBe(true)
    expect(getErrorMessage(cancelled)).toBe('')
    expect(toApiError({ nope: true }).kind).toBe('unknown')
  })
})

describe('applyFieldErrors', () => {
  it('maps nested fields and returns the form-level detail', () => {
    const form = { setFields: vi.fn() } as unknown as FormInstance<Record<string, unknown>>
    const detail = applyFieldErrors(form, axiosError(400, {
      title: '参数错误',
      detail: '请检查表单',
      fieldErrors: [
        { field: 'profile.email', message: '邮箱无效' },
        { field: 'roles[0]', message: '角色无效' },
      ],
    }))

    expect(detail).toBe('请检查表单')
    expect(form.setFields).toHaveBeenCalledWith({
      'profile.email': { error: { message: '邮箱无效' } },
      'roles[0]': { error: { message: '角色无效' } },
    })
  })
})
