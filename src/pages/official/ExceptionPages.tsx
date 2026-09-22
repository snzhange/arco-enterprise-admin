import { Button, Result } from '@arco-design/web-react'
import { useNavigate } from 'react-router-dom'

interface ExceptionPageProps {
  status: '403' | '404' | '500'
  description: string
  retry?: boolean
}

function ExceptionPage({ status, description, retry }: ExceptionPageProps) {
  const navigate = useNavigate()
  return (
    <div className="exception-page">
      <Result
        status={status}
        subTitle={description}
        extra={retry
          ? [<Button key="retry" onClick={() => window.location.reload()}>重新加载</Button>, <Button key="back" type="primary" onClick={() => navigate('/dashboard/workplace')}>返回首页</Button>]
          : <Button type="primary" onClick={() => navigate('/dashboard/workplace')}>返回首页</Button>}
      />
    </div>
  )
}

export function Exception403Page() {
  return <ExceptionPage status="403" description="抱歉，你没有权限访问该页面。" />
}

export function Exception404Page() {
  return <ExceptionPage status="404" description="抱歉，你访问的页面不存在。" retry />
}

export function Exception500Page() {
  return <ExceptionPage status="500" description="抱歉，服务器暂时出现了问题。" />
}
