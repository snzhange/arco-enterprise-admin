import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputTag,
  Result,
  Select,
  Space,
  Steps,
  Switch,
  Typography,
} from '@arco-design/web-react'
import { useState } from 'react'

const { Title, Paragraph } = Typography

export function StepFormPage() {
  const [current, setCurrent] = useState(1)
  const [form] = Form.useForm<Record<string, unknown>>()

  const next = async () => {
    try {
      await form.validate()
      setCurrent(value => value + 1)
    }
    catch {
      // Arco renders validation errors next to each field.
    }
  }

  const reset = () => {
    form.resetFields()
    setCurrent(1)
  }

  return (
    <Card className="pro-card step-form-page">
      <Title heading={5}>创建推广计划</Title>
      <div className="step-form-wrapper">
        <Steps current={current} lineless>
          <Steps.Step title="基本信息" description="填写计划基本信息" />
          <Steps.Step title="渠道配置" description="配置推广渠道参数" />
          <Steps.Step title="创建完成" description="确认创建结果" />
        </Steps>
        <Form form={form} className="step-form-content">
          {current === 1 && (
            <>
              <Form.Item label="计划名称" field="basic.name" required rules={[{ required: true, message: '请输入计划名称' }, { match: /^[\u4E00-\u9FA5\w]{1,20}$/, message: '限 1-20 个中英文或数字字符' }]}><Input placeholder="请输入计划名称" /></Form.Item>
              <Form.Item label="渠道类型" field="basic.channelType" initialValue="app" required><Select options={[{ label: 'APP 通用渠道', value: 'app' }, { label: '网页通用渠道', value: 'site' }, { label: '游戏通用渠道', value: 'game' }]} /></Form.Item>
              <Form.Item label="推广时间" field="basic.time" required rules={[{ required: true, message: '请选择推广时间' }]}><DatePicker.RangePicker style={{ width: '100%' }} /></Form.Item>
              <Form.Item label="推广链接" field="basic.link" initialValue="https://arco.design" extra="目标页面需支持 HTTPS" required><Input placeholder="请输入推广链接" /></Form.Item>
            </>
          )}
          {current === 2 && (
            <>
              <Form.Item label="渠道来源" field="channel.source" required rules={[{ required: true, message: '请输入渠道来源' }]}><Input placeholder="例如：官方账号" /></Form.Item>
              <Form.Item label="媒介名称" field="channel.media" required rules={[{ required: true, message: '请输入媒介名称' }]}><Input placeholder="例如：信息流" /></Form.Item>
              <Form.Item label="关键词" field="channel.keywords" initialValue={['Arco', '企业管理']} required><InputTag placeholder="请输入关键词" /></Form.Item>
              <Form.Item label="开启提醒" field="channel.remind" initialValue triggerPropName="checked"><Switch /></Form.Item>
              <Form.Item label="推广内容" field="channel.content" required rules={[{ required: true, message: '请输入推广内容' }]}><Input.TextArea placeholder="请输入推广内容" autoSize={{ minRows: 4 }} /></Form.Item>
            </>
          )}
          {current < 3 && (
            <Form.Item label=" ">
              <Space>
                {current === 2 && <Button size="large" onClick={() => setCurrent(1)}>上一步</Button>}
                <Button type="primary" size="large" onClick={next}>下一步</Button>
              </Space>
            </Form.Item>
          )}
          {current === 3 && <Result status="success" title="推广计划创建成功" subTitle="计划已经进入待投放队列，你可以继续查看或创建新计划。" extra={[<Button key="view" onClick={() => setCurrent(1)}>查看计划</Button>, <Button key="again" type="primary" onClick={reset}>再次创建</Button>]} />}
        </Form>
      </div>
      {current === 3 && (
        <div className="step-form-extra">
          <Title heading={6}>说明</Title>
          <Paragraph type="secondary">
            系统会在推广开始前完成内容审核和渠道校验。
            <Button type="text">查看详情</Button>
          </Paragraph>
        </div>
      )}
    </Card>
  )
}
