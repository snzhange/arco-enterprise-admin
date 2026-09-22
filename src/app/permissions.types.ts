import type {
  DataScope as ApiDataScope,
  RoleSummary as ApiRoleSummary,
  PermissionCode,
} from '@/api/generated/models'

export type Permission = PermissionCode

export type DataScope = ApiDataScope

export type RoleSummary = ApiRoleSummary

export interface PermissionRequirement {
  all?: Permission[]
  any?: Permission[]
}
