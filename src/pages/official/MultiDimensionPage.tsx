import {
  Card,
  Grid,
  Space,
  Statistic,
  Typography,
} from '@arco-design/web-react'
import {
  IconArrowFall,
  IconArrowRise,
  IconEdit,
  IconHeart,
  IconThumbUp,
  IconUser,
} from '@arco-design/web-react/icon'

import { activityRecords, chartValues } from './data'

const { Row, Col } = Grid
const { Title, Text } = Typography

const overview = [
  { title: '内容生产量', value: 3520, icon: <IconEdit />, tone: 'orange' },
  { title: '内容点击量', value: 125680, icon: <IconThumbUp />, tone: 'cyan' },
  { title: '内容曝光量', value: 845230, icon: <IconHeart />, tone: 'blue' },
  { title: '活跃用户数', value: 12840, icon: <IconUser />, tone: 'purple' },
]

const retentionCards = [
  { title: '用户留存趋势', value: 7842, diff: 8.6, increment: true, bars: chartValues.slice(2, 10) },
  { title: '用户留存量', value: 6580, diff: 2.1, increment: false, bars: chartValues.slice(0, 8) },
  { title: '内容消费趋势', value: 15640, diff: 12.4, increment: true, bars: chartValues.slice(3, 11) },
  { title: '内容消费量', value: 9850, diff: 6.8, increment: true, bars: chartValues.slice(1, 9) },
]

export function MultiDimensionPage() {
  return (
    <Space className="official-stack" size={16} direction="vertical">
      <Row gutter={20}>
        <Col span={16}>
          <Card className="pro-card multi-overview-card">
            <Title heading={6}>数据总览</Title>
            <Row>
              {overview.map(item => (
                <Col span={6} key={item.title}>
                  <div className="multi-stat">
                    <Title heading={6}>{item.title}</Title>
                    <div>
                      <span className={`multi-stat-icon multi-${item.tone}`}>{item.icon}</span>
                      <Statistic value={item.value} groupSeparator />
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
            <div className="multi-line-chart">
              <div className="multi-line-grid">
                <i />
                <i />
                <i />
                <i />
              </div>
              <div className="multi-line one" />
              <div className="multi-line two" />
              <div className="multi-line three" />
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card className="pro-card activity-card-official">
              <Title heading={6}>今日活跃度</Title>
              {activityRecords.map(item => (
                <div className="activity-progress" key={item.name}>
                  <span>{item.name}</span>
                  <div><i style={{ width: `${item.value}%`, background: item.color }} /></div>
                  <b>
                    {item.value}
                    %
                  </b>
                </div>
              ))}
            </Card>
            <Card className="pro-card topic-card">
              <Title heading={6}>内容主题分布</Title>
              <div className="radar-chart">
                <div className="radar-ring ring-one" />
                <div className="radar-ring ring-two" />
                <div className="radar-shape" />
                <span className="radar-label top">科技</span>
                <span className="radar-label right">产品</span>
                <span className="radar-label bottom">运营</span>
                <span className="radar-label left">设计</span>
              </div>
            </Card>
          </Space>
        </Col>
      </Row>
      <Row gutter={16}>{retentionCards.map(item => <Col span={6} key={item.title}><RetentionCard {...item} /></Col>)}</Row>
      <Card className="pro-card source-card">
        <Title heading={6}>内容来源</Title>
        <div className="source-chart">
          {['直接访问', '搜索引擎', '外部链接', '社交平台', '广告投放'].map((source, index) => (
            <div className="source-group" key={source}>
              <div className="source-bars">
                <i style={{ height: `${84 - index * 8}%` }} />
                <i style={{ height: `${58 + index * 5}%` }} />
                <i style={{ height: `${36 + index * 6}%` }} />
              </div>
              <span>{source}</span>
            </div>
          ))}
        </div>
      </Card>
    </Space>
  )
}

function RetentionCard({ title, value, diff, increment, bars }: { title: string, value: number, diff: number, increment: boolean, bars: number[] }) {
  return (
    <Card className="pro-card retention-card">
      <Statistic
        title={<Title heading={6}>{title}</Title>}
        value={value}
        groupSeparator
        extra={(
          <span className={increment ? 'positive-number' : 'negative-number'}>
            {diff}
            %
            {' '}
            {increment ? <IconArrowRise /> : <IconArrowFall />}
          </span>
        )}
      />
      <div className="retention-mini-chart">{bars.map(bar => <i key={bar} style={{ height: `${bar}%` }} />)}</div>
      <Text type="secondary">较昨日</Text>
    </Card>
  )
}
