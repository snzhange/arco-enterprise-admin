import type { ComponentType, LazyExoticComponent } from 'react'
import type {
  NavigationGroup,
  NavigationItem,
  RouteManifestGroup,
  RouteManifestPage,
  RouteManifestPublicPage,
  RouteManifestRedirect,
  RouteMatch,
} from './route-manifest.types'

import type { CurrentUser } from '@/api/generated/models'
import {
  IconApps,
  IconCheckCircle,
  IconDashboard,
  IconExclamationCircle,
  IconFile,
  IconList,
  IconSettings,
  IconUser,
} from '@arco-design/web-react/icon'

import { lazy } from 'react'
import { clearChunkRetryMarker } from '@/app/error-recovery'
import { LoginPage } from '@/pages/LoginPage'
import { canAccess } from './permissions'
import { PERMISSIONS } from './permissions.constants'

export type {
  NavigationGroup,
  NavigationItem,
  RouteManifestGroup,
  RouteManifestPage,
  RouteManifestPublicPage,
  RouteManifestRedirect,
  RouteMatch,
} from './route-manifest.types'

export function lazyNamed<T extends ComponentType>(loader: () => Promise<unknown>, exportName: string): LazyExoticComponent<T> {
  return lazy(async () => {
    const module = await loader() as Record<string, unknown>
    clearChunkRetryMarker()
    const component = module[exportName]
    if (typeof component !== 'function')
      throw new Error(`Route component export "${exportName}" was not found`)
    return { default: component as T }
  })
}

const DashboardPage = lazyNamed(() => import('@/pages/DashboardPage'), 'DashboardPage')
const MonitorPage = lazyNamed(() => import('@/pages/official/MonitorPage'), 'MonitorPage')
const DataAnalysisPage = lazyNamed(() => import('@/pages/official/DataAnalysisPage'), 'DataAnalysisPage')
const MultiDimensionPage = lazyNamed(() => import('@/pages/official/MultiDimensionPage'), 'MultiDimensionPage')
const SearchTablePage = lazyNamed(() => import('@/pages/official/SearchTablePage'), 'SearchTablePage')
const CardListPage = lazyNamed(() => import('@/pages/official/CardListPage'), 'CardListPage')
const GroupFormPage = lazyNamed(() => import('@/pages/official/GroupFormPage'), 'GroupFormPage')
const StepFormPage = lazyNamed(() => import('@/pages/official/StepFormPage'), 'StepFormPage')
const BasicProfilePage = lazyNamed(() => import('@/pages/official/BasicProfilePage'), 'BasicProfilePage')
const SuccessResultPage = lazyNamed(() => import('@/pages/official/ResultPages'), 'SuccessResultPage')
const ErrorResultPage = lazyNamed(() => import('@/pages/official/ResultPages'), 'ErrorResultPage')
const Exception403Page = lazyNamed(() => import('@/pages/official/ExceptionPages'), 'Exception403Page')
const Exception404Page = lazyNamed(() => import('@/pages/official/ExceptionPages'), 'Exception404Page')
const Exception500Page = lazyNamed(() => import('@/pages/official/ExceptionPages'), 'Exception500Page')
const UserInfoPage = lazyNamed(() => import('@/pages/official/UserInfoPage'), 'UserInfoPage')
const UserSettingPage = lazyNamed(() => import('@/pages/official/UserSettingPage'), 'UserSettingPage')
const UsersPage = lazyNamed(() => import('@/pages/UsersPage'), 'UsersPage')
const RolesPage = lazyNamed(() => import('@/pages/RolesPage'), 'RolesPage')
const WelcomePage = lazyNamed(() => import('@/pages/WelcomePage'), 'WelcomePage')

export const routeGroups: readonly RouteManifestGroup[] = [
  {
    kind: 'group',
    key: 'dashboard',
    messageKey: 'menu.dashboard',
    permission: { all: [PERMISSIONS.dashboardRead] },
    icon: <IconDashboard />,
    children: [
      { kind: 'page', path: '/dashboard/workplace', component: DashboardPage, messageKey: 'menu.dashboard.workplace' },
      { kind: 'page', path: '/dashboard/monitor', component: MonitorPage, messageKey: 'menu.dashboard.monitor', permission: { all: [PERMISSIONS.dashboardRead] } },
    ],
  },
  {
    kind: 'group',
    key: 'visualization',
    messageKey: 'menu.visualization',
    permission: { all: [PERMISSIONS.visualizationRead] },
    icon: <IconApps />,
    children: [
      { kind: 'page', path: '/visualization/data-analysis', component: DataAnalysisPage, messageKey: 'menu.visualization.dataAnalysis' },
      { kind: 'page', path: '/visualization/multi-dimension-data-analysis', component: MultiDimensionPage, messageKey: 'menu.visualization.multiDimensionDataAnalysis' },
    ],
  },
  {
    kind: 'group',
    key: 'list',
    messageKey: 'menu.list',
    permission: { all: [PERMISSIONS.listRead] },
    icon: <IconList />,
    children: [
      { kind: 'page', path: '/list/search-table', component: SearchTablePage, messageKey: 'menu.list.searchTable', permission: { all: [PERMISSIONS.listRead] } },
      { kind: 'page', path: '/list/card', component: CardListPage, messageKey: 'menu.list.cardList' },
    ],
  },
  {
    kind: 'group',
    key: 'form',
    messageKey: 'menu.form',
    permission: { all: [PERMISSIONS.formRead] },
    icon: <IconSettings />,
    children: [
      { kind: 'page', path: '/form/group', component: GroupFormPage, messageKey: 'menu.form.group' },
      { kind: 'page', path: '/form/step', component: StepFormPage, messageKey: 'menu.form.step' },
    ],
  },
  {
    kind: 'group',
    key: 'profile',
    messageKey: 'menu.profile',
    permission: { all: [PERMISSIONS.profileRead] },
    icon: <IconFile />,
    children: [
      { kind: 'page', path: '/profile/basic', component: BasicProfilePage, messageKey: 'menu.profile.basic' },
    ],
  },
  {
    kind: 'group',
    key: 'result',
    messageKey: 'menu.result',
    permission: { all: [PERMISSIONS.resultRead] },
    icon: <IconCheckCircle />,
    children: [
      { kind: 'page', path: '/result/success', component: SuccessResultPage, messageKey: 'menu.result.success', breadcrumb: false },
      { kind: 'page', path: '/result/error', component: ErrorResultPage, messageKey: 'menu.result.error', breadcrumb: false },
    ],
  },
  {
    kind: 'group',
    key: 'exception',
    messageKey: 'menu.exception',
    permission: { all: [PERMISSIONS.exceptionRead] },
    icon: <IconExclamationCircle />,
    children: [
      { kind: 'page', path: '/exception/403', component: Exception403Page, messageKey: 'menu.exception.403' },
      { kind: 'page', path: '/exception/404', component: Exception404Page, messageKey: 'menu.exception.404' },
      { kind: 'page', path: '/exception/500', component: Exception500Page, messageKey: 'menu.exception.500' },
    ],
  },
  {
    kind: 'group',
    key: 'user',
    messageKey: 'menu.user',
    permission: { all: [PERMISSIONS.userRead] },
    icon: <IconUser />,
    children: [
      { kind: 'page', path: '/user/info', component: UserInfoPage, messageKey: 'menu.user.info', permission: { all: [PERMISSIONS.userRead] } },
      { kind: 'page', path: '/user/setting', component: UserSettingPage, messageKey: 'menu.user.setting' },
    ],
  },
  {
    kind: 'group',
    key: 'system',
    messageKey: 'menu.system',
    icon: <IconSettings />,
    children: [
      { kind: 'page', path: '/roles', component: RolesPage, messageKey: 'menu.system.roles', permission: { all: [PERMISSIONS.rolesRead] } },
      { kind: 'page', path: '/users', component: UsersPage, messageKey: 'menu.system.users', permission: { all: [PERMISSIONS.usersRead] } },
    ],
  },
]

export const hiddenProtectedRoutes = [
  { kind: 'page', path: '/welcome', component: WelcomePage, menu: false, breadcrumb: false },
] as const satisfies readonly RouteManifestPage[]

export const publicRouteManifest = [
  { kind: 'public', path: '/login', component: LoginPage },
] as const satisfies readonly RouteManifestPublicPage[]

export const redirectRouteManifest = [
  { kind: 'redirect', path: '/', to: '/dashboard/workplace' },
  { kind: 'redirect', path: '/dashboard', to: '/dashboard/workplace' },
] as const satisfies readonly RouteManifestRedirect[]

export const protectedRouteMatches: RouteMatch[] = [
  ...routeGroups.flatMap(group => group.children.map(route => ({ group, route }))),
  ...hiddenProtectedRoutes.map(route => ({ route })),
]

export function getRouteMatch(pathname: string): RouteMatch | undefined {
  return protectedRouteMatches.find(match => match.route.path === pathname)
}

export function canAccessRoute(user: CurrentUser | null | undefined, match: RouteMatch): boolean {
  return canAccess(user, match.group?.permission) && canAccess(user, match.route.permission)
}

export function toNestedRoutePath(path: string): string {
  return path === '/' ? '' : path.replace(/^\//, '')
}

function toNavigationItem(route: RouteManifestPage): NavigationItem | undefined {
  if (route.menu === false || !route.messageKey)
    return undefined
  return {
    key: route.path,
    messageKey: route.messageKey,
    permission: route.permission,
    breadcrumb: route.breadcrumb,
  }
}

function toNavigationGroup(group: RouteManifestGroup, children = group.children): NavigationGroup {
  return {
    key: group.key,
    messageKey: group.messageKey,
    icon: group.icon,
    permission: group.permission,
    children: children
      .map(toNavigationItem)
      .filter((item): item is NavigationItem => Boolean(item)),
  }
}

export function getVisibleNavigationGroups(user: CurrentUser): NavigationGroup[] {
  return routeGroups
    .filter(group => canAccess(user, group.permission))
    .map((group) => {
      const children = group.children.filter(route => canAccessRoute(user, { group, route }))
      return toNavigationGroup(group, children)
    })
    .filter(group => group.children.length > 0)
}

export function getNavigationGroup(pathname: string): NavigationGroup | undefined {
  const match = getRouteMatch(pathname)
  return match?.group ? toNavigationGroup(match.group) : undefined
}

export function getNavigationItem(pathname: string): NavigationItem | undefined {
  const match = getRouteMatch(pathname)
  return match ? toNavigationItem(match.route) : undefined
}
