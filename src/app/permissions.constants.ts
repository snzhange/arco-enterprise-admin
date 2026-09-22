import type { Permission, RoleSummary } from './permissions.types'

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

export const PERMISSION_OPTIONS: Array<{ label: string, value: Permission }> = [
  { value: '*', label: '全部权限' },
  { value: PERMISSIONS.dashboardRead, label: '查看仪表盘' },
  { value: PERMISSIONS.visualizationRead, label: '查看数据可视化' },
  { value: PERMISSIONS.listRead, label: '查看列表页' },
  { value: PERMISSIONS.formRead, label: '查看表单页' },
  { value: PERMISSIONS.profileRead, label: '查看详情页' },
  { value: PERMISSIONS.resultRead, label: '查看结果页' },
  { value: PERMISSIONS.exceptionRead, label: '查看异常页' },
  { value: PERMISSIONS.userRead, label: '查看个人中心' },
  { value: PERMISSIONS.usersRead, label: '查看用户' },
  { value: PERMISSIONS.usersWrite, label: '管理用户' },
  { value: PERMISSIONS.rolesRead, label: '查看角色' },
  { value: PERMISSIONS.rolesWrite, label: '管理角色' },
  { value: PERMISSIONS.auditRead, label: '查看审计日志' },
]

export const DEFAULT_ROLES: RoleSummary[] = [
  {
    code: 'admin',
    name: '系统管理员',
    dataScope: 'all',
    permissions: ['*'],
  },
  {
    code: 'operator',
    name: '运营人员',
    dataScope: 'department',
    permissions: [PERMISSIONS.dashboardRead, PERMISSIONS.usersRead],
  },
  {
    code: 'auditor',
    name: '审计员',
    dataScope: 'all',
    permissions: [PERMISSIONS.dashboardRead, PERMISSIONS.auditRead],
  },
]
