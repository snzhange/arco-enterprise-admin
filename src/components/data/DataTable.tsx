import type { PaginationProps, TableProps } from '@arco-design/web-react'

import type { ColumnProps } from '@arco-design/web-react/es/Table'
import type { Key, ReactNode } from 'react'
import { Button, Pagination, Space, Table, Tooltip } from '@arco-design/web-react'
import { IconRefresh } from '@arco-design/web-react/icon'
import { isCancelledError } from '@/api/errors'
import { PageEmptyState, PageErrorState, PageLoadingState } from '@/components/page/PageState'

export interface DataTablePagination extends Omit<PaginationProps, 'current' | 'pageSize' | 'total' | 'onChange'> {
  current: number
  pageSize: number
  total: number
  onChange: (page: number, pageSize: number) => void
}

export interface DataTableProps<T> {
  rowKey: NonNullable<TableProps<T>['rowKey']>
  columns: ColumnProps<T>[]
  data: T[]
  loading?: TableProps<T>['loading']
  pagination?: DataTablePagination
  rowSelection?: TableProps<T>['rowSelection']
  toolbar?: ReactNode
  batchActions?: ReactNode
  onRefresh?: () => void
  onTableChange?: TableProps<T>['onChange']
  error?: unknown
  onRetry?: () => void
  emptyTitle?: ReactNode
  scroll?: TableProps<T>['scroll']
  className?: string
}

export function DataTable<T>({
  rowKey,
  columns,
  data,
  loading = false,
  pagination,
  rowSelection,
  toolbar,
  batchActions,
  onRefresh,
  onTableChange,
  error,
  onRetry,
  emptyTitle,
  scroll = { x: true },
  className,
}: DataTableProps<T>) {
  const hasData = data.length > 0
  const hasVisibleError = Boolean(error) && !isCancelledError(error)
  const showInitialLoading = Boolean(loading) && !hasData && !hasVisibleError

  return (
    <div className={['data-table', className].filter(Boolean).join(' ')}>
      {(toolbar || batchActions || onRefresh) && (
        <div className="data-table-toolbar">
          <div>{toolbar}</div>
          <Space>
            {batchActions}
            {onRefresh && (
              <Tooltip content="刷新">
                <Button type="text" icon={<IconRefresh />} aria-label="刷新列表" onClick={onRefresh} />
              </Tooltip>
            )}
          </Space>
        </div>
      )}
      {showInitialLoading
        ? <PageLoadingState label="正在加载列表..." />
        : hasVisibleError && !hasData
          ? <PageErrorState error={error} onRetry={onRetry} title="列表加载失败" />
          : (
              <>
                {hasVisibleError && <PageErrorState error={error} onRetry={onRetry} compact />}
                <Table<T>
                  rowKey={rowKey}
                  columns={columns}
                  data={data}
                  loading={loading}
                  rowSelection={rowSelection}
                  onChange={onTableChange}
                  pagination={false}
                  border={false}
                  stripe
                  scroll={scroll}
                  noDataElement={<PageEmptyState title={emptyTitle} compact />}
                />
                {pagination && (
                  <div className="table-pagination">
                    <Pagination
                      {...pagination}
                      current={pagination.current}
                      pageSize={pagination.pageSize}
                      total={pagination.total}
                      onChange={pagination.onChange}
                    />
                  </div>
                )}
              </>
            )}
    </div>
  )
}

export type DataTableRowKey = Key
