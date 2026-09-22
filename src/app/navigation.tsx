import type { NavigationGroup, NavigationItem } from './navigation.types'
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
import { canAccess } from './permissions'
import { PERMISSIONS } from './permissions.constants'

export type { NavigationGroup, NavigationItem } from './navigation.types'

export const navigationGroups: NavigationGroup[] = [
  {
    key: 'dashboard',
    messageKey: 'menu.dashboard',
    permission: { all: [PERMISSIONS.dashboardRead] },
    icon: <IconDashboard />,
    children: [
      { key: '/dashboard/workplace', messageKey: 'menu.dashboard.workplace' },
      { key: '/dashboard/monitor', messageKey: 'menu.dashboard.monitor', permission: { all: [PERMISSIONS.dashboardRead] } },
    ],
  },
  {
    key: 'visualization',
    messageKey: 'menu.visualization',
    permission: { all: [PERMISSIONS.visualizationRead] },
    icon: <IconApps />,
    children: [
      { key: '/visualization/data-analysis', messageKey: 'menu.visualization.dataAnalysis' },
      { key: '/visualization/multi-dimension-data-analysis', messageKey: 'menu.visualization.multiDimensionDataAnalysis' },
    ],
  },
  {
    key: 'list',
    messageKey: 'menu.list',
    permission: { all: [PERMISSIONS.listRead] },
    icon: <IconList />,
    children: [
      { key: '/list/search-table', messageKey: 'menu.list.searchTable', permission: { all: [PERMISSIONS.dashboardRead] } },
      { key: '/list/card', messageKey: 'menu.list.cardList' },
    ],
  },
  {
    key: 'form',
    messageKey: 'menu.form',
    permission: { all: [PERMISSIONS.formRead] },
    icon: <IconSettings />,
    children: [
      { key: '/form/group', messageKey: 'menu.form.group' },
      { key: '/form/step', messageKey: 'menu.form.step' },
    ],
  },
  {
    key: 'profile',
    messageKey: 'menu.profile',
    permission: { all: [PERMISSIONS.profileRead] },
    icon: <IconFile />,
    children: [
      { key: '/profile/basic', messageKey: 'menu.profile.basic' },
    ],
  },
  {
    key: 'result',
    messageKey: 'menu.result',
    permission: { all: [PERMISSIONS.resultRead] },
    icon: <IconCheckCircle />,
    children: [
      { key: '/result/success', messageKey: 'menu.result.success', breadcrumb: false },
      { key: '/result/error', messageKey: 'menu.result.error', breadcrumb: false },
    ],
  },
  {
    key: 'exception',
    messageKey: 'menu.exception',
    permission: { all: [PERMISSIONS.exceptionRead] },
    icon: <IconExclamationCircle />,
    children: [
      { key: '/exception/403', messageKey: 'menu.exception.403' },
      { key: '/exception/404', messageKey: 'menu.exception.404' },
      { key: '/exception/500', messageKey: 'menu.exception.500' },
    ],
  },
  {
    key: 'user',
    messageKey: 'menu.user',
    permission: { all: [PERMISSIONS.userRead] },
    icon: <IconUser />,
    children: [
      { key: '/user/info', messageKey: 'menu.user.info', permission: { all: [PERMISSIONS.dashboardRead] } },
      { key: '/user/setting', messageKey: 'menu.user.setting' },
    ],
  },
  {
    key: 'system',
    messageKey: 'menu.system',
    icon: <IconSettings />,
    children: [
      { key: '/roles', messageKey: 'menu.system.roles', permission: { all: [PERMISSIONS.rolesRead] } },
      { key: '/users', messageKey: 'menu.system.users', permission: { all: [PERMISSIONS.usersRead] } },
    ],
  },
]

export function getVisibleNavigationGroups(user: CurrentUser): NavigationGroup[] {
  return navigationGroups
    .map(group => ({
      ...group,
      children: group.children.filter(item => canAccess(user, item.permission)),
    }))
    .filter(group => canAccess(user, group.permission) && group.children.length > 0)
}

export function getNavigationGroup(pathname: string): NavigationGroup | undefined {
  return navigationGroups.find(group => group.children.some(item => item.key === pathname))
}

export function getNavigationItem(pathname: string): NavigationItem | undefined {
  return getNavigationGroup(pathname)?.children.find(item => item.key === pathname)
}
