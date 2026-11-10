import type { ReactNode } from 'react'

import type { RouteMatch } from '@/app/route-manifest'
import { Message } from '@arco-design/web-react'
import { useQueryClient } from '@tanstack/react-query'
import { Suspense, useEffect } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { toApiError } from '@/api/errors'
import { useGetCurrentUser } from '@/api/generated/admin-api'
import { AuthProvider, useAuth } from '@/app/auth'
import { useDocumentTitle } from '@/app/document-title'
import { RouteErrorBoundary } from '@/app/ErrorBoundary'
import { LoadingScreen } from '@/app/LoadingScreen'
import {
  canAccessRoute,
  getDefaultLandingPath,
  lazyNamed,
  protectedRouteMatches,
  publicRouteManifest,
  redirectRouteManifest,
  toNestedRoutePath,
} from '@/app/route-manifest'
import { clearSessionCache } from '@/app/session-cache'
import { configureSessionExpiredHandler, toSafeReturnPath } from '@/app/session-expired'
import { SessionErrorState } from '@/app/SessionErrorState'
import { AccessDenied } from '@/components/AccessDenied'
import { AccountPending } from '@/components/AccountPending'
import { AppLayout } from '@/components/AppLayout'
import { NotFoundPage } from '@/pages/NotFoundPage'

// Only needed after sign-in and renders nothing until a deadline is near, so keep it out of the entry chunk.
const SessionExpiryWatcher = lazyNamed(() => import('@/app/session-expiry'), 'SessionExpiryWatcher')

function PermissionRoute({ children, match }: { children: ReactNode, match: RouteMatch }) {
  const user = useAuth()
  if (canAccessRoute(user, match))
    return children
  return user.permissions.length === 0 ? <AccountPending /> : <AccessDenied />
}

/** Root path: go to the first page the user can actually open instead of a fixed dashboard. */
function LandingRedirect() {
  const user = useAuth()
  const path = getDefaultLandingPath(user)
  if (path)
    return <Navigate to={path} replace />
  return user.permissions.length === 0 ? <AccountPending /> : <AccessDenied />
}

function ManifestPage({ match }: { match: RouteMatch }) {
  const Page = match.route.component
  return (
    <RouteErrorBoundary>
      <LazyPage>
        <PermissionRoute match={match}>
          <Page />
        </PermissionRoute>
      </LazyPage>
    </RouteErrorBoundary>
  )
}

function ProtectedLayout() {
  const location = useLocation()
  const session = useGetCurrentUser({
    // The server renews the idle window on authenticated requests, so polling keeps an active tab alive.
    // Background tabs pause by default and refetch as soon as the tab becomes visible again.
    query: { retry: false, refetchInterval: 5 * 60_000, refetchOnWindowFocus: true },
    request: { errorPolicy: 'session', suppressSessionExpiry: true },
  })

  if (session.isPending)
    return <LoadingScreen />
  if (session.isError || !session.data) {
    const error = toApiError(session.error)
    if (error.kind === 'unauthenticated') {
      const from = toSafeReturnPath(`${location.pathname}${location.search}${location.hash}`)
      return <Navigate to="/login" replace state={{ from }} />
    }
    return <SessionErrorState error={error} onRetry={() => void session.refetch()} />
  }

  return (
    <AuthProvider user={session.data}>
      {/* Own boundary so loading the watcher chunk never suspends the layout. */}
      <Suspense fallback={null}>
        <SessionExpiryWatcher />
      </Suspense>
      <Outlet />
    </AuthProvider>
  )
}

function SessionExpiredBridge() {
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  useEffect(() => configureSessionExpiredHandler(async () => {
    const from = toSafeReturnPath(`${location.pathname}${location.search}${location.hash}`)
    await clearSessionCache(queryClient)
    Message.warning('登录状态已过期，请重新登录')
    navigate('/login', { replace: true, state: { from } })
  }), [location.hash, location.pathname, location.search, navigate, queryClient])

  return null
}

function LazyPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div className="route-loading">页面加载中...</div>}>{children}</Suspense>
}

export function AppRoutes() {
  useDocumentTitle()

  return (
    <>
      <SessionExpiredBridge />
      <Routes>
        {publicRouteManifest.map(route => (
          <Route key={route.path} path={toNestedRoutePath(route.path)} element={<route.component />} />
        ))}
        <Route element={<ProtectedLayout />}>
          <Route element={<AppLayout />}>
            {redirectRouteManifest.map(route => (
              route.path === '/'
                ? <Route key={route.path} index element={<LandingRedirect />} />
                : <Route key={route.path} path={toNestedRoutePath(route.path)} element={<Navigate to={route.to} replace />} />
            ))}
            {protectedRouteMatches.map(match => (
              <Route
                key={match.route.path}
                path={toNestedRoutePath(match.route.path)}
                element={<ManifestPage match={match} />}
              />
            ))}
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}
