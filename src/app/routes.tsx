import type { ReactNode } from 'react'

import type { RouteMatch } from '@/app/route-manifest'
import { Suspense } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useGetCurrentUser } from '@/api/generated/admin-api'
import { AuthProvider, useAuth } from '@/app/auth'
import { LoadingScreen } from '@/app/LoadingScreen'
import {
  canAccessRoute,
  protectedRouteMatches,
  publicRouteManifest,
  redirectRouteManifest,
  toNestedRoutePath,
} from '@/app/route-manifest'
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
  const session = useGetCurrentUser({ query: { retry: false } })

  if (session.isPending)
    return <LoadingScreen />
  if (session.isError || !session.data)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />

  return <AuthProvider user={session.data}><Outlet /></AuthProvider>
}

function LazyPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div className="route-loading">页面加载中...</div>}>{children}</Suspense>
}

export function AppRoutes() {
  return (
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
  )
}
