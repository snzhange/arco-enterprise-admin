import {
  Button,
  Card,
  Carousel,
  Divider,
  Grid,
  Link,
  Radio,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
} from '@arco-design/web-react'
import {
  IconCalendar,
  IconCaretDown,
  IconCaretUp,
  IconCheckCircle,
  IconFile,
  IconFire,
  IconMobile,
  IconSettings,
  IconStorage,
} from '@arco-design/web-react/icon'

import { useMemo, useState } from 'react'
import { getErrorMessage, getTraceMessage } from '@/api/errors'
import { useGetDashboardSummary } from '@/api/generated/admin-api'
import { useAuth } from '@/app/auth'
import carouselOne from '@/assets/workplace-carousel-1.webp'
import carouselTwo from '@/assets/workplace-carousel-2.webp'
import carouselThree from '@/assets/workplace-carousel-3.webp'
import carouselFour from '@/assets/workplace-carousel-4.webp'
import { OverviewAreaChart } from '@/components/OverviewAreaChart'

const { Row, Col } = Grid
const { Title, Text, Paragraph } = Typography

const shortcutItems = [
  { title: '内容管理', icon: <IconFile /> },
  { title: '内容统计', icon: <IconStorage /> },
  { title: '高级管理', icon: <IconSettings /> },
  { title: '在线推广', icon: <IconMobile /> },
  { title: '营销活动', icon: <IconFire /> },
]

const recentShortcuts = [
  { title: '内容统计', icon: <IconStorage /> },
  { title: '内容管理', icon: <IconFile /> },
  { title: '高级管理', icon: <IconSettings /> },
]

const contentRows = [
  { rank: 1, title: '经济日报：财政政策要精准提升效能', pv: '496.8k', increase: 0.7677 },
  { rank: 2, title: '“双12”遇冷消费者厌倦了电商平台的促销“套路”', pv: '493.6k', increase: 1.4353 },
  { rank: 3, title: '致敬坚守战“疫”一线的社区工作者', pv: '490.4k', increase: 0.546 },
  { rank: 4, title: '普高还是职高？家长们陷入选校难题', pv: '487.2k', increase: 1.2356 },
  { rank: 5, title: '新员工入职指南', pv: '484k', increase: 1.2521 },
]

const announcements = [
  { type: '活动', color: 'orangered', text: '内容最新优惠活动' },
  { type: '信息', color: 'cyan', text: '新增内容尚未通过审核，详情请点击查看。' },
  { type: '公告', color: 'arcoblue', text: '当前产品试用期即将结束，如需续费请点击查看。' },
  { type: '公告', color: 'arcoblue', text: '1 月新系统升级计划通知' },
  { type: '信息', color: 'cyan', text: '新增内容已经通过审核，详情请点击查看。' },
]

const workplaceCarouselImages = [carouselOne, carouselTwo, carouselThree, carouselFour]

export function DashboardPage() {
  const user = useAuth()
  const summary = useGetDashboardSummary({ query: { retry: false } })

  if (summary.isPending) {
    return <Skeleton loading animation className="page-skeleton" />
  }

  if (summary.isError || !summary.data) {
    const traceMessage = getTraceMessage(summary.error)
    return (
      <div className="page-error" role="alert">
        <Title heading={4}>暂时无法加载工作台</Title>
        <Text type="secondary">{getErrorMessage(summary.error)}</Text>
        {traceMessage && <Text type="secondary">{traceMessage}</Text>}
        <Button type="primary" onClick={() => void summary.refetch()}>重试</Button>
      </div>
    )
  }

  return (
    <div className="page-container workplace-page">
      <div className="workplace-wrapper">
        <Space className="workplace-left" size={16} direction="vertical">
          <OverviewCard name={user.displayName} />
          <Row gutter={16}>
            <Col span={12}><PopularContentsCard /></Col>
            <Col span={12}><ContentPercentageCard /></Col>
          </Row>
        </Space>
        <Space className="workplace-right" size={16} direction="vertical">
          <ShortcutsCard />
          <WorkplaceCarouselCard />
          <AnnouncementCard />
          <DocsCard />
        </Space>
      </div>
    </div>
  )
}

function OverviewCard({ name }: { name: string }) {
  const stats = [
    { title: '线上总数据', count: '373.5w+', unit: '个', icon: <IconCalendar /> },
    { title: '投放中的内容', count: '368', unit: '个', icon: <IconFile /> },
    { title: '日新增评论', count: '8874', unit: '个', icon: <IconCheckCircle /> },
    { title: '较昨日新增', count: '2.8%', unit: '', icon: <IconCaretUp className="growth-icon" /> },
  ]
  const chartData = [51, 58, 32, 43, 33, 65, 49, 63, 50, 25, 68, 74]

  return (
    <Card className="pro-card overview-card">
      <Title heading={5}>
        欢迎回来，
        {name}
      </Title>
      <Divider />
      <Row className="overview-stats">
        {stats.map((stat, index) => (
          <Col flex={1} key={stat.title}>
            <div className="overview-stat">
              <div className="overview-stat-icon">{stat.icon}</div>
              <div>
                <div className="overview-stat-title">{stat.title}</div>
                <div className="overview-stat-count">
                  {stat.count}
                  <span>{stat.unit}</span>
                </div>
              </div>
            </div>
            {index < stats.length - 1 && <Divider type="vertical" className="overview-divider" />}
          </Col>
        ))}
      </Row>
      <Divider />
      <div className="overview-chart-heading">
        <Paragraph>
          内容数据
          <span>（近 1 年）</span>
        </Paragraph>
        <Link>查看更多</Link>
      </div>
      <OverviewAreaChart values={chartData} />
    </Card>
  )
}

function PopularContentsCard() {
  const [type, setType] = useState(0)
  const columns = useMemo(() => [
    { title: '排名', dataIndex: 'rank', width: 55 },
    { title: '内容标题', dataIndex: 'title', render: (value: string) => <Paragraph ellipsis={{ rows: 1 }} style={{ margin: 0 }}>{value}</Paragraph> },
    { title: '浏览量', dataIndex: 'pv', width: 76 },
    { title: '增长率', dataIndex: 'increase', width: 84, render: (value: number) => (
      <span className={value < 0 ? 'negative-number' : 'positive-number'}>
        {`${(value * 100).toFixed(2)}%`}
        {' '}
        {value < 0 ? <IconCaretDown /> : <IconCaretUp />}
      </span>
    ) },
  ], [])

  return (
    <Card className="pro-card workplace-table-card">
      <div className="workplace-card-heading">
        <Title heading={6}>线上热门内容</Title>
        <Link>查看更多</Link>
      </div>
      <Radio.Group type="button" value={type} onChange={setType} options={[{ label: '文本', value: 0 }, { label: '图文', value: 1 }, { label: '视频', value: 2 }]} className="workplace-radio" />
      <Table rowKey="rank" columns={columns} data={contentRows} pagination={{ pageSize: 5, simple: true }} />
    </Card>
  )
}

function ContentPercentageCard() {
  return (
    <Card className="pro-card percentage-card">
      <Title heading={6}>内容类别占比</Title>
      <div className="content-donut-wrap">
        <div className="content-donut">
          <div>
            <strong>{(928530).toLocaleString()}</strong>
            <span>内容量</span>
          </div>
        </div>
      </div>
      <div className="content-legend">
        <span>
          <i className="legend-cyan" />
          纯文本
        </span>
        <span>
          <i className="legend-blue" />
          图文类
        </span>
        <span>
          <i className="legend-purple" />
          视频类
        </span>
      </div>
    </Card>
  )
}

function ShortcutsCard() {
  return (
    <Card className="pro-card shortcuts-card">
      <div className="workplace-card-heading">
        <Title heading={6}>快捷入口</Title>
        <Link>查看更多</Link>
      </div>
      <div className="shortcut-grid">
        {shortcutItems.map(item => (
          <button className="shortcut-item" type="button" key={item.title}>
            <span className="shortcut-icon">{item.icon}</span>
            <span>{item.title}</span>
          </button>
        ))}
      </div>
      <Divider />
      <div className="recent-title">最近访问</div>
      <div className="shortcut-grid">
        {recentShortcuts.map(item => (
          <button className="shortcut-item" type="button" key={item.title}>
            <span className="shortcut-icon">{item.icon}</span>
            <span>{item.title}</span>
          </button>
        ))}
      </div>
    </Card>
  )
}

function AnnouncementCard() {
  return (
    <Card className="pro-card announcement-card">
      <div className="workplace-card-heading">
        <Title heading={6}>公告</Title>
        <Link>查看更多</Link>
      </div>
      {announcements.map(item => (
        <div className="announcement-item" key={item.text}>
          <Tag color={item.color} size="small">{item.type}</Tag>
          <span>{item.text}</span>
        </div>
      ))}
    </Card>
  )
}

function DocsCard() {
  return (
    <Card className="pro-card docs-card">
      <div className="workplace-card-heading">
        <Title heading={6}>相关文档</Title>
        <Link>查看更多</Link>
      </div>
      <div className="docs-grid">
        <Link href="https://arco.design/react/docs/start" target="_blank">React 组件库</Link>
        <Link href="https://arco.design/themes" target="_blank">风格配置平台</Link>
        <Link href="https://arco.design/material" target="_blank">物料平台</Link>
        <Link href="https://arco.design/vue/docs/start" target="_blank">Vue 组件库</Link>
      </div>
    </Card>
  )
}

function WorkplaceCarouselCard() {
  return (
    <Card className="pro-card workplace-carousel-card">
      <Carousel indicatorType="slider" showArrow="never" autoPlay>
        {workplaceCarouselImages.map(image => (
          <div key={image}>
            <img src={image} alt="" />
          </div>
        ))}
      </Carousel>
    </Card>
  )
}
