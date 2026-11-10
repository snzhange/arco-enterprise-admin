import type { CurrentUser } from '@/api/generated/models'

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AuthProvider } from '@/app/auth'
import { AppSettingsProvider } from '@/app/settings'
import { AccountPending } from './AccountPending'

const pendingUser: CurrentUser = {
  id: '00000000-0000-4000-8000-000000000005',
  displayName: '待开通用户',
  email: 'pending@example.test',
  avatarUrl: null,
  permissions: [],
  roleCodes: ['default-user'],
  dataScope: 'self',
  contactUrl: 'https://example.test/contact-admin',
}

describe('account pending', () => {
  it('links the contact button to the configured url in a new tab', () => {
    render(<AppSettingsProvider><AuthProvider user={pendingUser}><AccountPending /></AuthProvider></AppSettingsProvider>)

    expect(screen.getByText('账号待开通')).toBeVisible()
    const link = screen.getByRole('link', { name: '联系管理员开通账号' })
    expect(link).toHaveAttribute('href', pendingUser.contactUrl)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('hides the contact button when no url is configured', () => {
    render(<AppSettingsProvider><AuthProvider user={{ ...pendingUser, contactUrl: null }}><AccountPending /></AuthProvider></AppSettingsProvider>)

    expect(screen.getByText('账号待开通')).toBeVisible()
    expect(screen.queryByRole('link', { name: '联系管理员开通账号' })).not.toBeInTheDocument()
  })
})
