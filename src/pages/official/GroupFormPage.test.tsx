import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { GroupFormPage } from './GroupFormPage'

describe('groupFormPage', () => {
  it('shows required field errors and keeps the form available', async () => {
    const user = userEvent.setup()
    render(<GroupFormPage />)
    await user.click(screen.getByRole('button', { name: '提交' }))
    expect(await screen.findByText('请选择采集分辨率')).toBeVisible()
    expect(screen.getByRole('button', { name: '重置' })).toBeVisible()
  })

  it('resets user input', async () => {
    const user = userEvent.setup()
    render(<GroupFormPage />)
    const input = screen.getByLabelText('采集帧率')
    await user.type(input, '60')
    await user.click(screen.getByRole('button', { name: '重置' }))
    expect(input).toHaveValue('')
  })
})
