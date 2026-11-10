import type { PaginationProps, TableProps } from '@arco-design/web-react'

import type { ColumnProps } from '@arco-design/web-react/es/Table'
import type { ChangeEvent, CSSProperties, Key, KeyboardEvent, ReactNode } from 'react'
import { Button, Pagination, Space, Table, Tooltip } from '@arco-design/web-react'
import { IconRefresh } from '@arco-design/web-react/icon'
import { useEffect, useId, useRef, useState } from 'react'
import { isCancelledError } from '@/api/errors'
import { useLocale } from '@/app/i18n'
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
  refreshLabel?: string
  onTableChange?: TableProps<T>['onChange']
  error?: unknown
  onRetry?: () => void
  emptyTitle?: ReactNode
  scrollHint?: ReactNode
  scroll?: TableProps<T>['scroll']
  /** 固定表格布局：列宽按 columns 分配，不随单元格内容撑开，适合含长文本的列。 */
  tableLayoutFixed?: boolean
  /** 树形数据（行带 children）的受控展开；不传时由 Arco 自行管理。 */
  expandedRowKeys?: TableProps<T>['expandedRowKeys']
  onExpandedRowsChange?: TableProps<T>['onExpandedRowsChange']
  className?: string
}

interface HorizontalScrollMetrics {
  scrollLeft: number
  clientWidth: number
  scrollWidth: number
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
  refreshLabel,
  onTableChange,
  error,
  onRetry,
  emptyTitle,
  scrollHint,
  scroll = { x: true },
  tableLayoutFixed = false,
  expandedRowKeys,
  onExpandedRowsChange,
  className,
}: DataTableProps<T>) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const tableScrollRef = useRef<HTMLElement | null>(null)
  const scrollAreaId = useId()
  const [scrollMetrics, setScrollMetrics] = useState<HorizontalScrollMetrics>({ scrollLeft: 0, clientWidth: 0, scrollWidth: 0 })
  const hasData = data.length > 0
  const t = useLocale()
  const visibleScrollHint = scrollHint ?? t('table.scrollHint')
  const visibleRefreshLabel = refreshLabel ?? t('table.refreshList')
  const hasVisibleError = Boolean(error) && !isCancelledError(error)
  const showInitialLoading = Boolean(loading) && !hasData && !hasVisibleError
  const maxScroll = Math.max(0, scrollMetrics.scrollWidth - scrollMetrics.clientWidth)
  const hasHorizontalOverflow = maxScroll > 1
  const scrollbarThumbWidth = scrollMetrics.scrollWidth > 0
    ? Math.min(scrollMetrics.clientWidth, Math.max(40, scrollMetrics.clientWidth ** 2 / scrollMetrics.scrollWidth))
    : 40

  useEffect(() => {
    const scrollArea = scrollAreaRef.current
    if (!scrollArea) {
      return
    }
    const tableScroll = scrollArea.querySelector<HTMLElement>('.arco-table-content-inner')
    if (!tableScroll)
      return
    tableScrollRef.current = tableScroll

    const updateMetrics = () => {
      const next = {
        scrollLeft: tableScroll.scrollLeft,
        clientWidth: tableScroll.clientWidth,
        scrollWidth: tableScroll.scrollWidth,
      }
      setScrollMetrics(previous => (
        previous.scrollLeft === next.scrollLeft
        && previous.clientWidth === next.clientWidth
        && previous.scrollWidth === next.scrollWidth
          ? previous
          : next
      ))
    }

    tableScroll.addEventListener('scroll', updateMetrics, { passive: true })
    const resizeObserver = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(updateMetrics)
    if (resizeObserver) {
      const resizeTargets = [scrollArea, tableScroll]
      resizeTargets.forEach(target => target && resizeObserver.observe(target))
    }
    const mutationObserver = typeof MutationObserver === 'undefined'
      ? undefined
      : new MutationObserver(updateMetrics)
    mutationObserver?.observe(scrollArea, { attributes: true, childList: true, characterData: true, subtree: true })
    const initialMeasure = window.requestAnimationFrame(updateMetrics)

    return () => {
      window.cancelAnimationFrame(initialMeasure)
      tableScroll.removeEventListener('scroll', updateMetrics)
      resizeObserver?.disconnect()
      mutationObserver?.disconnect()
      if (tableScrollRef.current === tableScroll)
        tableScrollRef.current = null
    }
  }, [hasVisibleError, showInitialLoading])

  const handleScrollbarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextScrollLeft = Number(event.target.value)
    if (tableScrollRef.current)
      tableScrollRef.current.scrollLeft = nextScrollLeft
  }

  const handleScrollAreaKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const tableScroll = tableScrollRef.current
    if (event.target !== event.currentTarget || !tableScroll)
      return

    const pageSize = tableScroll.clientWidth
    const movement = 40
    let nextScrollLeft: number | undefined
    switch (event.key) {
      case 'ArrowLeft':
        nextScrollLeft = tableScroll.scrollLeft - movement
        break
      case 'ArrowRight':
        nextScrollLeft = tableScroll.scrollLeft + movement
        break
      case 'PageUp':
        nextScrollLeft = tableScroll.scrollLeft - pageSize
        break
      case 'PageDown':
        nextScrollLeft = tableScroll.scrollLeft + pageSize
        break
      case 'Home':
        nextScrollLeft = 0
        break
      case 'End':
        nextScrollLeft = tableScroll.scrollWidth - pageSize
        break
      default:
        return
    }
    event.preventDefault()
    tableScroll.scrollLeft = Math.max(0, nextScrollLeft)
  }

  return (
    <div className={['data-table', className].filter(Boolean).join(' ')}>
      {(toolbar || batchActions || onRefresh) && (
        <div className="data-table-toolbar">
          <div>{toolbar}</div>
          <Space>
            {batchActions}
            {onRefresh && (
              <Tooltip content={t('table.refresh')}>
                <Button type="text" icon={<IconRefresh />} aria-label={visibleRefreshLabel} onClick={onRefresh} />
              </Tooltip>
            )}
          </Space>
        </div>
      )}
      {showInitialLoading
        ? <PageLoadingState label={t('table.loading')} />
        : hasVisibleError && !hasData
          ? <PageErrorState error={error} onRetry={onRetry} title={t('table.loadFailed')} />
          : (
              <>
                {hasVisibleError && <PageErrorState error={error} onRetry={onRetry} compact />}
                <div
                  className="data-table-scroll"
                  ref={scrollAreaRef}
                  id={scrollAreaId}
                  tabIndex={0}
                  role="region"
                  aria-label={typeof visibleScrollHint === 'string' ? visibleScrollHint : t('table.scrollHint')}
                  onKeyDown={handleScrollAreaKeyDown}
                >
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
                    tableLayoutFixed={tableLayoutFixed}
                    expandedRowKeys={expandedRowKeys}
                    onExpandedRowsChange={onExpandedRowsChange}
                    noDataElement={<PageEmptyState title={emptyTitle} compact />}
                  />
                </div>
                {hasHorizontalOverflow && (
                  <input
                    type="range"
                    className="data-table-scrollbar"
                    aria-label={typeof visibleScrollHint === 'string' ? visibleScrollHint : t('table.scrollHint')}
                    aria-controls={scrollAreaId}
                    aria-valuetext={`${Math.round((scrollMetrics.scrollLeft / maxScroll) * 100)}%`}
                    min={0}
                    max={maxScroll}
                    value={Math.min(maxScroll, Math.max(0, scrollMetrics.scrollLeft))}
                    style={{ '--data-table-scrollbar-thumb-width': `${scrollbarThumbWidth}px` } as CSSProperties}
                    onChange={handleScrollbarChange}
                  />
                )}
                <div className="data-table-scroll-hint" aria-hidden="true">{visibleScrollHint}</div>
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
