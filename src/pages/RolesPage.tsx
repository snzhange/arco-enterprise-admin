import type { DataScope, PermissionOption, RoleSummary } from '@/api/generated/models'

import {
  Button,
  Card,
  Checkbox,
  Message,
  Select,
  Space,
  Table,
  Typography,
} from '@arco-design/web-react'
import { IconSave, IconUndo } from '@arco-design/web-react/icon'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import {
  getListRolesQueryKey,
  useListPermissions,
  useListRoles,
  useUpdateRole,
} from '@/api/generated/admin-api'
import { getErrorMessage } from '@/api/http'
import { useAuth } from '@/app/auth'
import { hasPermission } from '@/app/permissions'
import { PERMISSIONS } from '@/app/permissions.constants'
import { Permission } from '@/components/Permission'

const { Title, Text } = Typography

const dataScopeLabels: Record<DataScope, string> = {
  all: '全部数据',
  department: '本部门数据',
  self: '本人数据',
}

interface RoleDraft {
  dataScope: DataScope
  permissions: string[]
}

interface PermissionGroup {
  name: string
  options: PermissionOption[]
}

function hasSamePermissions(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every(permission => right.includes(permission))
}

function isDraftEqualToRole(draft: RoleDraft, role: RoleSummary): boolean {
  return draft.dataScope === role.dataScope && hasSamePermissions(draft.permissions, role.permissions)
}

function buildPermissionGroups(role: RoleSummary, directory: PermissionOption[]): PermissionGroup[] {
  const knownCodes = new Set(directory.map(option => option.code))
  const unknownOptions = role.permissions
    .filter(permission => !knownCodes.has(permission))
    .map(code => ({ code, name: code, group: '未收录权限', assignable: false }))
  const groups = new Map<string, PermissionOption[]>()
  for (const option of [...directory, ...unknownOptions]) {
    const group = groups.get(option.group) ?? []
    group.push(option)
    groups.set(option.group, group)
  }
  return [...groups.entries()].map(([name, options]) => ({ name, options }))
}

export function RolesPage() {
  const user = useAuth()
  const canRead = hasPermission(user, PERMISSIONS.rolesRead)
  const rolesQuery = useListRoles({ query: { enabled: canRead } })
  const permissionsQuery = useListPermissions({ query: { enabled: canRead } })
  const updateRole = useUpdateRole()
  const queryClient = useQueryClient()
  const [drafts, setDrafts] = useState<Record<string, RoleDraft>>({})
  const [savingRoleCodes, setSavingRoleCodes] = useState<Set<string>>(() => new Set())
  const roles = useMemo(() => rolesQuery.data ?? [], [rolesQuery.data])
  const canEdit = hasPermission(user, PERMISSIONS.rolesWrite)
  const permissionDirectory = permissionsQuery.data ?? []
  const permissionDirectoryReady = !permissionsQuery.isPending
    && !permissionsQuery.isError
    && permissionDirectory.length > 0

  const getDraft = (role: RoleSummary): RoleDraft => drafts[role.code] ?? {
    dataScope: role.dataScope,
    permissions: role.permissions,
  }

  const updateDraft = (role: RoleSummary, patch: Partial<RoleDraft>): void => {
    setDrafts((current) => {
      const baseDraft = current[role.code] ?? {
        dataScope: role.dataScope,
        permissions: role.permissions,
      }
      const nextDraft = { ...baseDraft, ...patch }
      if (isDraftEqualToRole(nextDraft, role)) {
        const next = { ...current }
        delete next[role.code]
        return next
      }
      return { ...current, [role.code]: nextDraft }
    })
  }

  const updatePermissions = (role: RoleSummary, permissions: string[]): void => {
    const nextPermissions = permissions.includes('*') ? ['*'] : [...new Set(permissions)]
    updateDraft(role, { permissions: nextPermissions })
  }

  const updatePermissionGroup = (role: RoleSummary, group: PermissionGroup, selected: string[]): void => {
    const groupCodes = new Set(group.options.filter(option => option.assignable).map(option => option.code))
    const current = getDraft(role).permissions.filter(permission => !groupCodes.has(permission))
    updatePermissions(role, [...current, ...selected])
  }

  const cancelRole = (role: RoleSummary): void => {
    setDrafts((current) => {
      const next = { ...current }
      delete next[role.code]
      return next
    })
  }

  const saveRole = async (role: RoleSummary): Promise<void> => {
    if (!canEdit || !permissionDirectoryReady || !drafts[role.code] || savingRoleCodes.has(role.code))
      return

    const draft = getDraft(role)
    setSavingRoleCodes(current => new Set(current).add(role.code))
    try {
      await updateRole.mutateAsync({
        roleCode: role.code,
        data: { dataScope: draft.dataScope, permissions: draft.permissions },
      })
      await queryClient.invalidateQueries({ queryKey: getListRolesQueryKey() })
      setDrafts((current) => {
        const next = { ...current }
        delete next[role.code]
        return next
      })
      Message.success('角色权限已保存')
    }
    catch (error) {
      Message.error(getErrorMessage(error))
    }
    finally {
      setSavingRoleCodes((current) => {
        const next = new Set(current)
        next.delete(role.code)
        return next
      })
    }
  }

  const columns = [
    { title: '角色', dataIndex: 'name', width: 180, render: (value: string, role: RoleSummary) => (
      <div>
        <strong>{value}</strong>
        <Text type="secondary" style={{ display: 'block' }}>{role.code}</Text>
      </div>
    ) },
    {
      title: '权限',
      dataIndex: 'permissions',
      render: (_permissions: string[], role: RoleSummary) => {
        const draft = getDraft(role)
        const isSaving = savingRoleCodes.has(role.code)
        return (
          <Space direction="vertical" size="small" className="role-permission-group">
            {buildPermissionGroups(role, permissionDirectory).map((group) => {
              return (
                <div key={group.name}>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>{group.name}</Text>
                  <Checkbox.Group
                    value={draft.permissions}
                    disabled={!canEdit || isSaving || !permissionDirectoryReady}
                    options={group.options.map(option => ({
                      label: option.name,
                      value: option.code,
                      disabled: !option.assignable || (draft.permissions.includes('*') && option.code !== '*'),
                    }))}
                    onChange={permissions => updatePermissionGroup(role, group, permissions)}
                  />
                </div>
              )
            })}
          </Space>
        )
      },
    },
    {
      title: '数据范围',
      dataIndex: 'dataScope',
      width: 180,
      render: (_: DataScope, role: RoleSummary) => {
        const draft = getDraft(role)
        return <Select disabled={!canEdit || savingRoleCodes.has(role.code)} value={draft.dataScope} options={Object.entries(dataScopeLabels).map(([value, label]) => ({ value, label }))} onChange={value => updateDraft(role, { dataScope: value as DataScope })} />
      },
    },
    {
      title: '操作',
      width: 170,
      render: (_: unknown, role: RoleSummary) => (
        <Permission all={[PERMISSIONS.rolesWrite]} fallback={<Text type="secondary">只读</Text>}>
          <Space size="small">
            <Button
              type="text"
              size="small"
              icon={<IconUndo />}
              disabled={!drafts[role.code] || savingRoleCodes.has(role.code)}
              onClick={() => cancelRole(role)}
            >
              取消
            </Button>
            <Button
              type="text"
              size="small"
              icon={<IconSave />}
              loading={savingRoleCodes.has(role.code)}
              disabled={!drafts[role.code] || savingRoleCodes.has(role.code)}
              onClick={() => void saveRole(role)}
            >
              保存
            </Button>
          </Space>
        </Permission>
      ),
    },
  ]

  if (rolesQuery.isError || permissionsQuery.isError) {
    return (
      <div className="page-error" role="alert">
        <Title heading={4}>角色权限加载失败</Title>
        <Text type="secondary">角色或权限目录加载失败，请稍后重试。</Text>
      </div>
    )
  }

  if (!rolesQuery.isPending && !permissionsQuery.isPending && permissionDirectory.length === 0) {
    return (
      <div className="page-error" role="alert">
        <Title heading={4}>暂无权限目录</Title>
        <Text type="secondary">当前没有可用于角色编辑的权限目录。</Text>
      </div>
    )
  }

  return (
    <div className="page-container roles-page">
      <div className="page-heading">
        <div>
          <Text className="eyebrow">ACCESS CONTROL</Text>
          <Title heading={2}>角色与权限</Title>
          <Text type="secondary">统一管理角色、权限点和数据范围。</Text>
        </div>
      </div>
      <Card className="panel-card user-list-card">
        <Table<RoleSummary> rowKey="code" loading={rolesQuery.isPending || permissionsQuery.isPending} columns={columns} data={roles} pagination={false} />
      </Card>
    </div>
  )
}
