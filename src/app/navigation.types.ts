import type { ReactNode } from 'react'

import type { PermissionRequirement } from './permissions.types'
import type { MessageKey } from '@/app/i18n'

export interface NavigationItem {
  breadcrumb?: boolean
  key: string
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
