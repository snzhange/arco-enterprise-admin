import { Spin } from '@arco-design/web-react'

export function LoadingScreen() {
  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <Spin size={32} />
      <span>正在加载管理台</span>
    </div>
  )
}
