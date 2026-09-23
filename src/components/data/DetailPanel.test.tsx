import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DetailPanel } from './DetailPanel'

describe('detailPanel', () => {
  it('renders independent descriptors and loading, error, and empty states', () => {
    const { rerender } = render(<DetailPanel items={[{ key: 'name', label: '姓名', value: 'Ada' }]} />)
    expect(screen.getByText('姓名')).toBeVisible()
    expect(screen.getByText('Ada')).toBeVisible()

    rerender(<DetailPanel loading />)
    expect(screen.getByText('正在加载详情...')).toBeVisible()
    rerender(<DetailPanel error={new Error('详情失败')} />)
    expect(screen.getByRole('alert')).toHaveTextContent('详情失败')
    rerender(<DetailPanel />)
    expect(screen.getByText('暂无详情')).toBeVisible()
  })
})
