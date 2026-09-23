import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PageEmptyState, PageErrorState, PageForbiddenState, PageLoadingState } from './PageState'

describe('pageState primitives', () => {
  it('renders loading, empty, and forbidden states', () => {
    const { rerender } = render(<PageLoadingState label="加载用户" />)
    expect(screen.getByText('加载用户')).toBeVisible()

    rerender(<PageEmptyState title="没有用户" description="调整筛选条件" />)
    expect(screen.getByText('没有用户')).toBeVisible()
    expect(screen.getByText('调整筛选条件')).toBeVisible()

    rerender(<PageForbiddenState title="无权查看" description="联系管理员" />)
    expect(screen.getByRole('alert')).toHaveTextContent('联系管理员')
  })

  it('offers retry for errors and renders cancellation silently', () => {
    const retry = vi.fn()
    const { rerender } = render(<PageErrorState error={new Error('服务暂时不可用')} onRetry={retry} />)
    fireEvent.click(screen.getByRole('button', { name: '重试' }))
    expect(retry).toHaveBeenCalledOnce()

    rerender(<PageErrorState error={{ kind: 'unknown', title: '取消', cancelled: true, cause: null }} onRetry={retry} />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '重试' })).not.toBeInTheDocument()
  })
})
