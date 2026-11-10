import type { ReactNode } from 'react'

import { Button, Empty, Spin, Typography } from '@arco-design/web-react'
import { getErrorMessage, getTraceMessage, isCancelledError, toApiError } from '@/api/errors'
import { useLocale } from '@/app/i18n'

const { Text, Title } = Typography

interface PageStateFrameProps {
  className: string
  children: ReactNode
  compact?: boolean
}

function PageStateFrame({ className, children, compact = false }: PageStateFrameProps) {
  return <div className={['page-state', className, compact && 'page-state-compact'].filter(Boolean).join(' ')}>{children}</div>
}

export function PageLoadingState({ label }: { label?: ReactNode }) {
  const t = useLocale()
  return (
    <PageStateFrame className="page-state-loading">
      <Spin />
      <Text type="secondary" aria-live="polite">{label ?? t('pageState.loading')}</Text>
    </PageStateFrame>
  )
}

export function PageEmptyState({
  title,
  description,
  action,
  compact,
}: {
  title?: ReactNode
  description?: ReactNode
  action?: ReactNode
  compact?: boolean
}) {
  const t = useLocale()
  return (
    <PageStateFrame className="page-state-empty" compact={compact}>
      <Empty description={title ?? t('pageState.empty')} />
      {description && <Text type="secondary">{description}</Text>}
      {action}
    </PageStateFrame>
  )
}

export function PageErrorState({
  error,
  onRetry,
  compact,
  title,
}: {
  error: unknown
  onRetry?: () => void
  compact?: boolean
  title?: ReactNode
}) {
  const t = useLocale()
  if (isCancelledError(error))
    return null

  const apiError = toApiError(error)
  const message = getErrorMessage(apiError)
  const traceMessage = getTraceMessage(apiError)

  return (
    <PageStateFrame className="page-state-error" compact={compact}>
      {title && <Title heading={compact ? 6 : 4}>{title}</Title>}
      <Text role="alert">{message}</Text>
      {traceMessage && <Text type="secondary">{traceMessage}</Text>}
      {onRetry && <Button type="primary" onClick={onRetry}>{t('pageState.retry')}</Button>}
    </PageStateFrame>
  )
}

export function PageForbiddenState({
  title,
  description,
  action,
}: {
  title?: ReactNode
  description?: ReactNode
  action?: ReactNode
}) {
  const t = useLocale()
  return (
    <PageStateFrame className="page-state-forbidden">
      <Title heading={4}>{title ?? t('pageState.forbidden.title')}</Title>
      <Text type="secondary" role="alert">{description ?? t('pageState.forbidden.description')}</Text>
      {action}
    </PageStateFrame>
  )
}
