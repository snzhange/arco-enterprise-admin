import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MonitorPage } from './MonitorPage'

vi.mock('@/app/auth', () => ({ useAuth: () => ({ displayName: '测试用户' }) }))

describe('monitorPage', () => {
  it('sends a non-empty chat message and ignores empty submissions', async () => {
    const user = userEvent.setup()
    render(<MonitorPage />)
    const input = screen.getByPlaceholderText('发送一条消息')
    await user.click(screen.getByRole('button', { name: '发送' }))
    expect(screen.queryByText('我')).not.toBeInTheDocument()
    await user.type(input, '需要关注的消息')
    await user.click(screen.getByRole('button', { name: '发送' }))
    expect(await screen.findByText('需要关注的消息')).toBeVisible()
    expect(input).toHaveValue('')
  })

  it('switches tabs and reports quick operation feedback', async () => {
    const user = userEvent.setup()
    render(<MonitorPage />)
    await user.click(screen.getByRole('tab', { name: '在线用户' }))
    expect(screen.getByRole('tab', { name: '在线用户' })).toHaveAttribute('aria-selected', 'true')
    await user.click(screen.getByRole('button', { name: '切换清晰度' }))
    expect((await screen.findAllByText('切换清晰度')).length).toBeGreaterThan(1)
  })

  it('reports studio update feedback', async () => {
    const user = userEvent.setup()
    render(<MonitorPage />)
    await user.click(screen.getByRole('button', { name: '更新' }))
    expect(await screen.findByText('直播信息已更新')).toBeVisible()
  })
})
