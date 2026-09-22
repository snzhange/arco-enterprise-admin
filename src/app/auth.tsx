import type { ReactNode } from 'react'
import type { CurrentUser } from '@/api/generated/models'

import { createContext, useContext } from 'react'

const AuthContext = createContext<CurrentUser | null>(null)

export function AuthProvider({ user, children }: { user: CurrentUser, children: ReactNode }) {
  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>
}

export function useAuth(): CurrentUser {
  const user = useContext(AuthContext)
  if (!user) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return user
}
