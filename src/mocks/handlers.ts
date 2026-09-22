import type {
  CurrentUser,
  DashboardSummary,
  LoginRequest,
  RoleSummary,
  UpdateRoleRequest,
  User,
  UserPage,
  UserStatus,
} from '@/api/generated/models'

import { http, HttpResponse } from 'msw'

const AUTH_COOKIE = 'arco_mock_session'

function hasSession(request?: Request): boolean {
  if (request) {
    return request.headers.get('X-Mock-Session') === '1'
      || request.headers.get('cookie')?.includes(`${AUTH_COOKIE}=1`) === true
  }
  return typeof document !== 'undefined' && document.cookie.includes(`${AUTH_COOKIE}=1`)
}

const adminUser: CurrentUser = {
  id: '00000000-0000-4000-8000-000000000001',
  displayName: '林晓',
  email: 'lin.xiao@arco.dev',
  avatarUrl: null,
  permissions: ['dashboard:read', 'visualization:read', 'list:read', 'form:read', 'profile:read', 'result:read', 'exception:read', 'user:read', 'users:read', 'users:write', 'roles:read', 'roles:write', 'audit:read'],
  roles: ['admin'],
  dataScope: 'all',
}

const operatorUser: CurrentUser = {
  ...adminUser,
  id: '00000000-0000-4000-8000-000000000002',
  displayName: '运营用户',
  email: 'operator@arco.dev',
  permissions: ['dashboard:read', 'visualization:read', 'list:read', 'form:read', 'profile:read', 'result:read', 'exception:read', 'user:read', 'users:read'],
  roles: ['operator'],
  dataScope: 'department',
}

const listReaderUser: CurrentUser = {
  ...adminUser,
  id: '00000000-0000-4000-8000-000000000003',
  displayName: '列表用户',
  email: 'list-reader@arco.dev',
  permissions: ['list:read'],
  roles: ['list-reader'],
  dataScope: 'self',
}

const userReaderUser: CurrentUser = {
  ...adminUser,
  id: '00000000-0000-4000-8000-000000000004',
  displayName: '个人中心用户',
  email: 'user-reader@arco.dev',
  permissions: ['user:read'],
  roles: ['user-reader'],
  dataScope: 'self',
}

let currentUser: CurrentUser = adminUser

function getCurrentUser(request?: Request): CurrentUser {
  const role = request?.headers.get('X-Mock-Role') || request?.headers.get('cookie')?.match(/arco_mock_role=([^;]+)/)?.[1]
  if (role === 'operator')
    return operatorUser
  if (role === 'list-reader')
    return listReaderUser
  if (role === 'user-reader')
    return userReaderUser
  return currentUser
}

const defaultRoles: RoleSummary[] = [
  { code: 'admin', name: '系统管理员', dataScope: 'all', permissions: ['*'] },
  { code: 'operator', name: '运营人员', dataScope: 'department', permissions: ['dashboard:read', 'users:read'] },
  { code: 'auditor', name: '审计员', dataScope: 'all', permissions: ['dashboard:read', 'audit:read'] },
]

const ROLE_STORAGE_KEY = 'arco_mock_roles'

function cloneRoles(source: RoleSummary[]): RoleSummary[] {
  return source.map(role => ({ ...role, permissions: [...role.permissions] }))
}

function readPersistedRoles(): RoleSummary[] {
  if (typeof sessionStorage === 'undefined')
    return cloneRoles(defaultRoles)

  try {
    const value = sessionStorage.getItem(ROLE_STORAGE_KEY)
    if (!value)
      return cloneRoles(defaultRoles)
    const parsed = JSON.parse(value) as unknown
    if (!Array.isArray(parsed) || parsed.some(role => !role || typeof role !== 'object'))
      return cloneRoles(defaultRoles)
    return parsed as RoleSummary[]
  }
  catch {
    return cloneRoles(defaultRoles)
  }
}

function persistRoles(value: RoleSummary[]): void {
  if (typeof sessionStorage === 'undefined')
    return
  try {
    sessionStorage.setItem(ROLE_STORAGE_KEY, JSON.stringify(value))
  }
  catch {
    // Mock persistence is best effort; API behavior remains available if storage is blocked.
  }
}

const roles: RoleSummary[] = readPersistedRoles()

const initialUsers: Array<[string, string, string, string, UserStatus, string[], string]> = [
  ['00000000-0000-4000-8000-000000000101', '林晓', 'lin.xiao@arco.dev', '产品与运营部', 'active', ['管理员'], '2026-09-06T09:42:00+08:00'],
  ['00000000-0000-4000-8000-000000000102', '周明', 'zhou.ming@arco.dev', '技术平台部', 'active', ['运营'], '2026-09-06T09:21:00+08:00'],
  ['00000000-0000-4000-8000-000000000103', '陈思远', 'chen.siyuan@arco.dev', '财务部', 'invited', ['财务'], '2026-09-05T18:30:00+08:00'],
  ['00000000-0000-4000-8000-000000000104', '王璐', 'wang.lu@arco.dev', '客户成功部', 'active', ['运营', '审计员'], '2026-09-05T16:12:00+08:00'],
  ['00000000-0000-4000-8000-000000000105', '赵启航', 'zhao.qihang@arco.dev', '技术平台部', 'active', ['运营'], '2026-09-05T14:48:00+08:00'],
  ['00000000-0000-4000-8000-000000000106', '苏婉', 'su.wan@arco.dev', '人力资源部', 'disabled', ['审计员'], '2026-09-04T11:03:00+08:00'],
  ['00000000-0000-4000-8000-000000000107', '何宇', 'he.yu@arco.dev', '市场部', 'active', ['运营'], '2026-09-04T10:36:00+08:00'],
  ['00000000-0000-4000-8000-000000000108', '李安然', 'li.anran@arco.dev', '产品与运营部', 'active', ['运营'], '2026-09-03T19:20:00+08:00'],
  ['00000000-0000-4000-8000-000000000109', '高远', 'gao.yuan@arco.dev', '技术平台部', 'invited', ['审计员'], '2026-09-03T15:02:00+08:00'],
  ['00000000-0000-4000-8000-000000000110', '许诺', 'xu.nuo@arco.dev', '客户成功部', 'active', ['运营'], '2026-09-02T13:25:00+08:00'],
  ['00000000-0000-4000-8000-000000000111', '谢雨晴', 'xie.yuqing@arco.dev', '市场部', 'active', ['运营'], '2026-09-02T09:14:00+08:00'],
  ['00000000-0000-4000-8000-000000000112', '唐川', 'tang.chuan@arco.dev', '技术平台部', 'active', ['审计员'], '2026-09-01T17:42:00+08:00'],
]

let users: User[] = initialUsers.map(([id, name, email, department, status, roles, lastActiveAt]) => ({
  id,
  name,
  email,
  department,
  status: status as UserStatus,
  roles,
  lastActiveAt,
}))

const dashboard: DashboardSummary = {
  activeUsers: 1284,
  pendingApprovals: 23,
  monthlyRevenue: 286400,
  systemHealth: 98,
  trends: [
    { date: '2026-08-31', users: 862, requests: 3100 },
    { date: '2026-09-01', users: 920, requests: 3440 },
    { date: '2026-09-02', users: 1040, requests: 3790 },
    { date: '2026-09-03', users: 980, requests: 3520 },
    { date: '2026-09-04', users: 1160, requests: 4180 },
    { date: '2026-09-05', users: 1210, requests: 4410 },
    { date: '2026-09-06', users: 1284, requests: 4670 },
  ],
  recentActivities: [
    { id: '00000000-0000-4000-8000-000000000201', actor: '林晓', action: '创建了新成员', target: '唐川', occurredAt: '2026-09-06T09:42:00+08:00', type: 'create' },
    { id: '00000000-0000-4000-8000-000000000202', actor: '周明', action: '更新了项目权限', target: '数据看板', occurredAt: '2026-09-06T09:18:00+08:00', type: 'update' },
    { id: '00000000-0000-4000-8000-000000000203', actor: '王璐', action: '完成了审批', target: 'Q3 预算申请', occurredAt: '2026-09-06T08:56:00+08:00', type: 'approve' },
    { id: '00000000-0000-4000-8000-000000000204', actor: '系统', action: '检测到服务波动', target: '消息队列', occurredAt: '2026-09-05T21:35:00+08:00', type: 'alert' },
  ],
}

function unauthorized() {
  return HttpResponse.json({ title: 'Unauthorized', status: 401, detail: '登录已过期' }, { status: 401 })
}

function forbidden() {
  return HttpResponse.json({ title: 'Forbidden', status: 403, detail: '没有操作权限' }, { status: 403 })
}

function hasPermission(request: Request, permission: string): boolean {
  const user = getCurrentUser(request)
  return user.permissions.includes('*') || user.permissions.includes(permission)
}

export const handlers = [
  http.get('/api/auth/session', ({ request }) => hasSession(request) ? HttpResponse.json(getCurrentUser(request)) : unauthorized()),
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as LoginRequest
    if (body.email === 'admin@arco.dev' && body.password === 'admin1234') {
      currentUser = adminUser
      return new HttpResponse(null, {
        status: 204,
        headers: { 'Set-Cookie': `${AUTH_COOKIE}=1; Path=/; SameSite=Lax` },
      })
    }
    if (body.email === 'operator@arco.dev' && body.password === 'operator1234') {
      currentUser = operatorUser
      return new HttpResponse(null, {
        status: 204,
        headers: { 'Set-Cookie': `${AUTH_COOKIE}=1; Path=/; SameSite=Lax` },
      })
    }
    if (body.email === 'list-reader@arco.dev' && body.password === 'listreader1234') {
      currentUser = listReaderUser
      return new HttpResponse(null, {
        status: 204,
        headers: { 'Set-Cookie': `${AUTH_COOKIE}=1; Path=/; SameSite=Lax` },
      })
    }
    if (body.email === 'user-reader@arco.dev' && body.password === 'userreader1234') {
      currentUser = userReaderUser
      return new HttpResponse(null, {
        status: 204,
        headers: { 'Set-Cookie': `${AUTH_COOKIE}=1; Path=/; SameSite=Lax` },
      })
    }
    return HttpResponse.json({ title: 'Unauthorized', status: 401, detail: '邮箱或密码错误' }, { status: 401 })
  }),
  http.post('/api/auth/logout', () => {
    currentUser = adminUser
    return new HttpResponse(null, {
      status: 204,
      headers: { 'Set-Cookie': `${AUTH_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax` },
    })
  }),
  http.get('/api/dashboard/summary', ({ request }) => hasSession(request) ? HttpResponse.json(dashboard) : unauthorized()),
  http.get('/api/users', ({ request }) => {
    if (!hasSession(request))
      return unauthorized()
    if (!hasPermission(request, 'users:read'))
      return forbidden()
    const url = new URL(request.url)
    const page = Math.max(Number(url.searchParams.get('page') || 0), 0)
    const size = Math.min(Math.max(Number(url.searchParams.get('size') || 10), 1), 100)
    const keyword = url.searchParams.get('keyword')?.toLowerCase()
    const status = url.searchParams.get('status') as UserStatus | null
    const filtered = users.filter((user) => {
      const matchesKeyword = !keyword || user.name.toLowerCase().includes(keyword) || user.email.toLowerCase().includes(keyword)
      return matchesKeyword && (!status || user.status === status)
    })
    const content = filtered.slice(page * size, (page + 1) * size)
    const response: UserPage = {
      content,
      page,
      size,
      totalElements: filtered.length,
      totalPages: Math.ceil(filtered.length / size),
    }
    return HttpResponse.json(response)
  }),
  http.post('/api/users', async ({ request }) => {
    if (!hasSession(request))
      return unauthorized()
    if (!hasPermission(request, 'users:write'))
      return forbidden()
    const body = await request.json() as { name: string, email: string, department: string, roles: string[] }
    const user: User = {
      id: crypto.randomUUID(),
      ...body,
      status: 'active',
      lastActiveAt: new Date().toISOString(),
    }
    users = [user, ...users]
    return HttpResponse.json(user, { status: 201 })
  }),
  http.patch('/api/users/:userId', async ({ params, request }) => {
    if (!hasSession(request))
      return unauthorized()
    if (!hasPermission(request, 'users:write'))
      return forbidden()
    const index = users.findIndex(user => user.id === params.userId)
    if (index < 0)
      return HttpResponse.json({ title: 'Not Found', status: 404 }, { status: 404 })
    const body = await request.json() as Partial<User>
    users[index] = { ...users[index], ...body }
    return HttpResponse.json(users[index])
  }),
  http.get('/api/roles', ({ request }) => {
    if (!hasSession(request))
      return unauthorized()
    if (!hasPermission(request, 'roles:read'))
      return forbidden()
    return HttpResponse.json(roles)
  }),
  http.patch('/api/roles/:roleCode', async ({ params, request }) => {
    if (!hasSession(request))
      return unauthorized()
    if (!hasPermission(request, 'roles:write'))
      return forbidden()
    const roleCode = String(params.roleCode)
    const index = roles.findIndex(role => role.code === roleCode)
    if (index < 0)
      return HttpResponse.json({ title: 'Not Found', status: 404 }, { status: 404 })
    const body = await request.json() as UpdateRoleRequest
    roles[index] = { ...roles[index], ...body }
    persistRoles(roles)
    return HttpResponse.json(roles[index])
  }),
]
