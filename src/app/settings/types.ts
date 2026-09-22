export type AppLocale = 'en-US' | 'zh-CN'

export type AppTheme = 'dark' | 'light'

export interface AppSettings {
  colorWeak: boolean
  footer: boolean
  menu: boolean
  menuWidth: number
  navbar: boolean
  themeColor: string
}

export interface AppSettingsContextValue {
  locale: AppLocale
  resetSettings: () => void
  setLocale: (locale: AppLocale) => void
  setTheme: (theme: AppTheme) => void
  settings: AppSettings
  theme: AppTheme
  updateSettings: (settings: Partial<AppSettings>) => void
}
