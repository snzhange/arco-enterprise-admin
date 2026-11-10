import type { CurrentUser } from '@/api/generated/models'

import { Modal } from '@arco-design/web-react'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { getGetCurrentUserQueryKey } from '@/api/generated/admin-api'
import { useAuth } from '@/app/auth'
import { useLocale } from '@/app/i18n'

/** Show the warning this long before the server-side deadline. */
export const SESSION_NOTICE_WINDOW_MS = 2 * 60_000
const CHECK_INTERVAL_MS = 15_000

export type SessionExpiryNotice = 'none' | 'renewable' | 'final'

/**
 * 'renewable' means another authenticated request extends the idle window; 'final' means the session already
 * sits on its absolute deadline, so only signing in again helps.
 */
export function getSessionExpiryNotice(
  expiresAt: CurrentUser['expiresAt'],
  absoluteExpiresAt: CurrentUser['absoluteExpiresAt'],
  now = Date.now(),
  noticeWindowMs = SESSION_NOTICE_WINDOW_MS,
): SessionExpiryNotice {
  if (!expiresAt)
    return 'none'
  const deadline = new Date(expiresAt).getTime()
  const remaining = deadline - now
  if (!Number.isFinite(remaining) || remaining <= 0 || remaining > noticeWindowMs)
    return 'none'
  const absolute = absoluteExpiresAt ? new Date(absoluteExpiresAt).getTime() : Number.POSITIVE_INFINITY
  return absolute > deadline + 1_000 ? 'renewable' : 'final'
}

/**
 * Warns before the idle deadline and offers to renew. The server renews on any authenticated request, so
 * refetching the session query is enough; a final deadline only offers signing in again.
 */
export function SessionExpiryWatcher() {
  const user = useAuth()
  const t = useLocale()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const promptedRef = useRef<string | null>(null)
  const { absoluteExpiresAt, expiresAt } = user

  useEffect(() => {
    if (!expiresAt)
      return

    const check = () => {
      // Background tabs keep the deadline in memory but should not raise a dialog the user cannot see.
      if (document.visibilityState !== 'visible')
        return
      const notice = getSessionExpiryNotice(expiresAt, absoluteExpiresAt)
      if (notice === 'none')
        return
      const promptKey = `${expiresAt}:${notice}`
      if (promptedRef.current === promptKey)
        return
      promptedRef.current = promptKey

      const signInAgain = () => {
        navigate('/login', {
          replace: true,
          state: { from: `${location.pathname}${location.search}${location.hash}` },
        })
      }

      if (notice === 'final') {
        Modal.warning({
          title: t('session.expiry.title'),
          content: t('session.expiry.absolute'),
          okText: t('session.expiry.signInAgain'),
          onOk: signInAgain,
        })
        return
      }

      const modal = Modal.confirm({
        title: t('session.expiry.title'),
        content: t('session.expiry.renewable'),
        okText: t('session.expiry.continue'),
        cancelText: t('session.expiry.signInAgain'),
        onOk: async () => {
          await queryClient.refetchQueries({ queryKey: getGetCurrentUserQueryKey() })
          // A rejected renewal unmounts the protected layout; close the global dialog so it cannot
          // linger over the sign-in page.
          if (queryClient.getQueryState(getGetCurrentUserQueryKey())?.status === 'error')
            modal.close?.()
        },
        onCancel: signInAgain,
      })
    }

    check()
    const timer = window.setInterval(check, CHECK_INTERVAL_MS)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible')
        check()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [absoluteExpiresAt, expiresAt, location.hash, location.pathname, location.search, navigate, queryClient, t])

  return null
}
