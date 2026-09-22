// @env browser

import type { PropsWithChildren } from 'react'
import type { AppLocale, AppSettings, AppSettingsContextValue, AppTheme } from './types'

import { createContext, useEffect, useMemo, useState } from 'react'

import {
  APP_LOCALE_STORAGE_KEY,
  APP_SETTINGS_STORAGE_KEY,
  APP_THEME_STORAGE_KEY,
  DEFAULT_SETTINGS,
} from './constants'
import { applyTheme } from './theme'

export const AppSettingsContext = createContext<AppSettingsContextValue | undefined>(undefined)

function readSettings(): AppSettings {
  try {
    const value = localStorage.getItem(APP_SETTINGS_STORAGE_KEY)
    return value ? { ...DEFAULT_SETTINGS, ...JSON.parse(value) as Partial<AppSettings> } : DEFAULT_SETTINGS
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
