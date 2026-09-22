import type { CurrentUser } from '@/api/generated/models'

import { describe, expect, it } from 'vitest'

import { canAccess, hasAnyPermission, hasPermission } from './permissions'

const user: CurrentUser = {
  id: '00000000-0000-4000-8000-000000000001',
  displayName: '测试用户',
  email: 'test@example.com',
  permissions: ['dashboard:read', 'users:read'],
  roleCodes: ['operator'],
  dataScope: 'department',
}

describe('permission helpers', () => {
  it('matches exact permissions and wildcard permissions', () => {
    expect(hasPermission(user, 'users:read')).toBe(true)
    expect(hasPermission(user, 'users:write')).toBe(false)
    expect(hasPermission({ ...user, permissions: ['*'] }, 'users:write')).toBe(true)
  })

  it('matches at least one permission', () => {
    expect(hasAnyPermission(user, ['users:write', 'dashboard:read'])).toBe(true)
    expect(hasAnyPermission(user, ['users:write'])).toBe(false)
  })

  it('evaluates all and any route requirements', () => {
    expect(canAccess(user, { all: ['users:read'] })).toBe(true)
    expect(canAccess(user, { all: ['users:read', 'users:write'] })).toBe(false)
    expect(canAccess(user, { any: ['users:write', 'dashboard:read'] })).toBe(true)
    expect(canAccess(user)).toBe(true)
  })
})
