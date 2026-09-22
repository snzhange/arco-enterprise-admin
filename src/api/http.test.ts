import { describe, expect, it } from 'vitest'

import { getErrorMessage } from './http'

describe('getErrorMessage', () => {
  it('returns regular Error messages', () => {
    expect(getErrorMessage(new Error('连接失败'))).toBe('连接失败')
  })

  it('returns a safe fallback for unknown values', () => {
    expect(getErrorMessage({ reason: 'unknown' })).toBe('请求失败，请稍后重试')
  })
})
