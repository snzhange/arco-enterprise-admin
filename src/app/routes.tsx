import type { ReactNode } from 'react'

import type { PermissionRequirement } from '@/app/permissions'
import { lazy, Suspense } from 'react'

import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useGetCurrentUser } from '@/api/generated/admin-api'
import { AuthProvider, useAuth } from '@/app/auth'
import { LoadingScreen } from '@/app/LoadingScreen'
import { canAccess } from '@/app/permissions'
import { getRoutePermission } from '@/app/route-permissions'
import { AccessDenied } from '@/components/AccessDenied'
import { AppLayout } from '@/components/AppLayout'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

const DashboardPage = lazy(() => import('@/pages/DashboardPage').then(module => ({ default: module.DashboardPage })))
const MonitorPage = lazy(() => import('@/pages/official/MonitorPage').then(module => ({ default: module.MonitorPage })))
const DataAnalysisPage = lazy(() => import('@/pages/official/DataAnalysisPage').then(module => ({ default: module.DataAnalysisPage })))
const MultiDimensionPage = lazy(() => import('@/pages/official/MultiDimensionPage').then(module => ({ default: module.MultiDimensionPage })))
const SearchTablePage = lazy(() => import('@/pages/official/SearchTablePage').then(module => ({ default: module.SearchTablePage })))
const CardListPage = lazy(() => import('@/pages/official/CardListPage').then(module => ({ default: module.CardListPage })))
const GroupFormPage = lazy(() => import('@/pages/official/GroupFormPage').then(module => ({ default: module.GroupFormPage })))
const StepFormPage = lazy(() => import('@/pages/official/StepFormPage').then(module => ({ default: module.StepFormPage })))
const BasicProfilePage = lazy(() => import('@/pages/official/BasicProfilePage').then(module => ({ default: module.BasicProfilePage })))
const SuccessResultPage = lazy(() => import('@/pages/official/ResultPages').then(module => ({ default: module.SuccessResultPage })))
const ErrorResultPage = lazy(() => import('@/pages/official/ResultPages').then(module => ({ default: module.ErrorResultPage })))
const Exception403Page = lazy(() => import('@/pages/official/ExceptionPages').then(module => ({ default: module.Exception403Page })))
const Exception404Page = lazy(() => import('@/pages/official/ExceptionPages').then(module => ({ default: module.Exception404Page })))
const Exception500Page = lazy(() => import('@/pages/official/ExceptionPages').then(module => ({ default: module.Exception500Page })))
const UserInfoPage = lazy(() => import('@/pages/official/UserInfoPage').then(module => ({ default: module.UserInfoPage })))
const UserSettingPage = lazy(() => import('@/pages/official/UserSettingPage').then(module => ({ default: module.UserSettingPage })))
const UsersPage = lazy(() => import('@/pages/UsersPage').then(module => ({ default: module.UsersPage })))
const RolesPage = lazy(() => import('@/pages/RolesPage').then(module => ({ default: module.RolesPage })))
const WelcomePage = lazy(() => import('@/pages/WelcomePage').then(module => ({ default: module.WelcomePage })))

function PermissionRoute({ children, requirement }: { children: ReactNode, requirement?: PermissionRequirement }) {
  const user = useAuth()
  return canAccess(user, requirement) ? children : <AccessDenied />
}

function GuardedPage({ children, pathname }: { children: ReactNode, pathname: string }) {
  return <PermissionRoute requirement={getRoutePermission(pathname)}>{children}</PermissionRoute>
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
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedLayout />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard/workplace" replace />} />
          <Route path="dashboard" element={<Navigate to="/dashboard/workplace" replace />} />
          <Route path="dashboard/workplace" element={<LazyPage><GuardedPage pathname="/dashboard/workplace"><DashboardPage /></GuardedPage></LazyPage>} />
          <Route path="dashboard/monitor" element={<LazyPage><GuardedPage pathname="/dashboard/monitor"><MonitorPage /></GuardedPage></LazyPage>} />
          <Route path="visualization/data-analysis" element={<LazyPage><GuardedPage pathname="/visualization/data-analysis"><DataAnalysisPage /></GuardedPage></LazyPage>} />
          <Route path="visualization/multi-dimension-data-analysis" element={<LazyPage><GuardedPage pathname="/visualization/multi-dimension-data-analysis"><MultiDimensionPage /></GuardedPage></LazyPage>} />
          <Route path="list/search-table" element={<LazyPage><GuardedPage pathname="/list/search-table"><SearchTablePage /></GuardedPage></LazyPage>} />
          <Route path="list/card" element={<LazyPage><GuardedPage pathname="/list/card"><CardListPage /></GuardedPage></LazyPage>} />
          <Route path="form/group" element={<LazyPage><GuardedPage pathname="/form/group"><GroupFormPage /></GuardedPage></LazyPage>} />
          <Route path="form/step" element={<LazyPage><GuardedPage pathname="/form/step"><StepFormPage /></GuardedPage></LazyPage>} />
          <Route path="profile/basic" element={<LazyPage><GuardedPage pathname="/profile/basic"><BasicProfilePage /></GuardedPage></LazyPage>} />
          <Route path="result/success" element={<LazyPage><GuardedPage pathname="/result/success"><SuccessResultPage /></GuardedPage></LazyPage>} />
          <Route path="result/error" element={<LazyPage><GuardedPage pathname="/result/error"><ErrorResultPage /></GuardedPage></LazyPage>} />
          <Route path="exception/403" element={<LazyPage><GuardedPage pathname="/exception/403"><Exception403Page /></GuardedPage></LazyPage>} />
          <Route path="exception/404" element={<LazyPage><GuardedPage pathname="/exception/404"><Exception404Page /></GuardedPage></LazyPage>} />
          <Route path="exception/500" element={<LazyPage><GuardedPage pathname="/exception/500"><Exception500Page /></GuardedPage></LazyPage>} />
          <Route path="user/info" element={<LazyPage><GuardedPage pathname="/user/info"><UserInfoPage /></GuardedPage></LazyPage>} />
          <Route path="user/setting" element={<LazyPage><GuardedPage pathname="/user/setting"><UserSettingPage /></GuardedPage></LazyPage>} />
          <Route path="users" element={<LazyPage><GuardedPage pathname="/users"><UsersPage /></GuardedPage></LazyPage>} />
          <Route path="roles" element={<LazyPage><GuardedPage pathname="/roles"><RolesPage /></GuardedPage></LazyPage>} />
          <Route path="welcome" element={<LazyPage><WelcomePage /></LazyPage>} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
