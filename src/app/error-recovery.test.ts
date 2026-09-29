import type { ChunkRetryStorage } from './error-recovery'

import { beforeEach, describe, expect, it } from 'vitest'

import {
  clearChunkRetryMarker,
  getChunkRetryKey,
  getDiagnosticId,
  isChunkLoadError,
  requestChunkRetry,
} from './error-recovery'

function createStorage(): ChunkRetryStorage {
  const values = new Map<string, string>()
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  }
}

describe('error recovery helpers', () => {
  beforeEach(() => {
    clearChunkRetryMarker('/tests/chunk', createStorage())
  })

  it('identifies browser chunk loading failures without treating API errors as chunks', () => {
    expect(isChunkLoadError(new TypeError('Failed to fetch dynamically imported module'))).toBe(true)
    expect(isChunkLoadError(new Error('Loading chunk 42 failed'))).toBe(true)
    expect(isChunkLoadError({ message: 'request failed with status 500' })).toBe(false)
  })

  it('allows one retry per route and clears the marker after a successful load', () => {
    const storage = createStorage()
    const route = '/tests/chunk'

    expect(requestChunkRetry(route, storage)).toBe(true)
    expect(storage.getItem(getChunkRetryKey(route))).toBe('1')
    expect(requestChunkRetry(route, storage)).toBe(false)

    clearChunkRetryMarker(route, storage)
    expect(storage.getItem(getChunkRetryKey(route))).toBeNull()
    expect(requestChunkRetry(route, storage)).toBe(true)
  })

  it('creates a safe diagnostic id without exposing the original error text', () => {
    const diagnosticId = getDiagnosticId(new Error('secret stack token'))

    expect(diagnosticId).toMatch(/^UI-\d{5}$/)
    expect(diagnosticId).not.toContain('secret')
  })
})
