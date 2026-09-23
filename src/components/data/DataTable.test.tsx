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
})
