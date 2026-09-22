import type { ContentRecord } from './data'

import {
  Button,
  Card,
  DatePicker,
  Form,
  Grid,
  Input,
  Message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from '@arco-design/web-react'
import {
  IconDownload,
  IconPlus,
  IconRefresh,
  IconSearch,
} from '@arco-design/web-react/icon'
import { useMemo, useState } from 'react'

import { contentRecords } from './data'

const { Row, Col } = Grid
const { Title } = Typography

interface SearchValues {
  id?: string
  name?: string
  contentType?: string[]
  filterType?: string[]
  createdTime?: string[]
  status?: string[]
}

export function SearchTablePage() {
  const [form] = Form.useForm<SearchValues>()
  const [createForm] = Form.useForm<Partial<ContentRecord>>()
  const [filters, setFilters] = useState<SearchValues>({})
  const [records, setRecords] = useState(contentRecords)
  const [createVisible, setCreateVisible] = useState(false)

  const data = useMemo(() => records.filter((record) => {
    const matchId = !filters.id || record.id.includes(filters.id)
    const matchName = !filters.name || record.name.includes(filters.name)
    const matchContent = !filters.contentType?.length || filters.contentType.includes(record.contentType)
    const matchFilter = !filters.filterType?.length || filters.filterType.includes(record.filterType)
    const matchStatus = !filters.status?.length || filters.status.includes(record.status)
    return matchId && matchName && matchContent && matchFilter && matchStatus
  }), [filters, records])

  const columns = [
    { title: '内容编号', dataIndex: 'id', width: 110 },
    { title: '内容名称', dataIndex: 'name', ellipsis: true },
    { title: '内容体裁', dataIndex: 'contentType', width: 130 },
    { title: '筛选方式', dataIndex: 'filterType', width: 120 },
    { title: '内容量', dataIndex: 'count', width: 100, sorter: (a: ContentRecord, b: ContentRecord) => a.count - b.count },
    { title: '创建时间', dataIndex: 'createdTime', width: 168 },
    { title: '状态', dataIndex: 'status', width: 110, render: (status: ContentRecord['status']) => <Tag color={status === '已上线' ? 'green' : 'gray'}>{status}</Tag> },
    { title: '操作', width: 100, render: () => <Button type="text" size="small">查看</Button> },
  ]

  const createRecord = async () => {
    try {
      const value = await createForm.validate()
      setRecords(items => [{
        id: `000${items.length + 1}`,
        name: value.name || '',
        contentType: value.contentType || '图文',
        filterType: value.filterType || '人工',
        count: 0,
        createdTime: new Date().toLocaleString('zh-CN'),
        status: '未上线',
      }, ...items])
      setCreateVisible(false)
      createForm.resetFields()
      Message.success('内容已创建')
    }
    catch {
      // Field errors are rendered by Arco Form.
    }
  }

  return (
    <Card className="pro-card search-table-page">
      <Title heading={6}>查询表格</Title>
      <div className="official-search-wrapper">
        <Form form={form} className="official-search-form" labelAlign="left">
          <Row gutter={24}>
            <Col span={8}><Form.Item label="内容编号" field="id"><Input allowClear placeholder="请输入内容编号" /></Form.Item></Col>
            <Col span={8}><Form.Item label="内容名称" field="name"><Input allowClear placeholder="请输入内容名称" /></Form.Item></Col>
            <Col span={8}><Form.Item label="内容体裁" field="contentType"><Select mode="multiple" allowClear placeholder="全部" options={['图文', '横版短视频', '竖版短视频']} /></Form.Item></Col>
            <Col span={8}><Form.Item label="筛选方式" field="filterType"><Select mode="multiple" allowClear placeholder="全部" options={['规则筛选', '人工']} /></Form.Item></Col>
            <Col span={8}><Form.Item label="创建时间" field="createdTime"><DatePicker.RangePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item label="状态" field="status"><Select mode="multiple" allowClear placeholder="全部" options={['已上线', '未上线']} /></Form.Item></Col>
          </Row>
        </Form>
        <div className="official-search-actions">
          <Button type="primary" icon={<IconSearch />} onClick={async () => setFilters(await form.validate())}>查询</Button>
          <Button
            icon={<IconRefresh />}
            onClick={() => {
              form.resetFields()
              setFilters({})
            }}
          >
            重置
          </Button>
        </div>
      </div>
      <div className="official-table-toolbar">
        <Space>
          <Button type="primary" icon={<IconPlus />} onClick={() => setCreateVisible(true)}>新建</Button>
          <Button>批量导入</Button>
        </Space>
        <Button icon={<IconDownload />}>下载</Button>
      </div>
      <Table rowKey="id" data={data} columns={columns} pagination={{ pageSize: 5, showTotal: true, sizeCanChange: true }} scroll={{ x: 1060 }} />
      <Modal title="新建内容" visible={createVisible} onCancel={() => setCreateVisible(false)} onOk={createRecord} unmountOnExit>
        <Form form={createForm} layout="vertical">
          <Form.Item label="内容名称" field="name" rules={[{ required: true, message: '请输入内容名称' }]}><Input /></Form.Item>
          <Form.Item label="内容体裁" field="contentType" initialValue="图文"><Select options={['图文', '横版短视频', '竖版短视频']} /></Form.Item>
          <Form.Item label="筛选方式" field="filterType" initialValue="人工"><Select options={['规则筛选', '人工']} /></Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
