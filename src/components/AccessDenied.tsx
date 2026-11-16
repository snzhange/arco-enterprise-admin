import { Button, Result } from '@arco-design/web-react'
import { useNavigate } from 'react-router-dom'
import { useLocale } from '@/app/i18n'

export function AccessDenied() {
  const navigate = useNavigate()
  const t = useLocale()
  return (
    <div className="access-denied-page">
      <Result
        status="403"
        subTitle={t('accessDenied.description')}
        extra={<Button type="primary" onClick={() => navigate('/dashboard/workplace')}>{t('accessDenied.back')}</Button>}
      />
    </div>
  )
}
