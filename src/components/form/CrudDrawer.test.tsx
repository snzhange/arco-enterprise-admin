import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CrudDrawer } from './CrudDrawer'

describe('crudDrawer', () => {
  it('delegates confirm and cancel without closing on its own', () => {
    const onCancel = vi.fn()
    const onConfirm = vi.fn()
    render(<CrudDrawer visible title="编辑用户" onCancel={onCancel} onConfirm={onConfirm}>表单</CrudDrawer>)

    fireEvent.click(screen.getByRole('button', { name: '保存' }))
    fireEvent.click(screen.getByRole('button', { name: '取消' }))
    expect(onConfirm).toHaveBeenCalledOnce()
    expect(onCancel).toHaveBeenCalledOnce()
    expect(screen.getByText('表单')).toBeVisible()
  })
})
