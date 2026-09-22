import { Button, Link, Result, Steps, Typography } from '@arco-design/web-react'
import { IconLink } from '@arco-design/web-react/icon'
import { useNavigate } from 'react-router-dom'

const { Title, Paragraph } = Typography

export function SuccessResultPage() {
  const navigate = useNavigate()
  return (
    <div className="result-page">
      <Result status="success" title="提交成功" subTitle="申请已提交，系统将在 1-5 个工作日内完成审核。" extra={[<Button key="print">打印结果</Button>, <Button key="list" type="primary" onClick={() => navigate('/list/search-table')}>返回项目列表</Button>]} />
      <div className="result-detail-panel">
        <Paragraph bold>当前进度</Paragraph>
        <Steps type="dot" current={2}>
          <Steps.Step title="提交申请" description="2026/09/07 14:00:39" />
          <Steps.Step title="负责人审核" description="处理中" />
          <Steps.Step title="采购凭证" description="等待中" />
          <Steps.Step title="安全测试" description="等待中" />
          <Steps.Step title="正式上线" description="等待中" />
        </Steps>
      </div>
    </div>
  )
}

export function ErrorResultPage() {
  const navigate = useNavigate()
  return (
    <div className="result-page">
      <Result status="error" title="提交失败" subTitle="请核对并修改以下信息后，再重新提交。" extra={[<Button key="back" onClick={() => navigate('/form/group')}>返回修改</Button>, <Button key="retry" type="primary">重新提交</Button>]} />
      <div className="result-detail-panel">
        <Title heading={6}>错误详情</Title>
        <ol>
          <li>
            视频默认码率超出当前套餐范围，
            <Link>
              <IconLink />
              {' '}
              查看套餐说明
            </Link>
          </li>
          <li>
            当前账号没有该直播分类的发布权限，
            <Link>申请权限</Link>
          </li>
        </ol>
      </div>
    </div>
  )
}
