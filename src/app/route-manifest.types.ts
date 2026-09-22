import type { ComponentType, LazyExoticComponent, ReactNode } from 'react'

import type { PermissionRequirement } from './permissions.types'
import type { MessageKey } from '@/app/i18n'

export type RoutePath = `/${string}`

export type RouteComponent = ComponentType | LazyExoticComponent<ComponentType>

export interface RouteManifestPage {
  breadcrumb?: boolean
  component: RouteComponent
  kind: 'page'
  menu?: boolean
  messageKey?: MessageKey
  path: RoutePath
  permission?: PermissionRequirement
}

export interface RouteManifestGroup {
  children: readonly RouteManifestPage[]
  icon: ReactNode
  key: string
  kind: 'group'
  messageKey: MessageKey
  permission?: PermissionRequirement
}

export interface RouteManifestPublicPage {
  component: RouteComponent
  kind: 'public'
  path: RoutePath
}

export interface RouteManifestRedirect {
  kind: 'redirect'
  path: RoutePath
  to: RoutePath
}

export interface RouteMatch {
  group?: RouteManifestGroup
  route: RouteManifestPage
}

export interface NavigationItem {
  breadcrumb?: boolean
  key: RoutePath
  messageKey: MessageKey
  permission?: PermissionRequirement
}

export interface NavigationGroup {
  children: NavigationItem[]
  icon: ReactNode
  key: string
  messageKey: MessageKey
  permission?: PermissionRequirement
}

export type { PermissionRequirement }
