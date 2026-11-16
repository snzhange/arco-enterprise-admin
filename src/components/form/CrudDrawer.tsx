import type { DrawerProps } from '@arco-design/web-react'

import type { ReactNode } from 'react'
import { Drawer, Message } from '@arco-design/web-react'
import { useLocale } from '@/app/i18n'

/** Arco 表单校验失败时 reject 的是带 errors 字段的对象，字段下已经有提示，不必再弹一次 */
function isValidationRejection(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'errors' in error
}

export interface CrudDrawerProps {
  visible: boolean
  title: ReactNode
  children: ReactNode
  onCancel: () => void
  onConfirm: () => void | Promise<void>
  confirmLoading?: boolean
  confirmDisabled?: boolean
  okText?: ReactNode
  cancelText?: ReactNode
  width?: DrawerProps['width']
  afterClose?: DrawerProps['afterClose']
}

export function CrudDrawer({
  visible,
  title,
  children,
  onCancel,
  onConfirm,
  confirmLoading = false,
  confirmDisabled = false,
  okText,
  cancelText,
  width = 520,
  afterClose,
}: CrudDrawerProps) {
  const t = useLocale()
  return (
    <Drawer
      visible={visible}
      title={title}
      width={width}
      className="crud-drawer"
      confirmLoading={confirmLoading}
      okButtonProps={{ disabled: confirmDisabled }}
      okText={okText ?? t('crudDrawer.ok')}
      cancelText={cancelText ?? t('crudDrawer.cancel')}
      onCancel={onCancel}
      onOk={() => {
        // 确认按钮的失败不能静默：校验失败由字段提示，其他异常至少要让用户看到
        void Promise.resolve(onConfirm()).catch((error) => {
          if (isValidationRejection(error))
            return
          Message.error(t('crudDrawer.unexpectedError'))
        })
      }}
      afterClose={afterClose}
      mountOnEnter={false}
      unmountOnExit={false}
    >
      {children}
    </Drawer>
  )
}
