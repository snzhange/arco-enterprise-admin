import type {
  CreateUserRequest,
  UpdateUserRequest,
  User,
  UserStatus,
} from '@/api/generated/models'

import {
  Button,
  Card,
  Form,
  Input,
  Message,
  Modal,
  Pagination,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from '@arco-design/web-react'
import { IconPlus, IconRefresh, IconSearch, IconUserAdd } from '@arco-design/web-react/icon'
import { useQueryClient } from '@tanstack/react-query'

import { useMemo, useState } from 'react'
import {
  getListUsersQueryKey,
  useCreateUser,
  useListUsers,
  useUpdateUser,
} from '@/api/generated/admin-api'
import { getErrorMessage } from '@/api/http'
import { useAuth } from '@/app/auth'
import { hasPermission } from '@/app/permissions'
import { PERMISSIONS } from '@/app/permissions.constants'
import { Permission } from '@/components/Permission'

const { Title, Text } = Typography

type UserFormValues = CreateUserRequest & UpdateUserRequest

const roleOptions = [
  { label: '管理员', value: '管理员' },
  { label: '运营', value: '运营' },
  { label: '财务', value: '财务' },
  { label: '审计员', value: '审计员' },
]

const statusMeta: Record<UserStatus, { label: string, color: string }> = {
  active: { label: '正常', color: 'green' },
  invited: { label: '待激活', color: 'orange' },
  disabled: { label: '已停用', color: 'gray' },
}

export function UsersPage() {
  const user = useAuth()
  const canRead = hasPermission(user, 'users:read')
  const [searchForm] = Form.useForm<{ keyword?: string, status?: UserStatus }>()
  const [userForm] = Form.useForm<UserFormValues>()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filters, setFilters] = useState<{ keyword?: string, status?: UserStatus }>({})
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [modalVisible, setModalVisible] = useState(false)

  const queryClient = useQueryClient()
  const params = useMemo(() => ({
    page: page - 1,
    size: pageSize,
    keyword: filters.keyword || undefined,
    status: filters.status,
  }), [filters.keyword, filters.status, page, pageSize])
  const usersQuery = useListUsers(params, {
    query: {
      placeholderData: previous => previous,
      enabled: canRead,
    },
  })
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()

  const openCreate = () => {
    setEditingUser(null)
    userForm.resetFields()
    setModalVisible(true)
  }

  const openEdit = (user: User) => {
    setEditingUser(user)
    userForm.setFieldsValue({
      name: user.name,
      email: user.email,
      department: user.department,
      status: user.status,
      roles: user.roles,
    })
    setModalVisible(true)
  }

  const submitUser = async () => {
    let values: UserFormValues
    try {
      values = await userForm.validate()
    }
    catch {
      return
    }

    try {
      if (editingUser) {
        await updateUser.mutateAsync({
          userId: editingUser.id,
          data: {
            name: values.name,
            department: values.department,
            status: values.status,
            roles: values.roles,
          },
        })
        Message.success('用户信息已更新')
      }
      else {
        await createUser.mutateAsync({
          data: {
            name: values.name,
            email: values.email,
            department: values.department,
            roles: values.roles,
          },
        })
        Message.success('用户已创建')
      }
      await queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() })
      setModalVisible(false)
    }
    catch (error) {
      Message.error(getErrorMessage(error))
    }
  }

  const data = usersQuery.data
  const columns = [
    {
      title: '用户',
      dataIndex: 'name',
      width: 220,
      render: (_: unknown, record: User) => (
        <div className="user-cell">
          <div className="table-avatar">{record.name.slice(0, 1)}</div>
          <div>
            <strong>{record.name}</strong>
            <small>{record.email}</small>
          </div>
        </div>
      ),
    },
    { title: '部门', dataIndex: 'department', width: 150 },
    {
      title: '角色',
      dataIndex: 'roles',
      render: (roles: string[]) => <Space wrap>{roles.map(role => <Tag key={role} color="arcoblue" bordered={false}>{role}</Tag>)}</Space>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 120,
      render: (status: UserStatus) => <Tag color={statusMeta[status].color} bordered={false}>{statusMeta[status].label}</Tag>,
    },
    {
      title: '最近活跃',
      dataIndex: 'lastActiveAt',
      width: 170,
      render: (value: string) => <Text type="secondary">{new Date(value).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>,
    },
    {
      title: '操作',
      width: 90,
      render: (_: unknown, record: User) => (
        <Permission all={[PERMISSIONS.usersWrite]} fallback={<Text type="secondary">只读</Text>}>
          <Button type="text" size="small" onClick={() => openEdit(record)}>编辑</Button>
        </Permission>
      ),
    },
  ]

  if (!canRead) {
    return (
      <div className="page-container users-page">
        <div className="page-error" role="alert">
          <Title heading={4}>无权查看用户</Title>
          <Text type="secondary">请联系管理员申请 users:read 权限。</Text>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container users-page">
      <div className="page-heading">
        <div>
          <Text className="eyebrow">TEAM DIRECTORY</Text>
          <Title heading={2}>用户管理</Title>
          <Text type="secondary">管理团队成员、角色与访问状态。</Text>
        </div>
        <Permission all={[PERMISSIONS.usersWrite]}>
          <Button type="primary" icon={<IconPlus />} onClick={openCreate}>新增用户</Button>
        </Permission>
      </div>

      <Card className="panel-card user-list-card">
        <Form
          form={searchForm}
          layout="inline"
          className="search-toolbar"
          onSubmit={(values) => {
            setPage(1)
            setFilters(values)
          }}
        >
          <Form.Item field="keyword" label="关键词">
            <Input allowClear placeholder="姓名或邮箱" prefix={<IconSearch />} style={{ width: 240 }} />
          </Form.Item>
          <Form.Item field="status" label="状态">
            <Select allowClear placeholder="全部状态" options={Object.entries(statusMeta).map(([value, meta]) => ({ value, label: meta.label }))} style={{ width: 150 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<IconSearch />}>查询</Button>
              <Button
                icon={<IconRefresh />}
                onClick={() => {
                  searchForm.resetFields()
                  setFilters({})
                  setPage(1)
                }}
              >
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
        <div className="table-toolbar">
          <div>
            <Text type="secondary">共 </Text>
            <strong>{data?.totalElements ?? 0}</strong>
            <Text type="secondary"> 位成员</Text>
          </div>
          {selectedRowKeys.length > 0 && (
            <Text type="secondary">
              已选择
              {selectedRowKeys.length}
              {' '}
              人
            </Text>
          )}
        </div>
        <Table<User>
          rowKey="id"
          loading={usersQuery.isPending}
          columns={columns}
          data={data?.content ?? []}
          border={false}
          stripe
          rowSelection={{
            selectedRowKeys,
            onChange: keys => setSelectedRowKeys(keys.map(String)),
          }}
          pagination={false}
        />
        <div className="table-pagination">
          <Pagination
            current={page}
            pageSize={pageSize}
            total={data?.totalElements ?? 0}
            showTotal
            sizeCanChange
            onChange={(nextPage, nextPageSize) => {
              setPage(nextPage)
              setPageSize(nextPageSize)
            }}
          />
        </div>
      </Card>

      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={submitUser}
        confirmLoading={createUser.isPending || updateUser.isPending}
        okText="保存"
        cancelText="取消"
        unmountOnExit
      >
        <Form form={userForm} layout="vertical" initialValues={{ roles: [], status: 'active' }}>
          <Form.Item field="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }, { minLength: 2, message: '姓名至少 2 个字符' }]}>
            <Input prefix={<IconUserAdd />} placeholder="例如：林晓" />
          </Form.Item>
          {!editingUser && (
            <Form.Item field="email" label="工作邮箱" rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '请输入有效邮箱' }]}>
              <Input placeholder="name@company.com" />
            </Form.Item>
          )}
          <Form.Item field="department" label="部门" rules={[{ required: true, message: '请输入部门' }]}>
            <Input placeholder="例如：产品与运营部" />
          </Form.Item>
          <Form.Item field="roles" label="角色" rules={[{ required: true, message: '至少选择一个角色' }]}>
            <Select mode="multiple" options={roleOptions} placeholder="选择角色" />
          </Form.Item>
          {editingUser && (
            <Form.Item field="status" label="状态">
              <Select options={Object.entries(statusMeta).map(([value, meta]) => ({ value, label: meta.label }))} />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  )
}
