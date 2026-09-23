import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SearchTablePage } from './SearchTablePage'

describe('searchTablePage local list sample', () => {
  it('filters local records and expands advanced criteria without calling APIs', async () => {
    const user = userEvent.setup()
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    render(<SearchTablePage />)

    expect(screen.getByText('00001')).toBeVisible()
    await user.type(screen.getByLabelText('内容编号'), 'missing')
    await user.click(screen.getByRole('button', { name: '查询' }))
    expect(await screen.findByText('暂无数据')).toBeVisible()

    await user.click(screen.getByRole('button', { name: '重置' }))
    await user.click(screen.getByRole('button', { name: '展开筛选' }))
    expect(screen.getAllByText('状态').some(element => element.closest('.arco-form-item'))).toBe(true)
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })
})
