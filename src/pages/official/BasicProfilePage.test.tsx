import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BasicProfilePage } from './BasicProfilePage'

describe('basicProfilePage', () => {
  it('renders current and original parameter details with adjustment history', () => {
    render(<BasicProfilePage />)
    expect(screen.getByText('当前参数')).toBeVisible()
    expect(screen.getByText('原始参数')).toBeVisible()
    expect(screen.getByText('调整记录')).toBeVisible()
    expect(screen.getByText('A-20260901')).toBeVisible()
  })
})
