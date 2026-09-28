import type {
  CreateUserRequest,
  CurrentUser,
  DashboardSummary,
  LoginRequest,
  RoleSummary,
  UpdateRoleRequest,
  UpdateUserRequest,
  User,
  UserPage,
  UserStatus,
} from '@/api/generated/models'

import { http, HttpResponse } from 'msw'
import {
  cloneRoleSummaries,
  cloneUsers,
  MOCK_PERMISSION_OPTIONS,
  MOCK_ROLE_OPTIONS,
  MOCK_USERS,
} from './rbac'

const AUTH_COOKIE = 'arco_mock_session'

function hasSession(request?: Request): boolean {
  if (request) {
    return request.headers.get('X-Mock-Session') === '1'
      || request.headers.get('cookie')?.includes(`${AUTH_COOKIE}=1`) === true
  }
  return typeof document !== 'undefined' && document.cookie.includes(`${AUTH_COOKIE}=1`)
}

const initialUsers = cloneUsers()
const initialRoles = cloneRoleSummaries()
const initialCurrentUser = MOCK_USERS.admin

let currentUser: CurrentUser = initialCurrentUser

function getCurrentUser(request?: Request): CurrentUser {
  const role = request?.headers.get('X-Mock-Role') || request?.headers.get('cookie')?.match(/arco_mock_role=([^;]+)/)?.[1]
  return (role && MOCK_USERS[role]) || currentUser
}

function getMockFailure(request: Request): string | null {
  return request.headers.get('X-Mock-Failure')
    || request.headers.get('cookie')?.match(/arco_mock_failure=([^;]+)/)?.[1]
    || null
}

const ROLE_STORAGE_KEY = 'arco_mock_roles'

function readPersistedRoles(): RoleSummary[] {
  if (typeof sessionStorage === 'undefined')
    return cloneRoleSummaries()

  try {
    const value = sessionStorage.getItem(ROLE_STORAGE_KEY)
    if (!value)
      return cloneRoleSummaries()
    const parsed = JSON.parse(value) as unknown
    if (!Array.isArray(parsed) || parsed.some(role => !role || typeof role !== 'object'))
      return cloneRoleSummaries()
    return parsed as RoleSummary[]
  }
  catch {
    return cloneRoleSummaries()
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

let users: User[] = initialUsers.map(user => ({ ...user, roleCodes: [...user.roleCodes] }))

/** Reset mutable MSW state between tests without changing in-test persistence semantics. */
export function resetMockStateForTests(): void {
  currentUser = initialCurrentUser
  users = initialUsers.map(user => ({ ...user, roleCodes: [...user.roleCodes] }))
  roles.splice(0, roles.length, ...initialRoles.map(role => ({ ...role, permissions: [...role.permissions] })))
  if (typeof sessionStorage !== 'undefined')
    sessionStorage.removeItem(ROLE_STORAGE_KEY)
}

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

function problemResponse(payload: Record<string, unknown>, status: number) {
  return HttpResponse.json(payload, {
    status,
    headers: { 'Content-Type': 'application/problem+json' },
  })
}

function unauthorized() {
  return problemResponse({ title: 'Unauthorized', status: 401, detail: '登录已过期', code: 'SESSION_EXPIRED' }, 401)
}

function forbidden() {
  return problemResponse({ title: 'Forbidden', status: 403, detail: '没有操作权限', code: 'FORBIDDEN' }, 403)
}

function hasPermission(request: Request, permission: string): boolean {
  const user = getCurrentUser(request)
  return user.permissions.includes('*') || user.permissions.includes(permission)
}

function badRequest(detail: string, fieldErrors?: Array<{ field: string, message: string }>) {
  return problemResponse({ title: 'Bad Request', status: 400, detail, fieldErrors }, 400)
}

type UserSortField = 'name' | 'lastActiveAt'
type UserSortDirection = 'asc' | 'desc'

interface UserSort {
  field: UserSortField
  direction: UserSortDirection
}

function parseUserSort(searchParams: URLSearchParams): UserSort | undefined {
  const values = searchParams.getAll('sort')
  if (values.length === 0)
    return undefined
  if (values.length !== 1)
    throw new Error('用户列表只支持一个 sort 参数')

  const [field, direction, extra] = values[0].split(',')
  if (
    extra !== undefined
    || (field !== 'name' && field !== 'lastActiveAt')
    || (direction !== 'asc' && direction !== 'desc')
  ) {
    throw new Error('sort 仅支持 name 或 lastActiveAt，方向为 asc 或 desc')
  }

  return { field, direction }
}

function sortUsers(records: User[], sort?: UserSort): User[] {
  if (!sort)
    return records

  const direction = sort.direction === 'asc' ? 1 : -1
  return [...records].sort((left, right) => {
    const leftValue = sort.field === 'name' ? left.name : left.lastActiveAt
    const rightValue = sort.field === 'name' ? right.name : right.lastActiveAt
    const compared = leftValue.localeCompare(rightValue, 'zh-CN')
    if (compared !== 0)
      return compared * direction
    return left.id.localeCompare(right.id)
  })
}

function isValidRoleCodes(roleCodes: unknown, existingUser?: User): roleCodes is string[] {
  if (!Array.isArray(roleCodes) || roleCodes.length === 0 || roleCodes.some(code => typeof code !== 'string'))
    return false
  if (new Set(roleCodes).size !== roleCodes.length)
    return false
  return roleCodes.every((code) => {
    if (existingUser?.roleCodes.includes(code))
      return true
    const option = MOCK_ROLE_OPTIONS.find(item => item.code === code)
    return Boolean(option?.active)
  })
}

function isValidRolePermissions(role: RoleSummary, permissions: unknown): permissions is string[] {
  if (!Array.isArray(permissions) || permissions.some(permission => typeof permission !== 'string'))
    return false
  if (new Set(permissions).size !== permissions.length)
    return false
  const hasWildcard = permissions.includes('*')
  if (hasWildcard)
    return role.code === 'admin' && permissions.length === 1
  return permissions.every((permission) => {
    if (role.permissions.includes(permission))
      return true
    return MOCK_PERMISSION_OPTIONS.some(option => option.code === permission && option.assignable)
  })
}

function cloneRoleOptions() {
  return MOCK_ROLE_OPTIONS.map(option => ({ ...option }))
}

function clonePermissionOptions() {
  return MOCK_PERMISSION_OPTIONS.map(option => ({ ...option }))
}

export const handlers = [
  http.get('*/api/auth/session', ({ request }) => {
    if (getMockFailure(request) === 'session-500') {
      return problemResponse({
        title: '服务暂时不可用',
        status: 500,
        detail: '会话服务暂时不可用',
        traceId: 'session-500',
      }, 500)
    }
    return hasSession(request) ? HttpResponse.json(getCurrentUser(request)) : unauthorized()
  }),
  http.post('*/api/auth/login', async ({ request }) => {
    const body = await request.json() as LoginRequest
    if (body.email === 'admin@arco.dev' && body.password === 'admin1234') {
      currentUser = MOCK_USERS.admin
      return new HttpResponse(null, {
        status: 204,
        headers: { 'Set-Cookie': `${AUTH_COOKIE}=1; Path=/; SameSite=Lax` },
      })
    }
    if (body.email === 'operator@arco.dev' && body.password === 'operator1234') {
      currentUser = MOCK_USERS.operator
      return new HttpResponse(null, {
        status: 204,
        headers: { 'Set-Cookie': `${AUTH_COOKIE}=1; Path=/; SameSite=Lax` },
      })
    }
    if (body.email === 'list-reader@arco.dev' && body.password === 'listreader1234') {
      currentUser = MOCK_USERS['list-reader']
      return new HttpResponse(null, {
        status: 204,
        headers: { 'Set-Cookie': `${AUTH_COOKIE}=1; Path=/; SameSite=Lax` },
      })
    }
    if (body.email === 'user-reader@arco.dev' && body.password === 'userreader1234') {
      currentUser = MOCK_USERS['user-reader']
      return new HttpResponse(null, {
        status: 204,
        headers: { 'Set-Cookie': `${AUTH_COOKIE}=1; Path=/; SameSite=Lax` },
      })
    }
    return problemResponse({ title: 'Unauthorized', status: 401, detail: '邮箱或密码错误', code: 'INVALID_CREDENTIALS' }, 401)
  }),
  http.post('*/api/auth/logout', () => {
    currentUser = MOCK_USERS.admin
    return new HttpResponse(null, {
      status: 204,
      headers: { 'Set-Cookie': `${AUTH_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax` },
    })
  }),
  http.get('*/api/dashboard/summary', ({ request }) => {
    if (getMockFailure(request) === 'business-401')
      return unauthorized()
    if (getMockFailure(request) === 'network')
      return HttpResponse.error()
    return hasSession(request) ? HttpResponse.json(dashboard) : unauthorized()
  }),
  http.get('*/api/role-options', ({ request }) => {
    if (!hasSession(request))
      return unauthorized()
    if (!hasPermission(request, 'users:write'))
      return forbidden()
    return HttpResponse.json(cloneRoleOptions())
  }),
  http.get('*/api/permissions', ({ request }) => {
    if (!hasSession(request))
      return unauthorized()
    if (!hasPermission(request, 'roles:read'))
      return forbidden()
    return HttpResponse.json(clonePermissionOptions())
  }),
  http.get('*/api/users', ({ request }) => {
    if (!hasSession(request))
      return unauthorized()
    if (!hasPermission(request, 'users:read'))
      return forbidden()
    if (getMockFailure(request) === 'users-500') {
      return problemResponse({
        title: '服务暂时不可用',
        status: 500,
        detail: '用户目录暂时不可用',
        traceId: 'users-500',
      }, 500)
    }
    const url = new URL(request.url)
    let sort: UserSort | undefined
    try {
      sort = parseUserSort(url.searchParams)
    }
    catch (error) {
      return badRequest(error instanceof Error ? error.message : 'sort 参数无效', [{ field: 'sort', message: '请选择 name 或 lastActiveAt 的 asc/desc 排序' }])
    }
    const page = Math.max(Number(url.searchParams.get('page') || 0), 0)
    const size = Math.min(Math.max(Number(url.searchParams.get('size') || 10), 1), 100)
    const keyword = url.searchParams.get('keyword')?.toLowerCase()
    const status = url.searchParams.get('status') as UserStatus | null
    const filtered = users.filter((user) => {
      const matchesKeyword = !keyword || user.name.toLowerCase().includes(keyword) || user.email.toLowerCase().includes(keyword)
      return matchesKeyword && (!status || user.status === status)
    })
    const content = sortUsers(filtered, sort).slice(page * size, (page + 1) * size)
    const response: UserPage = {
      content,
      page,
      size,
      totalElements: filtered.length,
      totalPages: Math.ceil(filtered.length / size),
    }
    return HttpResponse.json(response)
  }),
  http.post('*/api/users', async ({ request }) => {
    if (!hasSession(request))
      return unauthorized()
    if (!hasPermission(request, 'users:write'))
      return forbidden()
    if (getMockFailure(request) === 'user-field-error')
      return badRequest('请检查用户信息', [{ field: 'roleCodes', message: '请选择有效的角色代码' }])
    const body = await request.json() as CreateUserRequest
    if (!isValidRoleCodes(body.roleCodes))
      return badRequest('roleCodes 包含未知、重复或不可分配的角色代码', [{ field: 'roleCodes', message: '请选择有效的角色代码' }])
    const user: User = {
      id: crypto.randomUUID(),
      ...body,
      status: 'active',
      lastActiveAt: new Date().toISOString(),
    }
    users = [user, ...users]
    return HttpResponse.json(user, { status: 201 })
  }),
  http.patch('*/api/users/:userId', async ({ params, request }) => {
    if (!hasSession(request))
      return unauthorized()
    if (!hasPermission(request, 'users:write'))
      return forbidden()
    if (getMockFailure(request) === 'user-field-error')
      return badRequest('请检查用户信息', [{ field: 'roleCodes', message: '请选择有效的角色代码' }])
    const index = users.findIndex(user => user.id === params.userId)
    if (index < 0)
      return problemResponse({ title: 'Not Found', status: 404, detail: '用户不存在' }, 404)
    const body = await request.json() as UpdateUserRequest
    if (body.roleCodes !== undefined && !isValidRoleCodes(body.roleCodes, users[index]))
      return badRequest('roleCodes 包含未知、重复或不可分配的角色代码', [{ field: 'roleCodes', message: '请选择有效的角色代码' }])
    users[index] = { ...users[index], ...body, roleCodes: body.roleCodes ?? users[index].roleCodes }
    return HttpResponse.json(users[index])
  }),
  http.get('*/api/roles', ({ request }) => {
    if (!hasSession(request))
      return unauthorized()
    if (!hasPermission(request, 'roles:read'))
      return forbidden()
    return HttpResponse.json(roles)
  }),
  http.patch('*/api/roles/:roleCode', async ({ params, request }) => {
    if (!hasSession(request))
      return unauthorized()
    if (getMockFailure(request) === 'role-403' || !hasPermission(request, 'roles:write'))
      return forbidden()
    const roleCode = String(params.roleCode)
    const index = roles.findIndex(role => role.code === roleCode)
    if (index < 0)
      return problemResponse({ title: 'Not Found', status: 404, detail: '角色不存在' }, 404)
    const body = await request.json() as UpdateRoleRequest
    if (!isValidRolePermissions(roles[index], body.permissions))
      return badRequest('permissions 包含重复权限或不可分配的通配权限', [{ field: 'permissions', message: '权限组合无效' }])
    roles[index] = { ...roles[index], ...body }
    persistRoles(roles)
    return HttpResponse.json(roles[index])
  }),
]
