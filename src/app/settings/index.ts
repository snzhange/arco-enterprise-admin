import { useContext } from 'react'

import { AppSettingsContext } from './SettingsProvider'

export { AppSettingsProvider } from './SettingsProvider'
export type { AppLocale, AppSettings, AppTheme } from './types'

export function useAppSettings() {
  const value = useContext(AppSettingsContext)
  if (!value)
    throw new Error('useAppSettings must be used within AppSettingsProvider')
  return value
}
