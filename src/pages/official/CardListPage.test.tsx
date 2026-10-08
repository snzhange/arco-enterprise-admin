import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { CardListPage } from './CardListPage'

describe('cardListPage', () => {
  it('filters cards and toggles enabled state', async () => {
    const user = userEvent.setup()
    render(<CardListPage />)

    const search = screen.getByPlaceholderText('搜索')
    await user.type(search, '内容管理')
    expect(screen.getAllByText('内容管理').length).toBeGreaterThan(0)
    expect(screen.queryByText('数据分析')).not.toBeInTheDocument()

    await user.clear(search)
    const toggle = document.querySelector('[role="switch"]')
    expect(toggle).toBeTruthy()
    const initial = toggle?.getAttribute('aria-checked')
    await user.click(toggle!)
    expect(toggle).toHaveAttribute('aria-checked', initial === 'true' ? 'false' : 'true')
  })

  it('creates an application card', async () => {
    const user = userEvent.setup()
    render(<CardListPage />)

    await user.click(screen.getByRole('button', { name: /创建质检内容队列/ }))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent('将创建一个新的企业应用卡片')
    await user.click(within(dialog).getByRole('button', { name: '确定' }))
    expect((await screen.findAllByText('新建质检队列')).length).toBeGreaterThan(0)
  })
})
