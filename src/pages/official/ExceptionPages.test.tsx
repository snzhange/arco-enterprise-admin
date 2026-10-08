import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { Exception403Page, Exception404Page, Exception500Page } from './ExceptionPages'

describe('exception pages', () => {
  it.each([
    [Exception403Page, '抱歉，你没有权限访问该页面。'],
    [Exception404Page, '抱歉，你访问的页面不存在。'],
    [Exception500Page, '抱歉，服务器暂时出现了问题。'],
  ])('renders recovery guidance', (Page, description) => {
    render(<MemoryRouter><Page /></MemoryRouter>)
    expect(screen.getByText(description)).toBeVisible()
    expect(screen.getByRole('button', { name: '返回首页' })).toBeVisible()
  })
})
