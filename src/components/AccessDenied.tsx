import { Button, Result } from '@arco-design/web-react'
import { useNavigate } from 'react-router-dom'

export function AccessDenied() {
  const navigate = useNavigate()
  return (
    <div className="access-denied-page">
      <Result
        status="403"
        subTitle="抱歉，你没有权限访问该页面。"
        extra={<Button type="primary" onClick={() => navigate('/dashboard/workplace')}>返回首页</Button>}
      />
    </div>
  )
}
