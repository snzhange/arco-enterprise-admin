import type { ReactNode } from 'react'

import {
  Avatar,
  Button,
  Card,
  Descriptions,
  Form,
  Grid,
  Input,
  Message,
  Radio,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from '@arco-design/web-react'
import {
  IconArrowRight,
  IconDownload,
  IconFaceSmileFill,
  IconMore,
  IconStop,
  IconSwap,
  IconTags,
} from '@arco-design/web-react/icon'
import { useState } from 'react'

import { useAuth } from '@/app/auth'

const { Title, Text } = Typography
const { Row, Col } = Grid

interface ChatMessage {
  id: number
  name: string
  content: string
  color: string
}

const initialMessages: ChatMessage[] = [
  { id: 1, name: '小林', content: '今天的直播内容准备得怎么样了？', color: '#165dff' },
  { id: 2, name: '运营助手', content: '素材已全部审核通过，可以按计划开始。', color: '#00b42a' },
  { id: 3, name: '周明', content: '收到，主备流状态都正常。', color: '#722ed1' },
  { id: 4, name: '王璐', content: '活动链接已同步到所有推广渠道。', color: '#ff7d00' },
]

const carouselData = [
  { id: '54e23ade', name: '企业产品发布会', duration: '00:05:19', status: '审核失败' },
]

export function MonitorPage() {
  return (
    <div className="monitor-layout">
      <ChatPanel />
      <div className="monitor-center">
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <StudioCard />
          <DataStatisticCard />
        </Space>
      </div>
      <div className="monitor-right">
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <StudioStatusCard />
          <QuickOperationCard />
          <StudioInfoCard />
        </Space>
      </div>
    </div>
  )
}

function ChatPanel() {
  const [messages, setMessages] = useState(initialMessages)
  const [message, setMessage] = useState('')

  const send = () => {
    const content = message.trim()
    if (!content)
      return
    setMessages(items => [...items, { id: Date.now(), name: '我', content, color: '#165dff' }])
    setMessage('')
  }

  return (
    <section className="monitor-chat pro-card">
      <div className="monitor-chat-header">
        <Title heading={6}>直播聊天区</Title>
        <Space size={8}>
          <Select style={{ width: 82 }} defaultValue="all" options={[{ label: '全部', value: 'all' }]} />
          <Input.Search placeholder="搜索" />
          <Button type="text" icon={<IconDownload />} aria-label="下载聊天记录" />
        </Space>
      </div>
      <div className="monitor-chat-list">
        {messages.map(item => (
          <div className="monitor-message" key={item.id}>
            <Avatar size={32} style={{ background: item.color }}>{item.name.slice(0, 1)}</Avatar>
            <div>
              <strong>{item.name}</strong>
              <p>{item.content}</p>
            </div>
          </div>
        ))}
      </div>
      <Space size={8} className="monitor-chat-footer">
        <Input value={message} onChange={setMessage} onPressEnter={send} suffix={<IconFaceSmileFill />} placeholder="发送一条消息" />
        <Button type="primary" onClick={send}>发送</Button>
      </Space>
    </section>
  )
}

function StudioCard() {
  const user = useAuth()
  return (
    <Card className="pro-card monitor-studio-card">
      <Row justify="space-between">
        <Col><Title heading={6}>直播预览</Title></Col>
        <Col><Button type="text" icon={<IconMore />} aria-label="更多操作" /></Col>
      </Row>
      <div className="studio-preview">
        <div className="studio-preview-content">
          <span className="live-tag">LIVE</span>
          <div className="studio-stage-mark">ARCO LIVE</div>
          <p>企业数字化运营分享会</p>
        </div>
      </div>
      <div className="studio-bar">
        <Space size={12}>
          <Avatar size={24}>{user.displayName.slice(0, 1)}</Avatar>
          <Text>
            {user.displayName}
            {' '}
            的直播间
          </Text>
        </Space>
        <Text type="secondary">36,000 人正在观看</Text>
      </div>
    </Card>
  )
}

function DataStatisticCard() {
  const columns = [
    { title: '序号', render: (_: unknown, _record: unknown, index: number) => index + 1, width: 64 },
    { title: '封面', dataIndex: 'name', render: () => <div className="carousel-cover"><Tag color="red">审核失败</Tag></div> },
    { title: '名称', dataIndex: 'name' },
    { title: '时长', dataIndex: 'duration' },
    { title: 'ID', dataIndex: 'id' },
  ]
  return (
    <Card className="pro-card monitor-data-card">
      <Tabs defaultActiveTab="method">
        <Tabs.TabPane key="method" title="直播方式" />
        <Tabs.TabPane key="users" title="在线用户" />
      </Tabs>
      <div className="monitor-data-content">
        <Radio.Group defaultValue="video" type="button" options={[{ label: '普通直播', value: 'normal' }, { label: '流控直播', value: 'flow' }, { label: '视频直播', value: 'video' }, { label: '网页直播', value: 'web' }]} />
        <div className="monitor-data-actions">
          <Button type="text">编辑轮播</Button>
          <Button disabled>开始轮播</Button>
        </div>
        <Table rowKey="id" columns={columns} data={carouselData} rowSelection={{ type: 'checkbox' }} pagination={false} />
        <Text type="secondary" className="monitor-list-tip">轮播列表共 1 条内容</Text>
      </div>
    </Card>
  )
}

function StudioStatusCard() {
  const streamData = [
    { label: '主流码率', value: '6 Mbps' },
    { label: '帧率', value: '60' },
    { label: '热备码率', value: '6 Mbps' },
    { label: '帧率', value: '60' },
    { label: '冷备码率', value: '6 Mbps' },
    { label: '帧率', value: '60' },
  ]
  return (
    <Card className="pro-card monitor-side-card">
      <Space align="start">
        <Title heading={6}>直播状态</Title>
        <Tag color="green">流畅</Tag>
      </Space>
      <Descriptions colon="：" data={streamData} column={2} />
      <Title heading={6}>画面信息</Title>
      <Descriptions colon="：" data={[{ label: '线路', value: '热备' }, { label: 'CDN', value: 'KS' }, { label: '播放格式', value: 'FLV' }, { label: '画质', value: '原画' }]} column={2} />
    </Card>
  )
}

function QuickOperationCard() {
  const actions: Array<{ label: string, icon: ReactNode }> = [
    { label: '切换清晰度', icon: <IconTags /> },
    { label: '切换主备流', icon: <IconSwap /> },
    { label: '移除清晰度', icon: <IconStop /> },
    { label: '推流垫片', icon: <IconArrowRight /> },
  ]
  return (
    <Card className="pro-card monitor-side-card">
      <Title heading={6}>快捷操作</Title>
      <Space direction="vertical" size={10} style={{ width: '100%' }}>
        {actions.map(item => <Button long icon={item.icon} key={item.label} onClick={() => Message.info(item.label)}>{item.label}</Button>)}
      </Space>
    </Card>
  )
}

function StudioInfoCard() {
  return (
    <Card className="pro-card monitor-side-card">
      <Title heading={6}>直播信息</Title>
      <Form layout="vertical" initialValues={{ title: '企业数字化运营分享会', notice: '欢迎进入直播间', category: '企业服务' }}>
        <Form.Item label="直播标题" field="title" required><Input /></Form.Item>
        <Form.Item label="上线通知" field="notice" required><Input.TextArea /></Form.Item>
        <Form.Item label="直播分类" field="category" required><Input.Search /></Form.Item>
      </Form>
      <Button type="primary" onClick={() => Message.success('直播信息已更新')}>更新</Button>
    </Card>
  )
}
