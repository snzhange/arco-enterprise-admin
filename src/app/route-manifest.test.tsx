import type { RouteManifestGroup, RouteManifestPage } from './route-manifest'

import type { CurrentUser } from '@/api/generated/models'

import { describe, expect, it } from 'vitest'

import {
  canAccessRoute,
  createRouteMatches,
  findRouteMatch,
  getNavigationGroup,
  getNavigationItem,
  getRouteMatch,
  getVisibleNavigationGroups,
  hiddenProtectedRoutes,
  protectedRouteMatches,
  publicRouteManifest,
  redirectRouteManifest,
  routeGroups,
} from './route-manifest'

function user(permissions: string[]): CurrentUser {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    displayName: '测试用户',
    email: 'test@example.com',
    avatarUrl: null,
    permissions,
    roleCodes: ['custom'],
    dataScope: 'department',
  }
}

describe('route manifest structure', () => {
  it('keeps every route path unique and every menu item routable', () => {
    const paths = [
      ...publicRouteManifest.map(route => route.path),
      ...redirectRouteManifest.map(route => route.path),
      ...protectedRouteMatches.map(match => match.route.path),
    ]

    expect(new Set(paths).size).toBe(paths.length)
    for (const group of routeGroups) {
      for (const item of group.children)
        expect(getRouteMatch(item.path)?.route).toBe(item)
    }
  })

  it('keeps hidden pages routable without exposing them as navigation items', () => {
    const welcome = hiddenProtectedRoutes.find(route => route.path === '/welcome')
    expect(welcome).toBeDefined()
    expect(getRouteMatch('/welcome')?.route).toBe(welcome)
    expect(getNavigationGroup('/welcome')).toBeUndefined()
    expect(getNavigationItem('/welcome')).toBeUndefined()
  })

  it('preserves the result pages breadcrumb switch', () => {
    expect(getNavigationItem('/result/success')?.breadcrumb).toBe(false)
    expect(getNavigationItem('/result/error')?.breadcrumb).toBe(false)
  })
})

describe('route matching for sub pages', () => {
  const Page = () => null
  const list = { kind: 'page', path: '/orders', component: Page, messageKey: 'menu.list.searchTable' } as const satisfies RouteManifestPage
  const create = { kind: 'page', path: '/orders/new', component: Page, messageKey: 'menu.form.group', menu: false, parent: '/orders' } as const satisfies RouteManifestPage
  const detail = { kind: 'page', path: '/orders/:id', component: Page, messageKey: 'menu.profile.basic', menu: false, parent: '/orders' } as const satisfies RouteManifestPage
  const orphan = { kind: 'page', path: '/orphan/:id', component: Page, menu: false } as const satisfies RouteManifestPage
  const group = { kind: 'group', key: 'orders', icon: null, messageKey: 'menu.list', children: [list] } as const satisfies RouteManifestGroup
  // `detail` is listed before `create` on purpose: the exact path must still win.
  const matches = createRouteMatches([group], [detail, create, orphan])

  it('resolves parameterized paths and attaches hidden pages to their parent group', () => {
    expect(findRouteMatch(matches, '/orders/42')).toEqual({ group, route: detail })
    expect(findRouteMatch(matches, '/orphan/1')).toEqual({ group: undefined, route: orphan })
  })

  it('prefers an exact path over a parameterized one', () => {
    expect(findRouteMatch(matches, '/orders/new')?.route).toBe(create)
  })

  it('does not match deeper or partial paths', () => {
    expect(findRouteMatch(matches, '/orders/42/edit')).toBeUndefined()
    expect(findRouteMatch(matches, '/order')).toBeUndefined()
  })
})

describe('route manifest permissions', () => {
  it('uses module permissions for the known menu and guard drift cases', () => {
    expect(getNavigationItem('/list/search-table')?.permission).toEqual({ all: ['list:read'] })
    expect(getRouteMatch('/list/search-table')?.route.permission).toEqual({ all: ['list:read'] })
    expect(getNavigationItem('/user/info')?.permission).toEqual({ all: ['user:read'] })
    expect(getRouteMatch('/user/info')?.route.permission).toEqual({ all: ['user:read'] })
  })

  it('requires both group and leaf permissions for protected routes', () => {
    const match = getRouteMatch('/roles')
    expect(match).toBeDefined()
    expect(canAccessRoute(user(['roles:read']), match!)).toBe(true)
    expect(canAccessRoute(user(['users:read']), match!)).toBe(false)
  })

  it('keeps menu visibility and direct access aligned for minimal users', () => {
    const listUser = user(['list:read'])
    const userInfoUser = user(['user:read'])
    const rolesUser = user(['users:read'])

    expect(getVisibleNavigationGroups(listUser).flatMap(group => group.children.map(item => item.key))).toContain('/list/search-table')
    expect(canAccessRoute(listUser, getRouteMatch('/list/search-table')!)).toBe(true)

    expect(getVisibleNavigationGroups(userInfoUser).flatMap(group => group.children.map(item => item.key))).toContain('/user/info')
    expect(canAccessRoute(userInfoUser, getRouteMatch('/user/info')!)).toBe(true)

    expect(getVisibleNavigationGroups(rolesUser).flatMap(group => group.children.map(item => item.key))).not.toContain('/roles')
    expect(canAccessRoute(rolesUser, getRouteMatch('/roles')!)).toBe(false)
  })

  it('hides groups with no visible children', () => {
    const groups = getVisibleNavigationGroups(user(['list:read']))
    expect(groups.map(group => group.key)).toEqual(['list'])
  })
})
