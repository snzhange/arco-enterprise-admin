// @env browser

import type { ReactElement, ReactNode } from 'react'

import {
  Alert,
  Button,
  Divider,
  Drawer,
  InputNumber,
  Message,
  Switch,
  Tooltip,
  Typography,
} from '@arco-design/web-react'
import { IconRefresh, IconSettings } from '@arco-design/web-react/icon'
import { useState } from 'react'

import { copyText } from '@/app/clipboard'
import { useLocale } from '@/app/i18n'
import { useAppSettings } from '@/app/settings'
import { THEME_COLORS } from '@/app/settings/constants'

interface SettingsDrawerProps {
  trigger?: ReactElement
}

export function SettingsDrawer({ trigger }: SettingsDrawerProps) {
  const t = useLocale()
  const { resetSettings, settings, updateSettings } = useAppSettings()
  const [visible, setVisible] = useState(false)

  const copySettings = async (): Promise<void> => {
    await copyText(JSON.stringify(settings, null, 2))
    Message.success(t('settings.copy.success'))
  }

  const defaultTrigger = (
    <Tooltip content={t('settings.title')}>
      <Button
        shape="circle"
        type="secondary"
        className="navbar-icon-button"
        aria-label={t('settings.title')}
        icon={<IconSettings />}
      />
    </Tooltip>
  )

  return (
    <>
      <span className="settings-trigger" onClick={() => setVisible(true)}>
        {trigger ?? defaultTrigger}
      </span>
      <Drawer
        width={320}
        title={(
          <span className="settings-drawer-title">
            <IconSettings />
            {t('settings.title')}
          </span>
        )}
        visible={visible}
        okText={t('settings.copy')}
        cancelText={t('settings.close')}
        onOk={() => void copySettings()}
        onCancel={() => setVisible(false)}
      >
        <SettingsSection title={t('settings.themeColor')}>
          <div className="theme-color-picker" role="radiogroup" aria-label={t('settings.themeColor')}>
            {THEME_COLORS.map(color => (
              <Tooltip content={color} key={color}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={settings.themeColor.toLowerCase() === color.toLowerCase()}
                  aria-label={color}
                  className="theme-color-swatch"
                  style={{ backgroundColor: color }}
                  onClick={() => updateSettings({ themeColor: color })}
                />
              </Tooltip>
            ))}
          </div>
          <Typography.Paragraph type="secondary" className="settings-hint">{t('settings.themeColor.hint')}</Typography.Paragraph>
        </SettingsSection>

        <SettingsSection title={t('settings.content')}>
          <SettingRow label={t('settings.navbar')}><Switch size="small" checked={settings.navbar} onChange={navbar => updateSettings({ navbar })} /></SettingRow>
          <SettingRow label={t('settings.menu')}><Switch size="small" checked={settings.menu} onChange={menu => updateSettings({ menu })} /></SettingRow>
          <SettingRow label={t('settings.footer')}><Switch size="small" checked={settings.footer} onChange={footer => updateSettings({ footer })} /></SettingRow>
          <SettingRow label={t('settings.menuWidth')}>
            <InputNumber
              min={180}
              max={320}
              step={10}
              size="small"
              value={settings.menuWidth}
              style={{ width: 86 }}
              onChange={menuWidth => updateSettings({ menuWidth: Number(menuWidth) })}
            />
          </SettingRow>
        </SettingsSection>

        <SettingsSection title={t('settings.other')}>
          <SettingRow label={t('settings.colorWeak')}><Switch size="small" checked={settings.colorWeak} onChange={colorWeak => updateSettings({ colorWeak })} /></SettingRow>
        </SettingsSection>

        <Alert content={t('settings.alert')} />
        <Button className="settings-reset-button" type="text" icon={<IconRefresh />} onClick={resetSettings}>{t('settings.reset')}</Button>
      </Drawer>
    </>
  )
}

function SettingsSection({ children, title }: { children: ReactNode, title: string }) {
  return (
    <section className="settings-section">
      <Typography.Title heading={5}>{title}</Typography.Title>
      {children}
      <Divider />
    </section>
  )
}

function SettingRow({ children, label }: { children: ReactNode, label: string }) {
  return (
    <div className="settings-row">
      <span>{label}</span>
      {children}
    </div>
  )
}
