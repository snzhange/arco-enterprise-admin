import {
  Alert,
  Button,
  Card,
  Link,
  Message,
  Tag,
  Typography,
} from '@arco-design/web-react'
import { IconCopy, IconDoubleRight } from '@arco-design/web-react/icon'

import { useAuth } from '@/app/auth'
import { copyText } from '@/app/clipboard'
import { useLocale } from '@/app/i18n'

export function WelcomePage() {
  const user = useAuth()
  const t = useLocale()
  const command = 'pnpm add @arco-design/web-react'

  const copyCommand = async (): Promise<void> => {
    await copyText(command)
    Message.success(t('welcome.copy.success'))
  }

  return (
    <div className="welcome-page">
      <section className="welcome-header">
        <Typography.Title heading={5}>{t('welcome.title')}</Typography.Title>
        <Typography.Text type="secondary">
          {user.displayName}
          {' · '}
          {user.email}
        </Typography.Text>
      </section>
      <Alert type="success" content={t('welcome.invite')} />
      <Card className="pro-card welcome-card" title={t('welcome.usage')}>
        <Typography.Title heading={6}>
          1.
          {t('welcome.step.pickup')}
        </Typography.Title>
        <Typography.Paragraph>
          <Tag>@arco-design/pro-pages-workplace</Tag>
        </Typography.Paragraph>
        <Typography.Title heading={6}>
          2.
          {t('welcome.step.install')}
        </Typography.Title>
        <Typography.Paragraph className="welcome-code">
          <code>{command}</code>
          <Button type="text" icon={<IconCopy />} aria-label={t('welcome.copy')} onClick={() => void copyCommand()} />
        </Typography.Paragraph>
        <Typography.Title heading={6}>
          3.
          {t('welcome.step.result')}
        </Typography.Title>
      </Card>
      <Card className="pro-card welcome-card">
        <Typography.Text>{t('welcome.material')}</Typography.Text>
        <p>
          <Link href="https://arco.design/material?category=arco-design-pro" target="_blank">
            {t('welcome.material.pro')}
            {' '}
            <IconDoubleRight />
          </Link>
        </p>
        <p>
          <Link href="https://arco.design/material" target="_blank">
            {t('welcome.material.all')}
            {' '}
            <IconDoubleRight />
          </Link>
        </p>
      </Card>
    </div>
  )
}
