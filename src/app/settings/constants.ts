import type { AppSettings } from './types'

export const DEFAULT_SETTINGS: AppSettings = {
  colorWeak: false,
  footer: true,
  menu: true,
  menuWidth: 220,
  navbar: true,
  themeColor: '#165DFF',
}

export const THEME_COLORS = [
  '#165DFF',
  '#14C9C9',
  '#00B42A',
  '#FF7D00',
  '#F53F3F',
  '#722ED1',
] as const

export const APP_SETTINGS_STORAGE_KEY = 'arco-pro-settings'
export const APP_LOCALE_STORAGE_KEY = 'arco-pro-locale'
export const APP_THEME_STORAGE_KEY = 'arco-pro-theme'
