import {
  Card,
  Grid,
  Space,
  Statistic,
  Table,
  Typography,
} from '@arco-design/web-react'
import { IconArrowFall, IconArrowRise } from '@arco-design/web-react/icon'

import { authorRecords, chartValues } from './data'

const { Row, Col } = Grid
const { Title, Text } = Typography

const overviewCards = [
  { title: '访问人数', count: 5678, diff: 8.4, type: 'line', increment: true, values: [30, 42, 38, 51, 49, 64, 70, 68] },
  { title: '内容发布量', count: 3520, diff: 4.1, type: 'interval', increment: true, values: [28, 34, 42, 37, 48, 55, 52, 64] },
  { title: '评论数量', count: 1846, diff: 1.6, type: 'line', increment: false, values: [62, 57, 59, 48, 52, 44, 47, 42] },
  { title: '分享数量', count: 921, diff: 12.5, type: 'pie', increment: true, values: [52, 28, 20] },
]

export function DataAnalysisPage() {
  const authorColumns = [
    { title: '排名', dataIndex: 'id', width: 68 },
    { title: '作者', dataIndex: 'author' },
    { title: '内容量', dataIndex: 'contentCount', sorter: (a: { contentCount: number }, b: { contentCount: number }) => a.contentCount - b.contentCount, render: (value: number) => value.toLocaleString() },
    { title: '点击量', dataIndex: 'clickCount', sorter: (a: { clickCount: number }, b: { clickCount: number }) => a.clickCount - b.clickCount, render: (value: number) => value.toLocaleString() },
  ]

  return (
    <Space className="official-stack" size={16} direction="vertical">
      <Card className="pro-card analysis-overview-card">
        <Title heading={6}>舆情分析</Title>
        <Row gutter={20}>
          {overviewCards.map(item => <Col span={6} key={item.title}><AnalysisMetric {...item} /></Col>)}
        </Row>
      </Card>
      <Row gutter={16}>
        <Col span={14}>
          <Card className="pro-card analysis-panel">
            <Title heading={6}>内容发布比例</Title>
            <div className="stacked-chart">
              {['图文', '横版短视频', '竖版短视频', '直播', '其他'].map((label, index) => (
                <div className="stacked-row" key={label}>
                  <span>{label}</span>
                  <div>
                    <i style={{ width: `${42 + index * 9}%` }} />
                    <b style={{ width: `${16 + index * 3}%` }} />
                  </div>
                  <em>{(12650 - index * 1370).toLocaleString()}</em>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col span={10}>
          <Card className="pro-card analysis-panel author-table-card">
            <Title heading={6}>作者排行榜</Title>
            <Table rowKey="id" pagination={false} data={authorRecords} columns={authorColumns} />
          </Card>
        </Col>
      </Row>
      <Card className="pro-card analysis-panel">
        <Title heading={6}>内容发布时段</Title>
        <div className="period-chart">
          <div className="period-grid">
            <i />
            <i />
            <i />
            <i />
          </div>
          {chartValues.map((value, index) => (
            <div className="period-column" key={value}>
              <div className="period-bar published" style={{ height: `${value * 1.6}px` }} />
              <div className="period-bar clicks" style={{ height: `${value * 1.1}px` }} />
              <span>{`${String(index * 2).padStart(2, '0')}:00`}</span>
            </div>
          ))}
        </div>
        <div className="chart-legend">
          <span>
            <i className="legend-dot users" />
            发布量
          </span>
          <span>
            <i className="legend-dot requests" />
            点击量
          </span>
        </div>
      </Card>
    </Space>
  )
}

function AnalysisMetric({ title, count, diff, type, increment, values }: { title: string, count: number, diff: number, type: string, increment: boolean, values: number[] }) {
  return (
    <div className={`analysis-metric analysis-metric-${type}`}>
      <div className="analysis-metric-copy">
        <Statistic title={<Title heading={6}>{title}</Title>} value={count} groupSeparator />
        <Text type="secondary">较昨日</Text>
        <span className={increment ? 'positive-number' : 'negative-number'}>
          {diff}
          %
          {' '}
          {increment ? <IconArrowRise /> : <IconArrowFall />}
        </span>
      </div>
      <MiniChart type={type} values={values} />
    </div>
  )
}

function MiniChart({ type, values }: { type: string, values: number[] }) {
  if (type === 'pie') {
    return <div className="mini-donut"><i /></div>
  }
  return (
    <div className={`mini-chart mini-chart-${type}`}>
      {values.map(value => <i key={value} style={{ height: `${value}%` }} />)}
    </div>
  )
}
