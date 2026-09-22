import type { PermissionRequirement } from './permissions'

import { PERMISSIONS } from './permissions.constants'

const routePermissions: Record<string, PermissionRequirement> = {
  '/dashboard/monitor': { all: [PERMISSIONS.dashboardRead] },
  '/dashboard/workplace': { all: [PERMISSIONS.dashboardRead] },
  '/exception/403': { all: [PERMISSIONS.exceptionRead] },
  '/exception/404': { all: [PERMISSIONS.exceptionRead] },
  '/exception/500': { all: [PERMISSIONS.exceptionRead] },
  '/form/group': { all: [PERMISSIONS.formRead] },
  '/form/step': { all: [PERMISSIONS.formRead] },
  '/list/card': { all: [PERMISSIONS.listRead] },
  '/list/search-table': { all: [PERMISSIONS.listRead] },
  '/profile/basic': { all: [PERMISSIONS.profileRead] },
  '/result/error': { all: [PERMISSIONS.resultRead] },
  '/result/success': { all: [PERMISSIONS.resultRead] },
  '/roles': { all: [PERMISSIONS.rolesRead] },
  '/user/info': { all: [PERMISSIONS.userRead] },
  '/user/setting': { all: [PERMISSIONS.userRead] },
  '/visualization/data-analysis': { all: [PERMISSIONS.visualizationRead] },
  '/visualization/multi-dimension-data-analysis': { all: [PERMISSIONS.visualizationRead] },
  '/users': { all: [PERMISSIONS.usersRead] },
}

export function getRoutePermission(pathname: string): PermissionRequirement | undefined {
  return routePermissions[pathname]
}
