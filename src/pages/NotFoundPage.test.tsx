import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { NotFoundPage } from './NotFoundPage'

describe('not found page', () => {
  it('shows a recovery link to the dashboard', () => {
    render(<MemoryRouter><NotFoundPage /></MemoryRouter>)

    expect(screen.getByText('页面不存在')).toBeVisible()
    expect(screen.getByRole('link', { name: '返回工作台' })).toHaveAttribute('href', '/dashboard')
  })
})
