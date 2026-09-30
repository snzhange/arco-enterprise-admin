import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { AccessDenied } from './AccessDenied'

const navigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => navigate }
})

describe('access denied', () => {
  it('shows the forbidden state and returns to the dashboard', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><AccessDenied /></MemoryRouter>)

    expect(screen.getByText('抱歉，你没有权限访问该页面。')).toBeVisible()
    await user.click(screen.getByRole('button', { name: '返回首页' }))
    expect(navigate).toHaveBeenCalledWith('/dashboard/workplace')
  })
})
