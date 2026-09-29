import { Button, Space, Typography } from '@arco-design/web-react'

export type RecoveryErrorKind = 'route' | 'chunk' | 'root'

interface RecoveryErrorStateProps {
  kind: RecoveryErrorKind
  diagnosticId?: string
  onRetry: () => void
  onBackToWorkplace: () => void
}

const copy: Record<RecoveryErrorKind, { title: string, description: string, retryLabel: string }> = {
  route: {
    title: '页面暂时无法显示',
    description: '页面遇到意外问题，请重试当前页面或返回工作台。',
    retryLabel: '重试当前页面',
  },
  chunk: {
    title: '页面资源加载失败',
    description: '页面资源暂时不可用，请重试或返回工作台。',
    retryLabel: '重试当前页面',
  },
  root: {
    title: '管理台暂时无法加载',
    description: '应用初始化遇到问题，请重新加载或返回工作台。',
    retryLabel: '重新加载应用',
  },
}

export function RecoveryErrorState({
  kind,
  diagnosticId,
  onRetry,
  onBackToWorkplace,
}: RecoveryErrorStateProps) {
  const text = copy[kind]
  return (
    <main
      className={`recovery-error-state recovery-error-state-${kind}`}
      role="alert"
      aria-live="assertive"
      aria-labelledby="recovery-error-title"
    >
      <Typography.Title id="recovery-error-title" heading={3}>{text.title}</Typography.Title>
      <Typography.Text>{text.description}</Typography.Text>
      {diagnosticId && (
        <Typography.Text type="secondary" data-testid="error-diagnostic-id">
          诊断编号：
          {diagnosticId}
        </Typography.Text>
      )}
      <Space wrap>
        <Button type="primary" onClick={onRetry}>{text.retryLabel}</Button>
        <Button onClick={onBackToWorkplace}>返回工作台</Button>
      </Space>
    </main>
  )
}
