import type { MessageKey } from '@/app/i18n'

import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useLocale } from '@/app/i18n'
import { getNavigationItem } from '@/app/route-manifest'

/** "页面名 - 品牌名"；未登记的路径（重定向中、404）只显示品牌名。 */
export function getDocumentTitle(pathname: string, t: (key: MessageKey) => string): string {
  const pageKey = pathname === '/login' ? 'login.form.login' : getNavigationItem(pathname)?.messageKey
  const brand = t('brand.name')
  return pageKey ? `${t(pageKey)} - ${brand}` : brand
}

/** 按当前路由和界面语言同步浏览器标签页标题。 */
export function useDocumentTitle() {
  const { pathname } = useLocation()
  const t = useLocale()

  useEffect(() => {
    document.title = getDocumentTitle(pathname, t)
  }, [pathname, t])
}
