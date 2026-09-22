import type { ApiError } from '@/api/errors'

import { Button, Typography } from '@arco-design/web-react'
import { getErrorMessage, getTraceMessage } from '@/api/errors'

const { Text, Title } = Typography

export function SessionErrorState({ error, onRetry }: { error: ApiError, onRetry: () => void }) {
  const traceMessage = getTraceMessage(error)
  return (
    <main className="session-error-state" role="alert">
      <Title heading={3}>管理台暂时无法加载</Title>
      <Text>{getErrorMessage(error)}</Text>
      {traceMessage && <Text type="secondary">{traceMessage}</Text>}
      <Button type="primary" onClick={onRetry}>重试</Button>
    </main>
  )
}
