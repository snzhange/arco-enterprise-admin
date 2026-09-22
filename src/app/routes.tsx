import type { ReactNode } from 'react'

import type { RouteMatch } from '@/app/route-manifest'
import { Message } from '@arco-design/web-react'
import { useQueryClient } from '@tanstack/react-query'
import { Suspense, useEffect } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { toApiError } from '@/api/errors'
import { getGetCurrentUserQueryKey, useGetCurrentUser } from '@/api/generated/admin-api'
import { AuthProvider, useAuth } from '@/app/auth'
import { LoadingScreen } from '@/app/LoadingScreen'
import {
  canAccessRoute,
  protectedRouteMatches,
  publicRouteManifest,
  redirectRouteManifest,
  toNestedRoutePath,
} from '@/app/route-manifest'
import { configureSessionExpiredHandler, toSafeReturnPath } from '@/app/session-expired'
import { SessionErrorState } from '@/app/SessionErrorState'
import { AccessDenied } from '@/components/AccessDenied'
import { AppLayout } from '@/components/AppLayout'
import { NotFoundPage } from '@/pages/NotFoundPage'

function PermissionRoute({ children, match }: { children: ReactNode, match: RouteMatch }) {
  const user = useAuth()
  return canAccessRoute(user, match) ? children : <AccessDenied />
}

function ManifestPage({ match }: { match: RouteMatch }) {
  const Page = match.route.component
  return (
    <LazyPage>
      <PermissionRoute match={match}>
        <Page />
      </PermissionRoute>
    </LazyPage>
  )
}

function ProtectedLayout() {
  const location = useLocation()
  const session = useGetCurrentUser({
    query: { retry: false },
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

  return <AuthProvider user={session.data}><Outlet /></AuthProvider>
}

function SessionExpiredBridge() {
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  useEffect(() => configureSessionExpiredHandler(async () => {
    await queryClient.cancelQueries({ queryKey: getGetCurrentUserQueryKey() })
    queryClient.removeQueries({ queryKey: getGetCurrentUserQueryKey() })
    const from = toSafeReturnPath(`${location.pathname}${location.search}${location.hash}`)
    Message.warning('登录状态已过期，请重新登录')
    navigate('/login', { replace: true, state: { from } })
  }), [location.hash, location.pathname, location.search, navigate, queryClient])

  return null
}

function LazyPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div className="route-loading">页面加载中...</div>}>{children}</Suspense>
}

export function AppRoutes() {
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
                ? <Route key={route.path} index element={<Navigate to={route.to} replace />} />
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
