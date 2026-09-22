import type {
  CurrentUser,
  PermissionOption,
  RoleOption,
  RoleSummary,
  User,
  UserStatus,
} from '@/api/generated/models'

export const MOCK_ROLE_OPTIONS: RoleOption[] = [
  { code: 'admin', name: '系统管理员', active: true },
  { code: 'operator', name: '运营人员', active: true },
  { code: 'auditor', name: '审计员', active: true },
  { code: 'finance', name: '财务人员', active: false },
  { code: 'list-reader', name: '列表只读', active: true },
  { code: 'user-reader', name: '个人中心只读', active: true },
]

export const MOCK_PERMISSION_OPTIONS: PermissionOption[] = [
  { code: '*', name: '全部权限', group: '系统', assignable: false },
  { code: 'dashboard:read', name: '查看仪表盘', group: '仪表盘', assignable: true },
  { code: 'visualization:read', name: '查看数据可视化', group: '数据可视化', assignable: true },
  { code: 'list:read', name: '查看列表页', group: '列表页', assignable: true },
  { code: 'form:read', name: '查看表单页', group: '表单页', assignable: true },
  { code: 'profile:read', name: '查看详情页', group: '详情页', assignable: true },
  { code: 'result:read', name: '查看结果页', group: '结果页', assignable: true },
  { code: 'exception:read', name: '查看异常页', group: '异常页', assignable: true },
  { code: 'user:read', name: '查看个人中心', group: '个人中心', assignable: true },
  { code: 'users:read', name: '查看用户', group: '用户管理', assignable: true },
  { code: 'users:write', name: '管理用户', group: '用户管理', assignable: true },
  { code: 'roles:read', name: '查看角色', group: '角色管理', assignable: true },
  { code: 'roles:write', name: '管理角色', group: '角色管理', assignable: true },
  { code: 'audit:read', name: '查看审计日志', group: '审计', assignable: true },
]

export const MOCK_ROLE_SUMMARIES: RoleSummary[] = [
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
    permissions: ['dashboard:read', 'users:read'],
  },
  {
    code: 'auditor',
    name: '审计员',
    dataScope: 'all',
    permissions: ['dashboard:read', 'audit:read', 'legacy:read'],
  },
]

const MOCK_USER_SEEDS: Array<[string, string, string, string, UserStatus, string[], string]> = [
  ['00000000-0000-4000-8000-000000000101', '林晓', 'lin.xiao@arco.dev', '产品与运营部', 'active', ['admin'], '2026-09-06T09:42:00+08:00'],
  ['00000000-0000-4000-8000-000000000102', '周明', 'zhou.ming@arco.dev', '技术平台部', 'active', ['operator'], '2026-09-06T09:21:00+08:00'],
  ['00000000-0000-4000-8000-000000000103', '陈思远', 'chen.siyuan@arco.dev', '财务部', 'invited', ['finance'], '2026-09-05T18:30:00+08:00'],
  ['00000000-0000-4000-8000-000000000104', '王璐', 'wang.lu@arco.dev', '客户成功部', 'active', ['operator', 'auditor'], '2026-09-05T16:12:00+08:00'],
  ['00000000-0000-4000-8000-000000000105', '赵启航', 'zhao.qihang@arco.dev', '技术平台部', 'active', ['operator'], '2026-09-05T14:48:00+08:00'],
  ['00000000-0000-4000-8000-000000000106', '苏婉', 'su.wan@arco.dev', '人力资源部', 'disabled', ['auditor'], '2026-09-04T11:03:00+08:00'],
  ['00000000-0000-4000-8000-000000000107', '何宇', 'he.yu@arco.dev', '市场部', 'active', ['operator'], '2026-09-04T10:36:00+08:00'],
  ['00000000-0000-4000-8000-000000000108', '李安然', 'li.anran@arco.dev', '产品与运营部', 'active', ['operator'], '2026-09-03T19:20:00+08:00'],
  ['00000000-0000-4000-8000-000000000109', '高远', 'gao.yuan@arco.dev', '技术平台部', 'invited', ['auditor'], '2026-09-03T15:02:00+08:00'],
  ['00000000-0000-4000-8000-000000000110', '许诺', 'xu.nuo@arco.dev', '客户成功部', 'active', ['operator'], '2026-09-02T13:25:00+08:00'],
  ['00000000-0000-4000-8000-000000000111', '谢雨晴', 'xie.yuqing@arco.dev', '市场部', 'active', ['operator'], '2026-09-02T09:14:00+08:00'],
  ['00000000-0000-4000-8000-000000000112', '唐川', 'tang.chuan@arco.dev', '技术平台部', 'active', ['auditor', 'legacy-manager'], '2026-09-01T17:42:00+08:00'],
]

export const MOCK_INITIAL_USERS: User[] = MOCK_USER_SEEDS.map(([id, name, email, department, status, roleCodes, lastActiveAt]) => ({
  id,
  name,
  email,
  department,
  status: status as UserStatus,
  roleCodes,
  lastActiveAt,
}))

export function cloneRoleSummaries(source: RoleSummary[] = MOCK_ROLE_SUMMARIES): RoleSummary[] {
  return source.map(role => ({ ...role, permissions: [...role.permissions] }))
}

export function cloneUsers(source: User[] = MOCK_INITIAL_USERS): User[] {
  return source.map(user => ({ ...user, roleCodes: [...user.roleCodes] }))
}

export const MOCK_USERS: Record<string, CurrentUser> = {
  'admin': {
    id: '00000000-0000-4000-8000-000000000001',
    displayName: '林晓',
    email: 'lin.xiao@arco.dev',
    avatarUrl: null,
    permissions: ['*'],
    roleCodes: ['admin'],
    dataScope: 'all',
  },
  'operator': {
    id: '00000000-0000-4000-8000-000000000002',
    displayName: '运营用户',
    email: 'operator@arco.dev',
    avatarUrl: null,
    permissions: ['dashboard:read', 'visualization:read', 'list:read', 'form:read', 'profile:read', 'result:read', 'exception:read', 'user:read', 'users:read'],
    roleCodes: ['operator'],
    dataScope: 'department',
  },
  'list-reader': {
    id: '00000000-0000-4000-8000-000000000003',
    displayName: '列表用户',
    email: 'list-reader@arco.dev',
    avatarUrl: null,
    permissions: ['list:read'],
    roleCodes: ['list-reader'],
    dataScope: 'self',
  },
  'user-reader': {
    id: '00000000-0000-4000-8000-000000000004',
    displayName: '个人中心用户',
    email: 'user-reader@arco.dev',
    avatarUrl: null,
    permissions: ['user:read'],
    roleCodes: ['user-reader'],
    dataScope: 'self',
  },
  'role-reader': {
    id: '00000000-0000-4000-8000-000000000005',
    displayName: '角色只读用户',
    email: 'role-reader@arco.dev',
    avatarUrl: null,
    permissions: ['roles:read'],
    roleCodes: ['role-reader'],
    dataScope: 'self',
  },
}
