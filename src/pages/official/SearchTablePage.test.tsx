import { fireEvent, render, screen, within } from '@testing-library/react'
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

  it('validates the required name before creating content', async () => {
    const user = userEvent.setup()
    render(<SearchTablePage />)

    await user.click(screen.getByRole('button', { name: '新建' }))
    const modal = screen.getByRole('dialog')
    await user.click(within(modal).getByRole('button', { name: '确定' }))

    expect(await within(modal).findByText('请输入内容名称')).toBeVisible()
    expect(screen.getByText('00001')).toBeVisible()
  })

  it('adds a created record to the list', async () => {
    const user = userEvent.setup()
    render(<SearchTablePage />)

    await user.click(screen.getByRole('button', { name: '新建' }))
    const modal = screen.getByRole('dialog')
    await user.type(within(modal).getByRole('textbox'), '新建内容')
    await user.click(within(modal).getByRole('button', { name: '确定' }))

    expect(await screen.findByText('新建内容')).toBeVisible()
  })

  it('sorts content volume and keeps the sorted table on the first page', async () => {
    render(<SearchTablePage />)

    const countHeader = screen.getByRole('columnheader', { name: '内容量' })
    fireEvent.click(countHeader.querySelector('.arco-table-cell-with-sorter') ?? countHeader)

    const rows = screen.getAllByRole('row')
    expect(rows[1]).toHaveTextContent('直播活动预告')
    expect(rows[1]).toHaveTextContent('75')

    fireEvent.click(countHeader.querySelector('.arco-table-cell-with-sorter') ?? countHeader)
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('首页推荐内容')
  })
})
