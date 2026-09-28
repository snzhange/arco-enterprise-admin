import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { handlers, resetMockStateForTests } from './handlers'
import { MOCK_PERMISSION_OPTIONS, MOCK_ROLE_OPTIONS } from './rbac'

const server = setupServer(...handlers)

function headers(role = 'admin'): HeadersInit {
  return {
    'X-Mock-Session': '1',
    'X-Mock-Role': role,
  }
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
beforeEach(() => {
  resetMockStateForTests()
  sessionStorage.clear()
})
afterEach(() => {
  server.resetHandlers()
  resetMockStateForTests()
  sessionStorage.clear()
})
afterAll(() => server.close())

describe('rbac mock contracts', () => {
  it('returns role and permission directories only with the required authority', async () => {
    const roleResponse = await fetch('http://localhost/api/role-options', { headers: headers() })
    const permissionResponse = await fetch('http://localhost/api/permissions', { headers: headers() })
    expect(roleResponse.status).toBe(200)
    expect(permissionResponse.status).toBe(200)
    expect(await roleResponse.json()).toEqual(MOCK_ROLE_OPTIONS)
    expect(await permissionResponse.json()).toEqual(MOCK_PERMISSION_OPTIONS)

    const operatorRoleResponse = await fetch('http://localhost/api/role-options', { headers: headers('operator') })
    const operatorPermissionResponse = await fetch('http://localhost/api/permissions', { headers: headers('operator') })
    expect(operatorRoleResponse.status).toBe(403)
    expect(operatorPermissionResponse.status).toBe(403)
  })

  it('returns 401 without a mock session', async () => {
    const response = await fetch('http://localhost/api/permissions')
    expect(response.status).toBe(401)
  })

  it('accepts role codes and rejects display names', async () => {
    const validResponse = await fetch('http://localhost/api/users', {
      method: 'POST',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '契约测试用户',
        email: 'contract-test@arco.dev',
        department: '平台部',
        roleCodes: ['operator'],
      }),
    })
    expect(validResponse.status).toBe(201)
    expect((await validResponse.json()).roleCodes).toEqual(['operator'])

    const invalidResponse = await fetch('http://localhost/api/users', {
      method: 'POST',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '错误角色用户',
        email: 'invalid-role@arco.dev',
        department: '平台部',
        roleCodes: ['运营人员'],
      }),
    })
    expect(invalidResponse.status).toBe(400)
  })

  it('keeps inactive role codes and unknown permissions visible', async () => {
    const usersResponse = await fetch('http://localhost/api/users?page=0&size=20', { headers: headers() })
    const users = await usersResponse.json() as { content: Array<{ roleCodes: string[] }> }
    expect(users.content.some(user => user.roleCodes.includes('finance'))).toBe(true)

    const rolesResponse = await fetch('http://localhost/api/roles', { headers: headers() })
    const roles = await rolesResponse.json() as Array<{ code: string, permissions: string[] }>
    expect(roles.find(role => role.code === 'auditor')?.permissions).toContain('legacy:read')
  })

  it('sorts users by the allowed single field with stable id ties and rejects invalid sort parameters', async () => {
    const response = await fetch('http://localhost/api/users?page=0&size=20&sort=name,asc', { headers: headers() })
    const users = await response.json() as { content: Array<{ id: string, name: string }> }
    const expected = [...users.content].sort((left, right) => left.name.localeCompare(right.name, 'zh-CN') || left.id.localeCompare(right.id))
    expect(users.content.map(user => user.id)).toEqual(expected.map(user => user.id))

    for (const sort of ['name,asc&sort=lastActiveAt,desc', 'unknown,asc', 'name,up', 'name,asc,extra']) {
      const invalid = await fetch(`http://localhost/api/users?page=0&size=20&sort=${sort}`, { headers: headers() })
      expect(invalid.status).toBe(400)
      const problem = await invalid.json() as { fieldErrors?: Array<{ field: string }> }
      expect(problem.fieldErrors?.[0]?.field).toBe('sort')
    }
  })

  it('preserves existing inactive or unknown role codes but rejects newly assigned unknown roles', async () => {
    const preserveInactiveResponse = await fetch('http://localhost/api/users/00000000-0000-4000-8000-000000000103', {
      method: 'PATCH',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ roleCodes: ['finance'] }),
    })
    expect(preserveInactiveResponse.status).toBe(200)
    expect((await preserveInactiveResponse.json()).roleCodes).toEqual(['finance'])

    const preserveUnknownResponse = await fetch('http://localhost/api/users/00000000-0000-4000-8000-000000000112', {
      method: 'PATCH',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ roleCodes: ['auditor', 'legacy-manager'] }),
    })
    expect(preserveUnknownResponse.status).toBe(200)
    expect((await preserveUnknownResponse.json()).roleCodes).toEqual(['auditor', 'legacy-manager'])

    const rejectResponse = await fetch('http://localhost/api/users/00000000-0000-4000-8000-000000000102', {
      method: 'PATCH',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ roleCodes: ['operator', 'future-role'] }),
    })
    expect(rejectResponse.status).toBe(400)
  })

  it('preserves existing unknown permissions but rejects newly granted unknown permissions', async () => {
    const preserveResponse = await fetch('http://localhost/api/roles/auditor', {
      method: 'PATCH',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dataScope: 'all',
        permissions: ['dashboard:read', 'audit:read', 'legacy:read'],
      }),
    })
    expect(preserveResponse.status).toBe(200)
    expect((await preserveResponse.json()).permissions).toContain('legacy:read')

    const rejectResponse = await fetch('http://localhost/api/roles/operator', {
      method: 'PATCH',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dataScope: 'department',
        permissions: ['dashboard:read', 'users:read', 'future:read'],
      }),
    })
    expect(rejectResponse.status).toBe(400)
  })

  it('rejects wildcard permissions for non-system roles', async () => {
    const response = await fetch('http://localhost/api/roles/operator', {
      method: 'PATCH',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataScope: 'department', permissions: ['*'] }),
    })
    expect(response.status).toBe(400)
  })

  it('allows role readers to inspect directories but rejects role updates', async () => {
    const directoryResponse = await fetch('http://localhost/api/permissions', { headers: headers('role-reader') })
    expect(directoryResponse.status).toBe(200)

    const updateResponse = await fetch('http://localhost/api/roles/operator', {
      method: 'PATCH',
      headers: { ...headers('role-reader'), 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataScope: 'department', permissions: ['users:read'] }),
    })
    expect(updateResponse.status).toBe(403)
  })

  it('persists a role update within a test and restores the default snapshot at the boundary', async () => {
    const updateResponse = await fetch('http://localhost/api/roles/operator', {
      method: 'PATCH',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataScope: 'all', permissions: ['users:read'] }),
    })
    expect(updateResponse.status).toBe(200)

    const rereadResponse = await fetch('http://localhost/api/roles', { headers: headers() })
    const rereadRoles = await rereadResponse.json() as Array<{ code: string, dataScope: string, permissions: string[] }>
    expect(rereadRoles.find(role => role.code === 'operator')).toMatchObject({ dataScope: 'all', permissions: ['users:read'] })

    resetMockStateForTests()
    const restoredResponse = await fetch('http://localhost/api/roles', { headers: headers() })
    const restoredRoles = await restoredResponse.json() as Array<{ code: string, dataScope: string, permissions: string[] }>
    expect(restoredRoles.find(role => role.code === 'operator')).toMatchObject({ dataScope: 'department', permissions: ['dashboard:read', 'users:read'] })
  })
})
