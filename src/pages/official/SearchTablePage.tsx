import type { TableProps } from '@arco-design/web-react'
import type { ColumnProps } from '@arco-design/web-react/es/Table'

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
  Tag,
  Typography,
} from '@arco-design/web-react'
import { IconDownload, IconPlus } from '@arco-design/web-react/icon'
import { useMemo, useState } from 'react'
import { DataTable } from '@/components/data/DataTable'

import { QueryForm } from '@/components/data/QueryForm'
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

interface LocalSort {
  field: 'count'
  direction: 'asc' | 'desc'
}

function toArcoSortOrder(direction: LocalSort['direction'] | undefined): 'ascend' | 'descend' | undefined {
  if (direction === 'asc')
    return 'ascend'
  if (direction === 'desc')
    return 'descend'
  return undefined
}

export function SearchTablePage() {
  const [form] = Form.useForm<SearchValues>()
  const [createForm] = Form.useForm<Partial<ContentRecord>>()
  const [filters, setFilters] = useState<SearchValues>({})
  const [records, setRecords] = useState(contentRecords)
  const [createVisible, setCreateVisible] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [sort, setSort] = useState<LocalSort>()

  const filteredRecords = useMemo(() => records.filter((record) => {
    const matchId = !filters.id || record.id.includes(filters.id)
    const matchName = !filters.name || record.name.includes(filters.name)
    const matchContent = !filters.contentType?.length || filters.contentType.includes(record.contentType)
    const matchFilter = !filters.filterType?.length || filters.filterType.includes(record.filterType)
    const matchStatus = !filters.status?.length || filters.status.includes(record.status)
    return matchId && matchName && matchContent && matchFilter && matchStatus
  }), [filters, records])

  const sortedRecords = useMemo(() => {
    if (!sort)
      return filteredRecords

    return [...filteredRecords].sort((left, right) => {
      const result = left.count - right.count
      if (result !== 0)
        return sort.direction === 'asc' ? result : -result
      return left.id.localeCompare(right.id)
    })
  }, [filteredRecords, sort])

  const pagedRecords = useMemo(() => {
    const start = (page - 1) * pageSize
    return sortedRecords.slice(start, start + pageSize)
  }, [page, pageSize, sortedRecords])

  const columns = useMemo<ColumnProps<ContentRecord>[]>(() => [
    { title: '内容编号', dataIndex: 'id', width: 110 },
    { title: '内容名称', dataIndex: 'name', ellipsis: true },
    { title: '内容体裁', dataIndex: 'contentType', width: 130 },
    { title: '筛选方式', dataIndex: 'filterType', width: 120 },
    {
      title: '内容量',
      dataIndex: 'count',
      width: 100,
      sorter: true,
      sortOrder: sort?.field === 'count' ? toArcoSortOrder(sort.direction) : undefined,
    },
    { title: '创建时间', dataIndex: 'createdTime', width: 168 },
    { title: '状态', dataIndex: 'status', width: 110, render: (status: ContentRecord['status']) => <Tag color={status === '已上线' ? 'green' : 'gray'}>{status}</Tag> },
    { title: '操作', width: 100, render: () => <Button type="text" size="small">查看</Button> },
  ], [sort])

  const handleTableChange: NonNullable<TableProps<ContentRecord>['onChange']> = (_pagination, sorter) => {
    const activeSorter = Array.isArray(sorter) ? sorter[0] : sorter
    if (activeSorter?.field === 'count' && activeSorter.direction) {
      setSort({
        field: 'count',
        direction: activeSorter.direction === 'ascend' ? 'asc' : 'desc',
      })
    }
    else {
      setSort(undefined)
    }
    setPage(1)
  }

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
      setPage(1)
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
      <QueryForm<SearchValues>
        form={form}
        className="official-search-form"
        layout="vertical"
        expanded={expanded}
        expandable={false}
        onExpandedChange={setExpanded}
        onSubmit={(values) => {
          setFilters(values)
          setPage(1)
        }}
        onReset={() => {
          setFilters({})
          setPage(1)
        }}
        advancedChildren={(
          <Row gutter={24} className="official-search-fields">
            <Col span={8}><Form.Item label="筛选方式" field="filterType"><Select mode="multiple" allowClear placeholder="全部" options={['规则筛选', '人工']} /></Form.Item></Col>
            <Col span={8}><Form.Item label="创建时间" field="createdTime"><DatePicker.RangePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item label="状态" field="status"><Select mode="multiple" allowClear placeholder="全部" options={['已上线', '未上线']} /></Form.Item></Col>
          </Row>
        )}
      >
        <Row gutter={24} className="official-search-fields">
          <Col span={8}><Form.Item label="内容编号" field="id"><Input allowClear placeholder="请输入内容编号" /></Form.Item></Col>
          <Col span={8}><Form.Item label="内容名称" field="name"><Input allowClear placeholder="请输入内容名称" /></Form.Item></Col>
          <Col span={8}><Form.Item label="内容体裁" field="contentType"><Select mode="multiple" allowClear placeholder="全部" options={['图文', '横版短视频', '竖版短视频']} /></Form.Item></Col>
        </Row>
      </QueryForm>
      <div className="official-query-toggle">
        <Button type="text" onClick={() => setExpanded(value => !value)}>
          {expanded ? '收起筛选' : '展开筛选'}
        </Button>
      </div>

      <DataTable<ContentRecord>
        rowKey="id"
        columns={columns}
        data={pagedRecords}
        scroll={{ x: 1060 }}
        onTableChange={handleTableChange}
        toolbar={(
          <Space>
            <Button type="primary" icon={<IconPlus />} onClick={() => setCreateVisible(true)}>新建</Button>
            <Button>批量导入</Button>
          </Space>
        )}
        batchActions={<Button icon={<IconDownload />}>下载</Button>}
        pagination={{
          current: page,
          pageSize,
          total: sortedRecords.length,
          showTotal: true,
          sizeCanChange: true,
          onChange: (nextPage, nextPageSize) => {
            if (nextPageSize !== pageSize) {
              setPageSize(nextPageSize)
              setPage(1)
            }
            else {
              setPage(nextPage)
            }
          },
        }}
      />

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
