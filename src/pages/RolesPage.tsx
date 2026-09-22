import type { DataScope, RoleSummary } from '@/api/generated/models'

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

import { getListRolesQueryKey, useListRoles, useUpdateRole } from '@/api/generated/admin-api'
import { getErrorMessage } from '@/api/http'
import { useAuth } from '@/app/auth'
import { hasPermission } from '@/app/permissions'
import { PERMISSION_OPTIONS, PERMISSIONS } from '@/app/permissions.constants'
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

function hasSamePermissions(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every(permission => right.includes(permission))
}

function isDraftEqualToRole(draft: RoleDraft, role: RoleSummary): boolean {
  return draft.dataScope === role.dataScope && hasSamePermissions(draft.permissions, role.permissions)
}

export function RolesPage() {
  const user = useAuth()
  const rolesQuery = useListRoles()
  const updateRole = useUpdateRole()
  const queryClient = useQueryClient()
  const [drafts, setDrafts] = useState<Record<string, RoleDraft>>({})
  const [savingRoleCodes, setSavingRoleCodes] = useState<Set<string>>(() => new Set())
  const roles = useMemo(() => rolesQuery.data ?? [], [rolesQuery.data])
  const canEdit = hasPermission(user, PERMISSIONS.rolesWrite)

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
    const nextPermissions = permissions.includes('*') ? ['*'] : permissions
    updateDraft(role, { permissions: nextPermissions })
  }

  const cancelRole = (role: RoleSummary): void => {
    setDrafts((current) => {
      const next = { ...current }
      delete next[role.code]
      return next
    })
  }

  const saveRole = async (role: RoleSummary): Promise<void> => {
    if (!canEdit || !drafts[role.code] || savingRoleCodes.has(role.code))
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
          <Checkbox.Group
            className="role-permission-group"
            value={draft.permissions}
            disabled={!canEdit || isSaving}
            options={PERMISSION_OPTIONS.map(option => ({
              ...option,
              disabled: option.value !== '*' && draft.permissions.includes('*'),
            }))}
            onChange={permissions => updatePermissions(role, permissions)}
          />
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

  if (rolesQuery.isError) {
    return (
      <div className="page-error" role="alert">
        <Title heading={4}>角色权限加载失败</Title>
        <Text type="secondary">请稍后重试。</Text>
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
        <Table<RoleSummary> rowKey="code" loading={rolesQuery.isPending} columns={columns} data={roles} pagination={false} />
      </Card>
    </div>
  )
}
