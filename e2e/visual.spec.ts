import type { Locator, Page } from '@playwright/test'
import { expect, test } from './test-fixtures'

test.use({ baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:5173' })

test.use({ locale: 'zh-CN', timezoneId: 'Asia/Shanghai', colorScheme: 'light' })

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'breakpoint', width: 900, height: 700 },
  { name: 'mobile', width: 390, height: 844 },
] as const

async function login(page: Page) {
  await page.clock.setFixedTime(new Date('2026-09-23T10:00:00+08:00'))
  await page.goto('/login')
  await page.getByLabel('工作邮箱').fill('admin@arco.dev')
  await page.getByLabel('密码').fill('admin1234')
  await page.getByRole('button', { name: '登录工作台' }).click()
  await expect(page).toHaveURL(/dashboard\/workplace/)
}

async function capture(locator: Locator, name: string) {
  await locator.evaluate(async () => {
    await document.fonts.ready
  })
  await expect(locator).toHaveScreenshot(name, {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.01,
  })
}

for (const viewport of viewports) {
  test(`stable workplace and user list at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await login(page)

    const overview = page.locator('.overview-card')
    await expect(overview.getByText('线上总数据')).toBeVisible()
    await capture(overview, `workplace-${viewport.name}.png`)

    await page.goto('/users')
    const list = page.locator('.user-list-card')
    await expect(list.locator('.arco-table-tr').filter({ hasText: '周明' })).toBeVisible()
    await expect(page.getByRole('button', { name: '新增用户' })).toBeVisible()
    await expect(list.locator('.arco-table-container')).toBeVisible()
    await capture(list, `user-list-${viewport.name}.png`)

    const bounds = await list.boundingBox()
    expect(bounds).not.toBeNull()
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width + 1)
  })
}

for (const viewport of [viewports[0], viewports[2]]) {
  test(`stable user form drawer at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await login(page)
    await page.goto('/users')
    await expect(page.locator('.user-list-card .arco-table-tr').filter({ hasText: '周明' })).toBeVisible()
    await page.getByRole('button', { name: '新增用户' }).click()

    const drawer = page.locator('.arco-drawer-wrapper').last()
    await expect(drawer.getByLabel('姓名')).toBeVisible()
    await expect(drawer.getByRole('button', { name: '保存' })).toBeVisible()
    await capture(drawer, `user-form-${viewport.name}.png`)

    const bounds = await drawer.boundingBox()
    expect(bounds).not.toBeNull()
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width + 1)
  })
}
