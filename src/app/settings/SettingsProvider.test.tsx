import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  APP_LOCALE_STORAGE_KEY,
  APP_SETTINGS_STORAGE_KEY,
  APP_THEME_STORAGE_KEY,
  DEFAULT_SETTINGS,
} from './constants'
import { useAppSettings } from './index'
import { AppSettingsProvider } from './SettingsProvider'

function SettingsProbe() {
  const { locale, resetSettings, setLocale, setTheme, settings, theme, updateSettings } = useAppSettings()
  return (
    <div>
      <output data-testid="settings">{JSON.stringify(settings)}</output>
      <output data-testid="locale">{locale}</output>
      <output data-testid="theme">{theme}</output>
      <button type="button" onClick={() => updateSettings({ colorWeak: true, menuWidth: 300 })}>更新设置</button>
      <button type="button" onClick={() => setLocale('en-US')}>切换语言</button>
      <button type="button" onClick={() => setTheme('dark')}>切换主题</button>
      <button type="button" onClick={resetSettings}>恢复默认</button>
    </div>
  )
}

function renderProvider() {
  return render(
    <AppSettingsProvider>
      <SettingsProbe />
    </AppSettingsProvider>,
  )
}

describe('app settings provider', () => {
  beforeEach(() => {
    localStorage.clear()
    document.body.removeAttribute('arco-theme')
    document.body.style.filter = ''
    document.documentElement.style.removeProperty('--app-theme-color')
  })

  it('falls back to defaults for invalid JSON and unsupported setting values', () => {
    localStorage.setItem(APP_SETTINGS_STORAGE_KEY, '{broken')
    localStorage.setItem(APP_LOCALE_STORAGE_KEY, 'fr-FR')
    localStorage.setItem(APP_THEME_STORAGE_KEY, 'solarized')
    const { unmount } = renderProvider()

    expect(screen.getByTestId('settings')).toHaveTextContent(JSON.stringify(DEFAULT_SETTINGS))
    expect(screen.getByTestId('locale')).toHaveTextContent('zh-CN')
    expect(screen.getByTestId('theme')).toHaveTextContent('light')
    unmount()

    localStorage.setItem(APP_SETTINGS_STORAGE_KEY, JSON.stringify({
      ...DEFAULT_SETTINGS,
      themeColor: '#invalid',
      menuWidth: 1000,
      colorWeak: 'yes',
    }))
    renderProvider()
    expect(screen.getByTestId('settings')).toHaveTextContent(JSON.stringify(DEFAULT_SETTINGS))
  })

  it('persists settings, locale, theme, applies theme side effects, and resets settings', async () => {
    const user = userEvent.setup()
    renderProvider()

    await user.click(screen.getByRole('button', { name: '更新设置' }))
    expect(JSON.parse(localStorage.getItem(APP_SETTINGS_STORAGE_KEY) ?? '{}')).toMatchObject({ colorWeak: true, menuWidth: 300 })
    expect(document.body.style.filter).toBe('invert(80%)')

    await user.click(screen.getByRole('button', { name: '切换语言' }))
    await user.click(screen.getByRole('button', { name: '切换主题' }))
    expect(localStorage.getItem(APP_LOCALE_STORAGE_KEY)).toBe('en-US')
    expect(localStorage.getItem(APP_THEME_STORAGE_KEY)).toBe('dark')
    expect(document.body).toHaveAttribute('arco-theme', 'dark')
    expect(document.documentElement.style.getPropertyValue('--app-theme-color')).toBe(DEFAULT_SETTINGS.themeColor)
    expect(document.body.style.getPropertyValue('--arcoblue-6')).not.toBe('')

    await user.click(screen.getByRole('button', { name: '恢复默认' }))
    expect(screen.getByTestId('settings')).toHaveTextContent(JSON.stringify(DEFAULT_SETTINGS))
    expect(JSON.parse(localStorage.getItem(APP_SETTINGS_STORAGE_KEY) ?? '{}')).toEqual(DEFAULT_SETTINGS)
  })
})
