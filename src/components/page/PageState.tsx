import type { ReactNode } from 'react'

import { Button, Empty, Spin, Typography } from '@arco-design/web-react'
import { getErrorMessage, getTraceMessage, isCancelledError, toApiError } from '@/api/errors'

const { Text, Title } = Typography

interface PageStateFrameProps {
  className: string
  children: ReactNode
  compact?: boolean
}

function PageStateFrame({ className, children, compact = false }: PageStateFrameProps) {
  return <div className={['page-state', className, compact && 'page-state-compact'].filter(Boolean).join(' ')}>{children}</div>
}

export function PageLoadingState({ label = '正在加载...' }: { label?: ReactNode }) {
  return (
    <PageStateFrame className="page-state-loading">
      <Spin />
      <Text type="secondary" aria-live="polite">{label}</Text>
    </PageStateFrame>
  )
}

export function PageEmptyState({
  title = '暂无数据',
  description,
  action,
  compact,
}: {
  title?: ReactNode
  description?: ReactNode
  action?: ReactNode
  compact?: boolean
}) {
  return (
    <PageStateFrame className="page-state-empty" compact={compact}>
      <Empty description={title} />
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
      {onRetry && <Button type="primary" onClick={onRetry}>重试</Button>}
    </PageStateFrame>
  )
}

export function PageForbiddenState({
  title = '无权访问',
  description = '请联系管理员申请所需权限。',
  action,
}: {
  title?: ReactNode
  description?: ReactNode
  action?: ReactNode
}) {
  return (
    <PageStateFrame className="page-state-forbidden">
      <Title heading={4}>{title}</Title>
      <Text type="secondary" role="alert">{description}</Text>
      {action}
    </PageStateFrame>
  )
}
