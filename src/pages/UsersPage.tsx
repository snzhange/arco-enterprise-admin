import type { TableProps } from '@arco-design/web-react'
import type { ColumnProps } from '@arco-design/web-react/es/Table'
import type {
  CreateUserRequest,
  ListUsersParams,
  RoleOption,
  UpdateUserRequest,
  User,
  UserStatus,
} from '@/api/generated/models'

import type { ListQueryStateOptions, ListSortDirection } from '@/hooks/useListQueryState'
import {
  Button,
  Card,
  Drawer,
  Form,
  Input,
  Message,
  Select,
  Space,
  Tag,
  Typography,
} from '@arco-design/web-react'
import { IconEye, IconPlus, IconUserAdd } from '@arco-design/web-react/icon'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { applyFieldErrors, getErrorMessage, isCancelledError, toApiError } from '@/api/errors'
import {
  getListUsersQueryKey,
  useCreateUser,
  useListRoleOptions,
  useListUsers,
  useUpdateUser,
} from '@/api/generated/admin-api'
import { useAuth } from '@/app/auth'
import { hasPermission } from '@/app/permissions'
import { PERMISSIONS } from '@/app/permissions.constants'
import { DataTable } from '@/components/data/DataTable'
import { DetailPanel } from '@/components/data/DetailPanel'
import { QueryForm } from '@/components/data/QueryForm'
import { CrudDrawer } from '@/components/form/CrudDrawer'
import { PageContainer } from '@/components/page/PageContainer'
import { PageForbiddenState } from '@/components/page/PageState'
import { useListQueryState } from '@/hooks/useListQueryState'

const { Text } = Typography

type UserSortField = 'name' | 'lastActiveAt'

interface UserFormValues {
  name?: CreateUserRequest['name']
  email?: CreateUserRequest['email']
  department?: CreateUserRequest['department']
  status?: UpdateUserRequest['status']
  roleCodes?: string[]
}

interface UserQueryValues {
  keyword?: string
  status?: UserStatus
}

const USER_LIST_STATE_OPTIONS: ListQueryStateOptions<'status', UserSortField> = {
  filterValues: {
    status: ['active', 'invited', 'disabled'],
  },
  sortFields: ['name', 'lastActiveAt'],
  defaultPageSize: 10,
  maxPageSize: 100,
}

const statusMeta: Record<UserStatus, { label: string, color: string }> = {
  active: { label: '正常', color: 'green' },
  invited: { label: '待激活', color: 'orange' },
  disabled: { label: '已停用', color: 'gray' },
}

function roleLabel(option: RoleOption | undefined, code: string): string {
  if (!option)
    return `未知角色（${code}）`
  return option.active ? option.name : `${option.name}（已停用）`
}

function formatLastActiveAt(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime()))
    return value

  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function toArcoSortOrder(direction: ListSortDirection | undefined): 'ascend' | 'descend' | undefined {
  if (direction === 'asc')
    return 'ascend'
  if (direction === 'desc')
    return 'descend'
  return undefined
}

export function UsersPage() {
  const user = useAuth()
  const canRead = hasPermission(user, PERMISSIONS.usersRead)
  const canEdit = hasPermission(user, PERMISSIONS.usersWrite)
  const [searchForm] = Form.useForm<UserQueryValues>()
  const [userForm] = Form.useForm<UserFormValues>()
  const [keyword, setKeyword] = useState('')
  const [selection, setSelection] = useState<{ context: string, keys: string[] }>({ context: '', keys: [] })
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editorVisible, setEditorVisible] = useState(false)
  const [detailUser, setDetailUser] = useState<User | null>(null)
  const [formErrorMessage, setFormErrorMessage] = useState('')
  const listState = useListQueryState(USER_LIST_STATE_OPTIONS)
  const queryClient = useQueryClient()

  useEffect(() => {
    searchForm.setFieldsValue({ status: listState.filters.status as UserStatus | undefined })
  }, [listState.filters.status, searchForm])

  const selectionContext = JSON.stringify([
    keyword,
    listState.filters.status,
    listState.page,
    listState.pageSize,
    listState.sort,
  ])
  const selectedRowKeys = selection.context === selectionContext ? selection.keys : []
  const setSelectedRowKeys = (keys: string[]) => setSelection({ context: selectionContext, keys })

  const params = useMemo<ListUsersParams>(() => ({
    page: listState.requestPage,
    size: listState.pageSize,
    keyword: keyword || undefined,
    status: listState.filters.status as UserStatus | undefined,
    sort: listState.sort ? `${listState.sort.field},${listState.sort.direction}` : undefined,
  }), [keyword, listState.filters.status, listState.pageSize, listState.requestPage, listState.sort])

  const usersQuery = useListUsers(params, {
    query: {
      placeholderData: previous => previous,
      enabled: canRead,
    },
  })
  const roleOptionsQuery = useListRoleOptions({
    query: {
      enabled: canRead && canEdit,
    },
  })
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()

  const roleDirectory = useMemo(() => roleOptionsQuery.data ?? [], [roleOptionsQuery.data])
  const roleDirectoryByCode = useMemo(
    () => new Map(roleDirectory.map(option => [option.code, option] as const)),
    [roleDirectory],
  )
  const formRoleOptions = useMemo(() => {
    const selectedCodes = new Set(editingUser?.roleCodes ?? [])
    const options = roleDirectory.map(option => ({
      label: roleLabel(option, option.code),
      value: option.code,
      disabled: !option.active,
    }))
    for (const code of selectedCodes) {
      if (!roleDirectoryByCode.has(code)) {
        options.push({
          label: roleLabel(undefined, code),
          value: code,
          disabled: true,
        })
      }
    }
    return options
  }, [editingUser?.roleCodes, roleDirectory, roleDirectoryByCode])

  const roleDirectoryReady = !roleOptionsQuery.isPending
    && !roleOptionsQuery.isError
    && roleDirectory.length > 0
  const usersForbidden = usersQuery.isError && toApiError(usersQuery.error).kind === 'forbidden'
  const data = usersQuery.data
  const currentPage = data && !usersQuery.isPlaceholderData ? data.page + 1 : listState.page
  const currentPageSize = data && !usersQuery.isPlaceholderData ? data.size : listState.pageSize

  const openCreate = useCallback(() => {
    setEditingUser(null)
    setFormErrorMessage('')
    userForm.resetFields()
    userForm.setFieldsValue({ roleCodes: [], status: 'active' })
    setEditorVisible(true)
  }, [userForm])

  const openEdit = useCallback((record: User) => {
    setEditingUser(record)
    setFormErrorMessage('')
    userForm.resetFields()
    userForm.setFieldsValue({
      name: record.name,
      email: record.email,
      department: record.department,
      status: record.status,
      roleCodes: record.roleCodes,
    })
    setEditorVisible(true)
  }, [userForm])

  const closeEditor = () => {
    setEditorVisible(false)
  }

  const submitUser = async () => {
    if (!roleDirectoryReady) {
      Message.error(roleOptionsQuery.isError ? '角色目录加载失败，请稍后重试' : '暂无可分配角色')
      return
    }

    let values: UserFormValues
    try {
      values = await userForm.validate()
    }
    catch {
      return
    }

    const name = values.name
    const email = values.email
    const department = values.department
    const roleCodes = values.roleCodes ?? []
    if (!name || !department || roleCodes.length === 0)
      return

    try {
      if (editingUser) {
        await updateUser.mutateAsync({
          userId: editingUser.id,
          data: {
            name,
            department,
            status: values.status,
            roleCodes,
          },
        })
        Message.success('用户信息已更新')
      }
      else {
        if (!email)
          return
        await createUser.mutateAsync({
          data: {
            name,
            email,
            department,
            roleCodes,
          },
        })
        Message.success('用户已创建')
      }
      await queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() })
      closeEditor()
    }
    catch (error) {
      const apiError = toApiError(error)
      if (apiError.kind === 'unauthenticated' || isCancelledError(apiError))
        return
      const detail = applyFieldErrors(userForm, error)
      setFormErrorMessage(detail || getErrorMessage(error))
      if (!detail)
        Message.error(getErrorMessage(error))
    }
  }

  const columns = useMemo<ColumnProps<User>[]>(() => [
    {
      title: '用户',
      dataIndex: 'name',
      width: 220,
      sorter: true,
      sortOrder: listState.sort?.field === 'name' ? toArcoSortOrder(listState.sort.direction) : undefined,
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
      dataIndex: 'roleCodes',
      render: (roleCodes: string[]) => (
        <Space wrap>
          {roleCodes.map(code => (
            <Tag key={code} color="arcoblue" bordered={false}>
              {canEdit ? roleLabel(roleDirectoryByCode.get(code), code) : code}
            </Tag>
          ))}
        </Space>
      ),
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
      sorter: true,
      sortOrder: listState.sort?.field === 'lastActiveAt' ? toArcoSortOrder(listState.sort.direction) : undefined,
      render: (value: string) => <Text type="secondary">{formatLastActiveAt(value)}</Text>,
    },
    {
      title: '操作',
      width: canEdit ? 140 : 74,
      render: (_: unknown, record: User) => (
        <Space size="mini">
          <Button type="text" size="small" icon={<IconEye />} onClick={() => setDetailUser(record)}>查看</Button>
          {canEdit && <Button type="text" size="small" onClick={() => openEdit(record)}>编辑</Button>}
        </Space>
      ),
    },
  ], [canEdit, listState.sort, openEdit, roleDirectoryByCode])

  const detailItems = useMemo(() => {
    if (!detailUser)
      return []

    return [
      { key: 'name', label: '姓名', value: detailUser.name },
      { key: 'email', label: '工作邮箱', value: detailUser.email },
      { key: 'department', label: '部门', value: detailUser.department },
      { key: 'status', label: '状态', value: <Tag color={statusMeta[detailUser.status].color}>{statusMeta[detailUser.status].label}</Tag> },
      {
        key: 'roles',
        label: '角色',
        span: 2,
        value: (
          <Space wrap>
            {detailUser.roleCodes.map(code => (
              <Tag key={code} color="arcoblue" bordered={false}>
                {canEdit ? roleLabel(roleDirectoryByCode.get(code), code) : code}
              </Tag>
            ))}
          </Space>
        ),
      },
      { key: 'lastActiveAt', label: '最近活跃', value: formatLastActiveAt(detailUser.lastActiveAt) },
    ]
  }, [canEdit, detailUser, roleDirectoryByCode])

  const handleTableChange: NonNullable<TableProps<User>['onChange']> = (_pagination, sorter) => {
    const activeSorter = Array.isArray(sorter) ? sorter[0] : sorter
    const field = activeSorter?.field
    if ((field === 'name' || field === 'lastActiveAt') && activeSorter.direction) {
      listState.setSort({
        field,
        direction: activeSorter.direction === 'ascend' ? 'asc' : 'desc',
      })
      return
    }
    listState.setSort()
  }

  const pageActions = canEdit
    ? <Button type="primary" icon={<IconPlus />} onClick={openCreate}>新增用户</Button>
    : undefined

  if (!canRead || usersForbidden) {
    return (
      <PageContainer
        className="users-page"
        eyebrow="TEAM DIRECTORY"
        title="用户管理"
        description="管理团队成员、角色与访问状态。"
        actions={pageActions}
      >
        <PageForbiddenState
          title={!canRead ? '无权查看用户' : '没有查看用户的权限'}
          description="请联系管理员申请 users:read 权限。"
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer
      className="users-page"
      eyebrow="TEAM DIRECTORY"
      title="用户管理"
      description="管理团队成员、角色与访问状态。"
      actions={pageActions}
    >
      <Card className="panel-card user-list-card">
        <QueryForm<UserQueryValues>
          form={searchForm}
          className="search-toolbar"
          loading={usersQuery.isFetching}
          onSubmit={(values) => {
            setKeyword(values.keyword?.trim() ?? '')
            listState.setFilters({ status: values.status })
          }}
          onReset={() => {
            setKeyword('')
            listState.reset()
          }}
        >
          <Form.Item field="keyword" label="关键词">
            <Input allowClear placeholder="姓名或邮箱" style={{ width: 240 }} />
          </Form.Item>
          <Form.Item field="status" label="状态">
            <Select
              allowClear
              placeholder="全部状态"
              options={Object.entries(statusMeta).map(([value, meta]) => ({ value, label: meta.label }))}
              style={{ width: 150 }}
            />
          </Form.Item>
        </QueryForm>

        <DataTable<User>
          className="users-data-table"
          rowKey="id"
          columns={columns}
          data={data?.content ?? []}
          loading={usersQuery.isPending || usersQuery.isFetching}
          error={usersQuery.isError ? usersQuery.error : undefined}
          onRetry={() => void usersQuery.refetch()}
          onRefresh={() => void usersQuery.refetch()}
          onTableChange={handleTableChange}
          toolbar={(
            <>
              <Text type="secondary">共 </Text>
              <strong>{data?.totalElements ?? 0}</strong>
              <Text type="secondary"> 位成员</Text>
            </>
          )}
          batchActions={selectedRowKeys.length > 0
            ? (
                <Text type="secondary">
                  已选择
                  {selectedRowKeys.length}
                  {' '}
                  人
                </Text>
              )
            : undefined}
          rowSelection={{
            selectedRowKeys,
            onChange: keys => setSelectedRowKeys(keys.map(String)),
          }}
          pagination={{
            current: currentPage,
            pageSize: currentPageSize,
            total: data?.totalElements ?? 0,
            showTotal: true,
            sizeCanChange: true,
            sizeOptions: [5, 10, 20, 50, 100],
            onChange: (nextPage, nextPageSize) => {
              if (nextPageSize !== listState.pageSize)
                listState.setPageSize(nextPageSize)
              else
                listState.setPage(nextPage)
            },
          }}
        />
      </Card>

      <Drawer
        visible={Boolean(detailUser)}
        title="用户详情"
        width={460}
        footer={null}
        onCancel={() => setDetailUser(null)}
        closable
        maskClosable
        unmountOnExit
      >
        <DetailPanel items={detailItems} />
      </Drawer>

      <CrudDrawer
        visible={editorVisible}
        title={editingUser ? '编辑用户' : '新增用户'}
        onCancel={closeEditor}
        onConfirm={submitUser}
        confirmLoading={createUser.isPending || updateUser.isPending}
        confirmDisabled={!roleDirectoryReady}
        afterClose={() => {
          userForm.resetFields()
          setEditingUser(null)
          setFormErrorMessage('')
        }}
      >
        <Form form={userForm} layout="vertical">
          {formErrorMessage && <div className="form-error" role="alert">{formErrorMessage}</div>}
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
          <Form.Item field="roleCodes" label="角色" rules={[{ required: true, message: '至少选择一个角色' }]}>
            <Select
              mode="multiple"
              loading={roleOptionsQuery.isPending}
              disabled={!roleDirectoryReady}
              options={formRoleOptions}
              placeholder={roleOptionsQuery.isError ? '角色目录加载失败' : '选择角色'}
            />
          </Form.Item>
          {roleOptionsQuery.isError && <Text type="secondary">角色目录加载失败，请稍后重试。</Text>}
          {!roleOptionsQuery.isPending && !roleOptionsQuery.isError && roleDirectory.length === 0 && <Text type="secondary">暂无可分配角色。</Text>}
          {editingUser && (
            <Form.Item field="status" label="状态">
              <Select options={Object.entries(statusMeta).map(([value, meta]) => ({ value, label: meta.label }))} />
            </Form.Item>
          )}
        </Form>
      </CrudDrawer>
    </PageContainer>
  )
}
