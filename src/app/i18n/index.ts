import type { MessageKey } from './messages'

import { useCallback, useContext } from 'react'

import { AppSettingsContext } from '@/app/settings/SettingsProvider'

import { enUSMessages, zhCNMessages } from './messages'

export type { MessageKey } from './messages'

/** Falls back to zh-CN outside AppSettingsProvider so shared components render in isolation (e.g. unit tests). */
export function useLocale() {
  const locale = useContext(AppSettingsContext)?.locale ?? 'zh-CN'

  return useCallback((key: MessageKey): string => (
    locale === 'zh-CN' ? zhCNMessages[key] : enUSMessages[key]
  ), [locale])
}
