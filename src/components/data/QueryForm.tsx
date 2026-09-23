import type { FormInstance, FormProps } from '@arco-design/web-react'

import type { ReactNode } from 'react'
import { Button, Form, Space } from '@arco-design/web-react'
import { IconDown, IconRefresh, IconSearch, IconUp } from '@arco-design/web-react/icon'

export interface QueryFormProps<TForm extends object> {
  form: FormInstance<TForm>
  children: ReactNode
  advancedChildren?: ReactNode
  expanded?: boolean
  expandable?: boolean
  onExpandedChange?: (expanded: boolean) => void
  onSubmit: (values: TForm) => void
  onReset: () => void
  loading?: boolean
  className?: string
  layout?: FormProps<TForm>['layout']
  labelAlign?: FormProps<TForm>['labelAlign']
  submitLabel?: ReactNode
  resetLabel?: ReactNode
  actions?: ReactNode
}

export function QueryForm<TForm extends object>({
  form,
  children,
  advancedChildren,
  expanded = false,
  expandable = true,
  onExpandedChange,
  onSubmit,
  onReset,
  loading = false,
  className,
  layout = 'inline',
  labelAlign,
  submitLabel = '查询',
  resetLabel = '重置',
  actions,
}: QueryFormProps<TForm>) {
  const hasAdvancedFields = Boolean(advancedChildren)

  return (
    <Form<TForm>
      form={form}
      layout={layout}
      labelAlign={labelAlign}
      className={['query-form', className].filter(Boolean).join(' ')}
      onSubmit={onSubmit}
    >
      <div className="query-form-fields">
        {children}
        {hasAdvancedFields && expanded && <div className="query-form-advanced">{advancedChildren}</div>}
      </div>
      <div className="query-form-actions">
        <Space wrap>
          <Button type="primary" htmlType="submit" loading={loading} icon={<IconSearch />}>{submitLabel}</Button>
          <Button
            icon={<IconRefresh />}
            disabled={loading}
            onClick={() => {
              form.resetFields()
              onReset()
            }}
          >
            {resetLabel}
          </Button>
          {hasAdvancedFields && expandable && onExpandedChange && (
            <Button
              type="text"
              icon={expanded ? <IconUp /> : <IconDown />}
              onClick={() => onExpandedChange(!expanded)}
            >
              {expanded ? '收起' : '展开'}
            </Button>
          )}
          {actions}
        </Space>
      </div>
    </Form>
  )
}
