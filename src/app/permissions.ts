import type { Permission, PermissionRequirement } from './permissions.types'
import type { CurrentUser } from '@/api/generated/models'

export type { DataScope, Permission, PermissionRequirement, RoleSummary } from './permissions.types'

export function hasPermission(user: CurrentUser | null | undefined, permission: Permission): boolean {
  return Boolean(user?.permissions.includes('*') || user?.permissions.includes(permission))
}

export function hasAnyPermission(user: CurrentUser | null | undefined, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(user, permission))
}

export function canAccess(user: CurrentUser | null | undefined, requirement?: PermissionRequirement): boolean {
  if (!requirement)
    return true
  const matchesAll = requirement.all?.every(permission => hasPermission(user, permission)) ?? true
  const matchesAny = requirement.any ? hasAnyPermission(user, requirement.any) : true
  return matchesAll && matchesAny
}
