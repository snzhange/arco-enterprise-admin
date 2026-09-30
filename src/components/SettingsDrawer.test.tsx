import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AppSettingsProvider } from '@/app/settings'
import { SettingsDrawer } from './SettingsDrawer'

const copyText = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
vi.mock('@/app/clipboard', () => ({ copyText }))

describe('settings drawer', () => {
  it('opens, updates a setting, resets it and copies the current settings', async () => {
    const user = userEvent.setup()
    render(<AppSettingsProvider><SettingsDrawer /></AppSettingsProvider>)

    await user.click(screen.getByRole('button', { name: '页面配置' }))
    expect(screen.getByText('主题色')).toBeVisible()

    const switches = screen.getAllByRole('switch')
    await user.click(switches[0])
    await user.click(screen.getByRole('button', { name: '恢复默认' }))
    await user.click(screen.getByRole('button', { name: '复制配置' }))

    expect(copyText).toHaveBeenCalledOnce()
    expect(screen.getByText('主题色')).toBeVisible()
  })
})
