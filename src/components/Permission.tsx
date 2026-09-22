import type { ReactNode } from 'react'
import type { PermissionRequirement } from '@/app/permissions'

import { useAuth } from '@/app/auth'
import { canAccess } from '@/app/permissions'

interface PermissionProps extends PermissionRequirement {
  children: ReactNode
  fallback?: ReactNode
}

export function Permission({ all, any, children, fallback = null }: PermissionProps) {
  const user = useAuth()
  return canAccess(user, { all, any }) ? children : fallback
}
