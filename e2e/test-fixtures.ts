import { test as base, expect } from '@playwright/test'

// Playwright fixture callbacks are not React hooks despite the `use` callback name.
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.clock.setFixedTime(new Date('2026-09-23T10:00:00+08:00'))
    await page.route('**/*', async (route) => {
      if (route.request().resourceType() === 'font')
        return route.abort()
      await route.continue()
    })
    await use(page)
  },
})

export { expect }
