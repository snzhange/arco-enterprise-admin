import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { UserInfoPage } from './UserInfoPage'

vi.mock('@/app/auth', () => ({ useAuth: () => ({ displayName: '测试用户' }) }))

describe('userInfoPage', () => {
  it('renders profile, projects, teams and empty notices', () => {
    render(<UserInfoPage />)
    expect(screen.getByText('测试用户')).toBeVisible()
    expect(screen.getByText('内容运营平台')).toBeVisible()
    expect(screen.getAllByText('产品与运营部').length).toBeGreaterThan(0)
    expect(screen.getByText('暂无通知')).toBeVisible()
  })
})
