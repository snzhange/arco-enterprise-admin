import {
  Badge,
  Button,
  Card,
  Descriptions,
  Grid,
  Space,
  Steps,
  Table,
  Typography,
} from '@arco-design/web-react'

import { adjustmentRecords } from './data'

const { Title } = Typography

const currentVideo = [
  { label: '视频模式', value: '自定义' },
  { label: '采集分辨率', value: '1920 × 1080' },
  { label: '采集帧率', value: '60 fps' },
  { label: '编码分辨率', value: '1920 × 1080' },
  { label: '最小码率', value: '1500 bps' },
  { label: '最大码率', value: '5000 bps' },
  { label: '默认码率', value: '3000 bps' },
  { label: '编码帧率', value: '60 fps' },
  { label: '编码档位', value: 'High' },
]

const currentAudio = [
  { label: '音频模式', value: '自定义' },
  { label: '采集声道', value: '2 声道' },
  { label: '编码声道', value: '2 声道' },
  { label: '编码码率', value: '128 kbps' },
  { label: '编码规格', value: 'AAC-LC' },
]

export function BasicProfilePage() {
  const columns = [
    { title: '调整编号', dataIndex: 'contentId' },
    { title: '调整内容', dataIndex: 'content' },
    { title: '状态', dataIndex: 'status', render: (status: boolean) => <Badge status={status ? 'success' : 'processing'} text={status ? '已完成' : '审批中'} /> },
    { title: '更新时间', dataIndex: 'updatedTime' },
    { title: '操作', render: () => <Button type="text">查看</Button> },
  ]
  return (
    <Space className="official-stack basic-profile-page" size={16} direction="vertical">
      <Card className="pro-card profile-header-card">
        <Grid.Row justify="space-between" align="center">
          <Grid.Col span={16}><Title heading={6}>参数调整申请</Title></Grid.Col>
          <Grid.Col span={8} style={{ textAlign: 'right' }}>
            <Space>
              <Button>取消申请</Button>
              <Button type="primary">返回列表</Button>
            </Space>
          </Grid.Col>
        </Grid.Row>
        <Steps current={2} lineless className="profile-steps">
          <Steps.Step title="提交申请" />
          <Steps.Step title="负责人审批" />
          <Steps.Step title="调整完成" />
        </Steps>
      </Card>
      <ProfileDescriptions title="当前参数" videoTitle="当前视频参数" audioTitle="当前音频参数" video={currentVideo} audio={currentAudio} />
      <ProfileDescriptions title="原始参数" videoTitle="原始视频参数" audioTitle="原始音频参数" video={currentVideo.map(item => ({ ...item, value: item.value.replace('60', '30').replace('3000', '2500') }))} audio={currentAudio} />
      <Card className="pro-card">
        <Title heading={6}>调整记录</Title>
        <Table rowKey="contentId" columns={columns} data={adjustmentRecords} pagination={false} />
      </Card>
    </Space>
  )
}

function ProfileDescriptions({ title, videoTitle, audioTitle, video, audio }: { title: string, videoTitle: string, audioTitle: string, video: Array<{ label: string, value: string }>, audio: Array<{ label: string, value: string }> }) {
  return (
    <Card className="pro-card profile-description-card">
      <Title heading={6}>{title}</Title>
      <Descriptions title={videoTitle} colon="：" labelStyle={{ textAlign: 'right', width: 180 }} data={video} column={3} />
      <Descriptions title={audioTitle} colon="：" labelStyle={{ textAlign: 'right', width: 180 }} data={audio} column={3} className="profile-audio-description" />
    </Card>
  )
}
