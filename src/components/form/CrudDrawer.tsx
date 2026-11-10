import type { DrawerProps } from '@arco-design/web-react'

import type { ReactNode } from 'react'
import { Drawer } from '@arco-design/web-react'
import { useLocale } from '@/app/i18n'

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
        void onConfirm()
      }}
      afterClose={afterClose}
      mountOnEnter={false}
      unmountOnExit={false}
    >
      {children}
    </Drawer>
  )
}
