export interface ChunkRetryStorage {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

const CHUNK_RETRY_PREFIX = 'arco:chunk-retry:'
const chunkRetryMemory = new Set<string>()

function getStorage(storage?: ChunkRetryStorage | null): ChunkRetryStorage | null {
  if (storage !== undefined)
    return storage

  try {
    return typeof window === 'undefined' ? null : window.sessionStorage
  }
  catch {
    return null
  }
}

export function getCurrentRouteKey(): string {
  if (typeof window === 'undefined')
    return 'server'

  return `${window.location.pathname}${window.location.search}${window.location.hash}`
}

export function getChunkRetryKey(route = getCurrentRouteKey()): string {
  return `${CHUNK_RETRY_PREFIX}${route}`
}

function errorMessage(error: unknown): string {
  if (error instanceof Error)
    return `${error.name} ${error.message}`
  if (typeof error === 'string')
    return error
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    return typeof message === 'string' ? message : ''
  }
  return ''
}

export function isChunkLoadError(error: unknown): boolean {
  return /ChunkLoadError|Loading chunk\s+\S+\s+failed|Failed to fetch dynamically imported module|Importing a module script failed|dynamically imported module|Unable to preload CSS|CSS_CHUNK_LOAD_FAILED/i.test(errorMessage(error))
}

export function requestChunkRetry(
  route = getCurrentRouteKey(),
  storage?: ChunkRetryStorage | null,
): boolean {
  const key = getChunkRetryKey(route)
  const targetStorage = getStorage(storage)
  if (targetStorage?.getItem(key) === '1' || chunkRetryMemory.has(key))
    return false

  targetStorage?.setItem(key, '1')
  chunkRetryMemory.add(key)
  return true
}

export function clearChunkRetryMarker(
  route = getCurrentRouteKey(),
  storage?: ChunkRetryStorage | null,
): void {
  const key = getChunkRetryKey(route)
  getStorage(storage)?.removeItem(key)
  chunkRetryMemory.delete(key)
}

export function getDiagnosticId(error: unknown): string {
  const source = errorMessage(error) || 'UnknownError'
  let hash = 0
  for (const character of source)
    hash = (hash + character.charCodeAt(0) * 17) % 100000

  return `UI-${String(hash).padStart(5, '0')}`
}
