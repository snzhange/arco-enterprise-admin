import { Button, Result } from '@arco-design/web-react'

import { useAuth } from '@/app/auth'
import { useLocale } from '@/app/i18n'

/** Shown instead of the 403 page when the signed-in user holds no permission at all. */
export function AccountPending() {
  const user = useAuth()
  const t = useLocale()
  return (
    <div className="access-denied-page">
      <Result
        status="403"
        title={t('accountPending.title')}
        subTitle={t('accountPending.description')}
        extra={user.contactUrl
          ? (
              <Button type="primary" href={user.contactUrl} target="_blank" anchorProps={{ rel: 'noopener noreferrer' }}>
                {t('accountPending.contact')}
              </Button>
            )
          : null}
      />
    </div>
  )
}
