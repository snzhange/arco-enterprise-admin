import { Button, Result } from '@arco-design/web-react'

import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <main className="standalone-page">
      <Result
        status="404"
        title="页面不存在"
        subTitle="你访问的页面可能已被移动或删除。"
        extra={<Link to="/dashboard"><Button type="primary">返回工作台</Button></Link>}
      />
    </main>
  )
}
