import { Button, Result } from '@arco-design/web-react'

import { Link } from 'react-router-dom'
import { useLocale } from '@/app/i18n'

export function NotFoundPage() {
  const t = useLocale()
  return (
    <main className="standalone-page">
      <Result
        status="404"
        title={t('notFound.title')}
        subTitle={t('notFound.description')}
        extra={<Link to="/dashboard"><Button type="primary">{t('notFound.back')}</Button></Link>}
      />
    </main>
  )
}
