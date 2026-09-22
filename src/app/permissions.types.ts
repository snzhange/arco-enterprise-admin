export type Permission = '*' | `${string}:${string}`

export type DataScope = 'all' | 'department' | 'self'

export interface RoleSummary {
  code: string
  dataScope: DataScope
  name: string
  permissions: Permission[]
}

export interface PermissionRequirement {
  all?: Permission[]
  any?: Permission[]
}
