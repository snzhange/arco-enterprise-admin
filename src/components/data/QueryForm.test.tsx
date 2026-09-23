import { Form, Input } from '@arco-design/web-react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { QueryForm } from './QueryForm'

describe('queryForm', () => {
  it('submits explicit fields, resets them, and reveals optional fields', async () => {
    const onSubmit = vi.fn()
    const onReset = vi.fn()
    const onExpandedChange = vi.fn()
    function QueryFormHarness() {
      const [form] = Form.useForm<{ keyword?: string, department?: string }>()
      return (
        <QueryForm
          form={form}
          onSubmit={onSubmit}
          onReset={onReset}
          expanded={false}
          onExpandedChange={onExpandedChange}
          advancedChildren={<Form.Item field="department" label="部门"><Input /></Form.Item>}
        >
          <Form.Item field="keyword" label="关键词"><Input /></Form.Item>
        </QueryForm>
      )
    }

    const { rerender } = render(<QueryFormHarness />)

    expect(screen.queryByLabelText('部门')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '展开' }))
    expect(onExpandedChange).toHaveBeenCalledWith(true)
    rerender(
      <QueryFormHarnessExpanded
        onSubmit={onSubmit}
        onReset={onReset}
        onExpandedChange={onExpandedChange}
      />,
    )
    fireEvent.change(screen.getByLabelText('关键词'), { target: { value: 'Ada' } })
    fireEvent.click(screen.getByRole('button', { name: '查询' }))
    expect(await screen.findByDisplayValue('Ada')).toBeVisible()
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ keyword: 'Ada' })))

    fireEvent.click(screen.getByRole('button', { name: '重置' }))
    expect(onReset).toHaveBeenCalledOnce()
  })
})

function QueryFormHarnessExpanded({
  onSubmit,
  onReset,
  onExpandedChange,
}: {
  onSubmit: (values: { keyword?: string, department?: string }) => void
  onReset: () => void
  onExpandedChange: (expanded: boolean) => void
}) {
  const [form] = Form.useForm<{ keyword?: string, department?: string }>()
  return (
    <QueryForm
      form={form}
      onSubmit={onSubmit}
      onReset={onReset}
      expanded
      onExpandedChange={onExpandedChange}
      advancedChildren={<Form.Item field="department" label="部门"><Input /></Form.Item>}
    >
      <Form.Item field="keyword" label="关键词"><Input /></Form.Item>
    </QueryForm>
  )
}
