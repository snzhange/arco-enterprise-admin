import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel('工作邮箱').fill('admin@arco.dev')
  await page.getByLabel('密码').fill('admin1234')
  await page.getByRole('button', { name: '登录工作台' }).click()
  await expect(page).toHaveURL(/dashboard/)
}

async function loginAsOperator(page: Page) {
  await loginAs(page, 'operator@arco.dev', 'operator1234')
}

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByRole('textbox', { name: '工作邮箱' }).fill(email)
  await page.locator('#password_input').fill(password)
  await page.getByRole('button', { name: '登录工作台' }).click()
  await expect(page).toHaveURL(/dashboard/)
}

test('logs in, collapses navigation and creates list content', async ({ page }) => {
  await login(page)

  await expect(page.getByText('线上总数据').first()).toBeVisible()
  await page.screenshot({ path: 'test-results/dashboard-expanded.png' })

  const layoutContent = page.locator('.layout-content')
  await expect(layoutContent).toHaveCSS('padding-left', '220px')
  await page.getByRole('button', { name: '收起侧栏' }).click()
  await expect(page.getByRole('button', { name: '展开侧栏' })).toBeVisible()
  await expect(layoutContent).toHaveCSS('padding-left', '48px')
  await page.screenshot({ path: 'test-results/dashboard-collapsed.png' })
  await page.getByRole('button', { name: '展开侧栏' }).click()
  await expect(layoutContent).toHaveCSS('padding-left', '220px')

  await page.getByText('列表页', { exact: true }).click()
  await page.getByText('查询表格', { exact: true }).click()
  await expect(page).toHaveURL(/list\/search-table/)

  await page.getByRole('button', { name: '新建' }).click()
  await page.getByLabel('内容名称').last().fill('测试内容')
  await page.getByRole('button', { name: '确定' }).click()
  await expect(page.getByText('测试内容')).toBeVisible()
})

test('automatically collapses the sider below the xl breakpoint', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 700 })
  await login(page)

  const sider = page.locator('.layout-sider')
  const layoutContent = page.locator('.layout-content')
  await expect(sider).toHaveCSS('width', '48px')
  await expect(layoutContent).toHaveCSS('padding-left', '48px')
  await expect(page.getByRole('button', { name: '展开侧栏' })).toBeVisible()
  await page.screenshot({ path: 'test-results/dashboard-mobile-breakpoint.png' })
})

test('opens every official Arco Design Pro route', async ({ page }) => {
  test.setTimeout(60_000)
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await login(page)

  const groups = [
    { label: '仪表盘', pages: [['工作台', '/dashboard/workplace'], ['实时监控', '/dashboard/monitor']] },
    { label: '数据可视化', pages: [['数据分析', '/visualization/data-analysis'], ['多维数据分析', '/visualization/multi-dimension-data-analysis']] },
    { label: '列表页', pages: [['查询表格', '/list/search-table'], ['卡片列表', '/list/card']] },
    { label: '表单页', pages: [['分组表单', '/form/group'], ['分步表单', '/form/step']] },
    { label: '详情页', pages: [['基础详情页', '/profile/basic']] },
    { label: '结果页', pages: [['成功页', '/result/success'], ['失败页', '/result/error']] },
    { label: '异常页', pages: [['403', '/exception/403'], ['404', '/exception/404'], ['500', '/exception/500']] },
    { label: '个人中心', pages: [['用户信息', '/user/info'], ['用户设置', '/user/setting']] },
    { label: '系统管理', pages: [['角色与权限', '/roles']] },
  ] as const

  const menu = page.locator('.app-menu')
  for (const group of groups) {
    const firstChild = menu.getByText(group.pages[0][0], { exact: true })
    if (!await firstChild.isVisible()) {
      await menu.getByText(group.label, { exact: true }).click()
    }
    for (const [label, path] of group.pages) {
      await menu.getByText(label, { exact: true }).click()
      await expect(page).toHaveURL(new RegExp(path.replaceAll('/', '\\/')))
      await expect(page.locator('.route-loading')).toBeHidden()
      await expect(page.locator('.app-content')).not.toBeEmpty()
    }
  }

  expect(errors).toEqual([])
})

test('preserves redirects, hidden routes, 404 fallback and breadcrumb metadata', async ({ page }) => {
  await login(page)

  await page.goto('/')
  await expect(page).toHaveURL(/dashboard\/workplace/)
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/dashboard\/workplace/)

  await page.goto('/welcome')
  await expect(page.getByText('欢迎使用 Arco Design Pro', { exact: true })).toBeVisible()
  await expect(page.locator('.app-menu').getByText('Welcome', { exact: true })).toBeHidden()

  await page.goto('/result/success')
  await expect(page.locator('.layout-breadcrumb')).toBeHidden()
  await page.goto('/profile/basic')
  await expect(page.locator('.layout-breadcrumb')).toBeVisible()

  await page.goto('/route-that-does-not-exist')
  await expect(page.getByText('页面不存在', { exact: true })).toBeVisible()
})

test('persists the mock session and exposes official global controls', async ({ page }) => {
  await login(page)
  await page.reload()
  await expect(page).toHaveURL(/dashboard\/workplace/)

  await page.getByLabel('页面配置').click()
  await expect(page.getByText('主题色', { exact: true })).toBeVisible()
  await expect(page.getByText('菜单宽度 (px)', { exact: true })).toBeVisible()

  await page.getByRole('radio', { name: '#14C9C9' }).click()
  await page.getByRole('button', { name: '关闭' }).click()
  await page.getByRole('button', { name: 'Language' }).hover()
  await page.getByText('English', { exact: true }).click()
  await expect(page.getByRole('main').getByText('Dashboard', { exact: true })).toBeVisible()
})

test('filters operator navigation and guards restricted role routes', async ({ page }) => {
  await loginAsOperator(page)
  await page.getByText('系统管理', { exact: true }).click()
  await expect(page.getByText('用户管理', { exact: true })).toBeVisible()
  await expect(page.getByText('角色与权限', { exact: true })).toBeHidden()

  await page.goto('/roles')
  await expect(page.getByText('抱歉，你没有权限访问该页面。', { exact: true })).toBeVisible()
})

test('keeps list permission aligned between menu and direct access', async ({ page }) => {
  await loginAs(page, 'list-reader@arco.dev', 'listreader1234')

  await page.getByText('列表页', { exact: true }).click()
  await expect(page.getByText('查询表格', { exact: true })).toBeVisible()
  await page.getByText('查询表格', { exact: true }).click()
  await expect(page).toHaveURL(/list\/search-table/)
  await expect(page.getByRole('heading', { name: '查询表格' })).toBeVisible()

  await page.goto('/dashboard/workplace')
  await expect(page.getByText('抱歉，你没有权限访问该页面。', { exact: true })).toBeVisible()
})

test('keeps user permission aligned between menu and direct access', async ({ page }) => {
  await loginAs(page, 'user-reader@arco.dev', 'userreader1234')

  await page.getByText('个人中心', { exact: true }).click()
  await expect(page.getByText('用户信息', { exact: true })).toBeVisible()
  await page.getByText('用户信息', { exact: true }).click()
  await expect(page).toHaveURL(/user\/info/)
  await expect(page.getByText('我的项目', { exact: true })).toBeVisible()

  await page.goto('/dashboard/workplace')
  await expect(page.getByText('抱歉，你没有权限访问该页面。', { exact: true })).toBeVisible()
})

test('edits and persists a role permission', async ({ page }) => {
  await login(page)
  await page.getByText('系统管理', { exact: true }).click()
  await page.getByText('角色与权限', { exact: true }).click()
  await expect(page).toHaveURL(/roles/)

  const operatorRow = page.locator('.arco-table-tr').filter({ hasText: '运营人员' })
  const auditCheckbox = operatorRow.getByRole('checkbox', { name: '查看审计日志' })
  await operatorRow.getByText('查看审计日志', { exact: true }).click()
  await expect(auditCheckbox).toBeChecked()
  await operatorRow.getByRole('button', { name: '保存' }).click()
  await expect(page.getByText('角色权限已保存')).toBeVisible()
  await page.reload()
  await expect(page.locator('.arco-table-tr').filter({ hasText: '运营人员' }).getByRole('checkbox', { name: '查看审计日志' })).toBeChecked()
})

test('uses role codes from the role directory when editing a user', async ({ page }) => {
  const updatePayloads: unknown[] = []
  page.on('request', (request) => {
    if (request.method() === 'PATCH' && request.url().includes('/api/users/'))
      updatePayloads.push(request.postDataJSON())
  })

  await login(page)
  await page.getByText('系统管理', { exact: true }).click()
  await page.getByText('用户管理', { exact: true }).click()
  await expect(page).toHaveURL(/users/)
  await expect(page.getByText('财务人员（已停用）', { exact: true })).toBeVisible()

  const operatorRow = page.locator('.arco-table-tr').filter({ hasText: '周明' })
  await operatorRow.getByRole('button', { name: '编辑' }).click()
  await expect(page.locator('.arco-modal').getByText('运营人员', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '保存' }).last().click()
  await expect(page.getByText('用户信息已更新', { exact: true })).toBeVisible()

  expect(updatePayloads).toHaveLength(1)
  expect(updatePayloads[0]).toMatchObject({ roleCodes: ['operator'] })
  expect(updatePayloads[0]).not.toHaveProperty('roles')
})

test('preserves an existing unknown role code when editing a user', async ({ page }) => {
  const updatePayloads: Array<{ roleCodes?: string[] }> = []
  page.on('request', (request) => {
    if (request.method() === 'PATCH' && request.url().endsWith('/api/users/00000000-0000-4000-8000-000000000112'))
      updatePayloads.push(request.postDataJSON())
  })

  await login(page)
  await page.goto('/users')
  await page.getByLabel('关键词').fill('唐川')
  await page.getByRole('button', { name: '查询' }).click()

  const userRow = page.locator('.arco-table-tr').filter({ hasText: '唐川' })
  await userRow.getByRole('button', { name: '编辑' }).click()
  await expect(page.locator('.arco-modal').getByText('未知角色（legacy-manager）', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '保存' }).last().click()
  await expect(page.getByText('用户信息已更新', { exact: true })).toBeVisible()

  expect(updatePayloads).toHaveLength(1)
  expect(updatePayloads[0].roleCodes).toEqual(['auditor', 'legacy-manager'])
})

test('preserves unknown permissions and keeps wildcard permissions read-only', async ({ page }) => {
  const updatePayloads: Array<{ permissions?: string[] }> = []
  page.on('request', (request) => {
    if (request.method() === 'PATCH' && request.url().endsWith('/api/roles/auditor'))
      updatePayloads.push(request.postDataJSON())
  })

  await login(page)
  await page.goto('/roles')

  const adminRow = page.locator('.arco-table-tr').filter({ hasText: '系统管理员' })
  await expect(adminRow.getByRole('checkbox', { name: '全部权限' })).toBeDisabled()

  const auditorRow = page.locator('.arco-table-tr').filter({ hasText: '审计员' })
  await expect(auditorRow.getByText('legacy:read', { exact: true })).toBeVisible()
  await auditorRow.getByText('查看用户', { exact: true }).click()
  await auditorRow.getByRole('button', { name: '保存' }).click()
  await expect(page.getByText('角色权限已保存', { exact: true })).toBeVisible()

  expect(updatePayloads).toHaveLength(1)
  expect(updatePayloads[0].permissions).toContain('legacy:read')
  expect(updatePayloads[0].permissions).toContain('users:read')
})

test('keeps role management read-only without roles write permission', async ({ page }) => {
  await login(page)
  await page.evaluate(() => {
    document.cookie = 'arco_mock_role=role-reader; Path=/; SameSite=Lax'
  })
  await page.goto('/roles')

  await expect(page.getByRole('heading', { name: '角色与权限' })).toBeVisible()
  const operatorRow = page.locator('.arco-table-tr').filter({ hasText: '运营人员' })
  await expect(operatorRow.getByRole('checkbox', { name: '查看用户' })).toBeDisabled()
  await expect(operatorRow.getByText('只读', { exact: true })).toBeVisible()
  await expect(operatorRow.getByRole('button', { name: '保存' })).toHaveCount(0)
})
