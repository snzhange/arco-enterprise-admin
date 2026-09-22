import type { ApiError } from '@/api/errors'

export type SessionExpiredHandler = (error: ApiError) => void | Promise<void>

let handler: SessionExpiredHandler | undefined
let handled = false

export function configureSessionExpiredHandler(next: SessionExpiredHandler | undefined): () => void {
  handler = next
  return () => {
    if (handler === next)
      handler = undefined
  }
}

export function notifySessionExpired(error: ApiError): boolean {
  if (handled || !handler)
    return false
  handled = true
  void Promise.resolve(handler(error)).catch(() => {
    // Navigation and query invalidation must not turn a handled 401 into an unhandled rejection.
  })
  return true
}

export function resetSessionExpired(): void {
  handled = false
}

export function isSessionExpiredHandled(): boolean {
  return handled
}

export function toSafeReturnPath(value: string | undefined, fallback = '/dashboard/workplace'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\'))
    return fallback

  try {
    const parsed = new URL(value, 'https://arco.local')
    if (parsed.origin !== 'https://arco.local')
      return fallback
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  }
  catch {
    return fallback
  }
}
