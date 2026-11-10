import type { FormInstance, FormProps } from '@arco-design/web-react'

import type { ReactNode } from 'react'
import { Button, Form, Space } from '@arco-design/web-react'
import { IconDown, IconRefresh, IconSearch, IconUp } from '@arco-design/web-react/icon'
import { useLocale } from '@/app/i18n'

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
  expandLabel?: ReactNode
  collapseLabel?: ReactNode
  initialValues?: FormProps<TForm>['initialValues']
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
  submitLabel,
  resetLabel,
  actions,
  expandLabel,
  collapseLabel,
  initialValues,
}: QueryFormProps<TForm>) {
  const t = useLocale()
  const hasAdvancedFields = Boolean(advancedChildren)
  const visibleSubmitLabel = submitLabel ?? t('queryForm.submit')
  const visibleResetLabel = resetLabel ?? t('queryForm.reset')
  const visibleExpandLabel = expandLabel ?? t('queryForm.expand')
  const visibleCollapseLabel = collapseLabel ?? t('queryForm.collapse')

  return (
    <Form<TForm>
      form={form}
      layout={layout}
      labelAlign={labelAlign}
      className={['query-form', className].filter(Boolean).join(' ')}
      initialValues={initialValues}
      onSubmit={onSubmit}
    >
      <div className="query-form-fields">
        {children}
        {hasAdvancedFields && expanded && <div className="query-form-advanced">{advancedChildren}</div>}
      </div>
      <div className="query-form-actions">
        <Space wrap>
          <Button type="primary" htmlType="submit" loading={loading} icon={<IconSearch />}>{visibleSubmitLabel}</Button>
          <Button
            icon={<IconRefresh />}
            disabled={loading}
            onClick={() => {
              form.resetFields()
              onReset()
            }}
          >
            {visibleResetLabel}
          </Button>
          {hasAdvancedFields && expandable && onExpandedChange && (
            <Button
              type="text"
              icon={expanded ? <IconUp /> : <IconDown />}
              onClick={() => onExpandedChange(!expanded)}
            >
              {expanded ? visibleCollapseLabel : visibleExpandLabel}
            </Button>
          )}
          {actions}
        </Space>
      </div>
    </Form>
  )
}
