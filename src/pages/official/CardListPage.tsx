import type { CardRecord } from './data'

import {
  Button,
  Card,
  Grid,
  Input,
  Message,
  Modal,
  Radio,
  Space,
  Switch,
  Tabs,
  Tag,
  Typography,
} from '@arco-design/web-react'
import {
  IconApps,
  IconFile,
  IconList,
  IconMore,
  IconPlus,
  IconSettings,
  IconStorage,
} from '@arco-design/web-react/icon'
import { useMemo, useState } from 'react'

import { cardRecords } from './data'

const { Row, Col } = Grid
const { Title, Paragraph, Text } = Typography

type CardSection = 'quality' | 'service' | 'rules'

const sections: Array<{ key: CardSection, title: string, add?: boolean }> = [
  { key: 'quality', title: '内容质检', add: true },
  { key: 'service', title: '服务开通' },
  { key: 'rules', title: '规则预置' },
]

const cardIcons = {
  file: <IconFile />,
  settings: <IconSettings />,
  storage: <IconStorage />,
}

function expandRecords(records: CardRecord[], section: CardSection): CardRecord[] {
  return Array.from({ length: 10 }, (_, index) => {
    const source = records[index % records.length]
    return {
      ...source,
      id: `${section}-${source.id}-${index}`,
      title: section === 'quality' ? source.title : `${source.title} ${index + 1}`,
      type: section === 'quality' ? '内容质检' : section === 'service' ? '服务应用' : '规则预置',
    }
  })
}

export function CardListPage() {
  const [records, setRecords] = useState(cardRecords)
  const [keyword, setKeyword] = useState('')
  const [view, setView] = useState('card')
  const [activeTab, setActiveTab] = useState('all')
  const [createVisible, setCreateVisible] = useState(false)
  const [enabledOverrides, setEnabledOverrides] = useState<Record<string, boolean>>({})

  const sectionRecords = useMemo(() => Object.fromEntries(
    sections.map(section => [section.key, expandRecords(records, section.key)]),
  ) as Record<CardSection, CardRecord[]>, [records])

  const filterRecords = (items: CardRecord[]): CardRecord[] => items.filter(item => item.title.includes(keyword) || item.description.includes(keyword))

  const addCard = () => {
    const next: CardRecord = {
      id: `${Date.now()}`,
      title: '新建质检队列',
      description: '这是一个新创建的内容质检队列，可继续配置规则和权限。',
      type: '内容质检',
      icon: 'file',
      enabled: false,
    }
    setRecords(items => [next, ...items])
    setCreateVisible(false)
    Message.success('应用已创建')
  }

  const renderSection = (section: { key: CardSection, title: string, add?: boolean }) => {
    const items = filterRecords(sectionRecords[section.key])
    return (
      <section className="card-list-section" key={section.key}>
        <Title heading={6}>{section.title}</Title>
        <Row gutter={[24, 16]} className={view === 'list' ? 'card-list-grid list-view' : 'card-list-grid'}>
          {section.add && (
            <Col xs={24} sm={12} md={8} lg={6} xl={6}>
              <button className="add-card" type="button" onClick={() => setCreateVisible(true)}>
                <IconPlus />
                <span>创建质检内容队列</span>
              </button>
            </Col>
          )}
          {items.map(item => (
            <Col xs={24} sm={12} md={8} lg={6} xl={6} key={item.id}>
              <Card className={`application-card ${section.key}-application-card`} hoverable>
                <div className="application-card-header">
                  <span className="application-icon">{cardIcons[item.icon]}</span>
                  <Tag>{item.type}</Tag>
                  <Button type="text" icon={<IconMore />} aria-label="更多" />
                </div>
                <Title heading={6}>{item.title}</Title>
                <Paragraph type="secondary" ellipsis={{ rows: 2 }}>{item.description}</Paragraph>
                <div className="application-card-footer">
                  <Text type="secondary">{item.enabled ? '已启用' : '未启用'}</Text>
                  <Switch size="small" checked={enabledOverrides[item.id] ?? item.enabled} onChange={checked => setEnabledOverrides(current => ({ ...current, [item.id]: checked }))} />
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </section>
    )
  }

  return (
    <Card className="pro-card card-list-page">
      <div className="card-list-header">
        <Tabs activeTab={activeTab} onChange={setActiveTab}>
          <Tabs.TabPane key="all" title="全部" />
          <Tabs.TabPane key="quality" title="内容质检" />
          <Tabs.TabPane key="service" title="服务开通" />
          <Tabs.TabPane key="rules" title="规则预置" />
        </Tabs>
        <Space>
          <Input.Search allowClear value={keyword} onChange={setKeyword} placeholder="搜索" style={{ width: 240 }} />
          <Radio.Group type="button" value={view} onChange={setView}>
            <Radio value="card"><IconApps /></Radio>
            <Radio value="list"><IconList /></Radio>
          </Radio.Group>
        </Space>
      </div>
      <div className="card-list-sections">
        {activeTab === 'all' ? sections.map(renderSection) : renderSection(sections.find(section => section.key === activeTab) ?? sections[0])}
      </div>
      <Modal title="创建应用" visible={createVisible} onCancel={() => setCreateVisible(false)} onOk={addCard}>
        <Paragraph>将创建一个新的企业应用卡片，后续可继续配置权限和业务模块。</Paragraph>
      </Modal>
    </Card>
  )
}
