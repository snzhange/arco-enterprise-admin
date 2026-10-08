import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { StepFormPage } from './StepFormPage'

describe('stepFormPage', () => {
  it('blocks advancing until required fields are complete', async () => {
    const user = userEvent.setup()
    render(<StepFormPage />)
    await user.click(screen.getByRole('button', { name: '下一步' }))
    expect(await screen.findByText('请输入计划名称')).toBeVisible()
    expect(screen.getByText('基本信息')).toBeVisible()
  })
})
