import type { ReactNode } from 'react'

import { Descriptions } from '@arco-design/web-react'
import { PageEmptyState, PageErrorState, PageLoadingState } from '@/components/page/PageState'

export interface DetailDescriptor {
  key: string
  label: ReactNode
  value: ReactNode
  span?: number
}

export interface DetailPanelProps {
  items?: DetailDescriptor[]
  loading?: boolean
  error?: unknown
  emptyTitle?: ReactNode
}

export function DetailPanel({ items = [], loading = false, error, emptyTitle = '暂无详情' }: DetailPanelProps) {
  if (loading)
    return <PageLoadingState label="正在加载详情..." />
  if (error)
    return <PageErrorState error={error} title="详情加载失败" />
  if (items.length === 0)
    return <PageEmptyState title={emptyTitle} compact />

  return (
    <Descriptions
      className="detail-panel"
      data={items.map(item => ({
        key: item.key,
        label: item.label,
        value: item.value,
        span: item.span,
      }))}
      column={{ xs: 1, md: 2 }}
      border
      tableLayout="fixed"
    />
  )
}
