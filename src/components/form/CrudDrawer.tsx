import type { DrawerProps } from '@arco-design/web-react'

import type { ReactNode } from 'react'
import { Drawer } from '@arco-design/web-react'

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
  okText = '保存',
  cancelText = '取消',
  width = 520,
  afterClose,
}: CrudDrawerProps) {
  return (
    <Drawer
      visible={visible}
      title={title}
      width={width}
      confirmLoading={confirmLoading}
      okButtonProps={{ disabled: confirmDisabled }}
      okText={okText}
      cancelText={cancelText}
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
