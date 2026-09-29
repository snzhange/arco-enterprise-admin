// @env browser

import type { PropsWithChildren } from 'react'
import type { AppLocale, AppSettings, AppSettingsContextValue, AppTheme } from './types'

import { createContext, useEffect, useMemo, useState } from 'react'

import {
  APP_LOCALE_STORAGE_KEY,
  APP_SETTINGS_STORAGE_KEY,
  APP_THEME_STORAGE_KEY,
  DEFAULT_SETTINGS,
  THEME_COLORS,
} from './constants'
import { applyTheme } from './theme'

export const AppSettingsContext = createContext<AppSettingsContextValue | undefined>(undefined)

function readSettings(): AppSettings {
  try {
    const value = localStorage.getItem(APP_SETTINGS_STORAGE_KEY)
    if (!value)
      return DEFAULT_SETTINGS

    const parsed = JSON.parse(value) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
      return DEFAULT_SETTINGS

    const stored = parsed as Partial<Record<keyof AppSettings, unknown>>
    return {
      colorWeak: typeof stored.colorWeak === 'boolean' ? stored.colorWeak : DEFAULT_SETTINGS.colorWeak,
      footer: typeof stored.footer === 'boolean' ? stored.footer : DEFAULT_SETTINGS.footer,
      menu: typeof stored.menu === 'boolean' ? stored.menu : DEFAULT_SETTINGS.menu,
      menuWidth: typeof stored.menuWidth === 'number'
        && Number.isFinite(stored.menuWidth)
        && stored.menuWidth >= 180
        && stored.menuWidth <= 320
        ? stored.menuWidth
        : DEFAULT_SETTINGS.menuWidth,
      navbar: typeof stored.navbar === 'boolean' ? stored.navbar : DEFAULT_SETTINGS.navbar,
      themeColor: typeof stored.themeColor === 'string' && THEME_COLORS.includes(stored.themeColor as typeof THEME_COLORS[number])
        ? stored.themeColor
        : DEFAULT_SETTINGS.themeColor,
    }
  }
  catch {
    return DEFAULT_SETTINGS
  }
}

function readLocale(): AppLocale {
  return localStorage.getItem(APP_LOCALE_STORAGE_KEY) === 'en-US' ? 'en-US' : 'zh-CN'
}

function readTheme(): AppTheme {
  return localStorage.getItem(APP_THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light'
}

export function AppSettingsProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState<AppSettings>(readSettings)
  const [locale, setLocale] = useState<AppLocale>(readLocale)
  const [theme, setTheme] = useState<AppTheme>(readTheme)

  useEffect(() => {
    localStorage.setItem(APP_SETTINGS_STORAGE_KEY, JSON.stringify(settings))
    applyTheme(theme, settings.themeColor, settings.colorWeak)
  }, [settings, theme])

  useEffect(() => {
    localStorage.setItem(APP_LOCALE_STORAGE_KEY, locale)
  }, [locale])

  useEffect(() => {
    localStorage.setItem(APP_THEME_STORAGE_KEY, theme)
  }, [theme])

  const value = useMemo<AppSettingsContextValue>(() => ({
    locale,
    resetSettings: () => setSettings(DEFAULT_SETTINGS),
    setLocale,
    setTheme,
    settings,
    theme,
    updateSettings: nextSettings => setSettings(current => ({ ...current, ...nextSettings })),
  }), [locale, settings, theme])

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>
}
