import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { UserSettingPage } from './UserSettingPage'

vi.mock('@/app/auth', () => ({ useAuth: () => ({ displayName: '测试用户', email: 'test@example.com', id: '00000000-0000-4000-8000-000000000001' }) }))

describe('userSettingPage', () => {
  it('saves and resets the basic profile form', async () => {
    const user = userEvent.setup()
    render(<UserSettingPage />)
    const nickname = screen.getByLabelText('昵称')
    await user.clear(nickname)
    await user.type(nickname, '新昵称')
    await user.click(screen.getByRole('button', { name: '保存' }))
    expect(await screen.findByText('保存成功')).toBeVisible()
    await user.click(screen.getByRole('button', { name: '重置' }))
    expect(nickname).toHaveValue('测试用户')
  })

  it('keeps editable values and switches security tabs with auth records', async () => {
    const user = userEvent.setup()
    render(<UserSettingPage />)
    const email = screen.getByLabelText('邮箱')
    await user.clear(email)
    await user.click(screen.getByRole('button', { name: '保存' }))
    expect(screen.getByLabelText('邮箱')).toHaveValue('')
    await user.click(screen.getByRole('tab', { name: '安全设置' }))
    expect(screen.getByText('登录密码')).toBeVisible()
    await user.click(screen.getByRole('tab', { name: '实名认证' }))
    expect(screen.getAllByText('企业认证').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Arco Enterprise Technology Co., Ltd.').length).toBeGreaterThan(0)
  })
})
