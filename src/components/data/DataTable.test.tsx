import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DataTable } from './DataTable'

interface Row { id: string, name: string }

const columns = [{ title: '姓名', dataIndex: 'name' }]

describe('dataTable', () => {
  it('renders controlled rows and pagination without owning data requests', () => {
    const onChange = vi.fn()
    const onRefresh = vi.fn()
    const { container } = render(
      <DataTable<Row>
        rowKey="id"
        columns={columns}
        data={[{ id: '1', name: 'Ada' }]}
        toolbar={<span>共 1 条</span>}
        onRefresh={onRefresh}
        onTableChange={onChange}
        pagination={{ current: 1, pageSize: 10, total: 20, onChange: vi.fn() }}
      />,
    )

    expect(screen.getByText('Ada')).toBeVisible()
    expect(screen.getByText('共 1 条')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: '刷新列表' }))
    expect(onRefresh).toHaveBeenCalledOnce()
    expect(container.querySelector('.arco-pagination')).toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('shows initial failure with retry and treats cancellation as silent', () => {
    const retry = vi.fn()
    const { rerender } = render(<DataTable<Row> rowKey="id" columns={columns} data={[]} error={new Error('网络不可用')} onRetry={retry} />)
    fireEvent.click(screen.getByRole('button', { name: '重试' }))
    expect(retry).toHaveBeenCalledOnce()

    rerender(<DataTable<Row> rowKey="id" columns={columns} data={[]} error={{ kind: 'unknown', title: '取消', cancelled: true, cause: null }} />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('makes the horizontal scroll area keyboard reachable and names its scroll hint', () => {
    const { container } = render(<DataTable<Row> rowKey="id" columns={columns} data={[{ id: '1', name: 'Ada' }]} />)
    const scrollArea = container.querySelector('.data-table-scroll')

    expect(scrollArea).toHaveAttribute('tabindex', '0')
    expect(scrollArea).toHaveAttribute('aria-label', '左右滑动查看更多')
    expect(container.querySelector('.data-table-scroll-hint')).toHaveTextContent('左右滑动查看更多')
  })

  it('shows a synchronized range control when the table overflows horizontally', () => {
    const { container } = render(<DataTable<Row> rowKey="id" columns={columns} data={[{ id: '1', name: 'Ada' }]} />)
    const inner = container.querySelector<HTMLElement>('.arco-table-content-inner')
    expect(inner).not.toBeNull()
    Object.defineProperty(inner, 'clientWidth', { configurable: true, value: 100 })
    Object.defineProperty(inner, 'scrollWidth', { configurable: true, value: 300 })
    fireEvent.scroll(inner as HTMLElement)

    const scrollbar = screen.getByRole('slider', { name: '左右滑动查看更多' })
    expect(scrollbar).toHaveAttribute('min', '0')
    expect(scrollbar).toHaveAttribute('max', '200')
    fireEvent.change(scrollbar, { target: { value: '120' } })
    expect(inner).toHaveProperty('scrollLeft', 120)
  })

  it('supports keyboard scrolling from the labelled table region', () => {
    const { container } = render(<DataTable<Row> rowKey="id" columns={columns} data={[{ id: '1', name: 'Ada' }]} />)
    const inner = container.querySelector<HTMLElement>('.arco-table-content-inner')
    const scrollArea = container.querySelector<HTMLElement>('.data-table-scroll')
    expect(inner).not.toBeNull()
    expect(scrollArea).not.toBeNull()
    Object.defineProperty(inner, 'clientWidth', { configurable: true, value: 100 })
    Object.defineProperty(inner, 'scrollWidth', { configurable: true, value: 300 })

    fireEvent.keyDown(scrollArea as HTMLElement, { key: 'ArrowRight' })
    expect(inner).toHaveProperty('scrollLeft', 40)
    fireEvent.keyDown(scrollArea as HTMLElement, { key: 'End' })
    expect(inner).toHaveProperty('scrollLeft', 200)
  })
})
