import type { MessageKey } from './messages'

import { useCallback } from 'react'

import { useAppSettings } from '@/app/settings'

import { enUSMessages, zhCNMessages } from './messages'

export type { MessageKey } from './messages'

export function useLocale() {
  const { locale } = useAppSettings()

  return useCallback((key: MessageKey): string => (
    locale === 'zh-CN' ? zhCNMessages[key] : enUSMessages[key]
  ), [locale])
}
