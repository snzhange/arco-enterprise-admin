import type { Permission } from './permissions.types'

export const PERMISSIONS = {
  dashboardRead: 'dashboard:read',
  visualizationRead: 'visualization:read',
  listRead: 'list:read',
  formRead: 'form:read',
  profileRead: 'profile:read',
  resultRead: 'result:read',
  exceptionRead: 'exception:read',
  userRead: 'user:read',
  usersRead: 'users:read',
  usersWrite: 'users:write',
  rolesRead: 'roles:read',
  rolesWrite: 'roles:write',
  auditRead: 'audit:read',
} as const satisfies Record<string, Permission>
