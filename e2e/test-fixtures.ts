import { test as base, expect } from '@playwright/test'

// Playwright fixture callbacks are not React hooks despite the `use` callback name.
export const test = base.extend({
  page: async ({ page }, use) => {
    const unexpectedErrors: string[] = []
    const ignoredConsoleMessages = [
      // React DevTools is injected only in local development and is not an application error.
      /Download the React DevTools for a better development experience/i,
    ]
    page.on('pageerror', error => unexpectedErrors.push(`pageerror: ${error.message}`))
    page.on('console', (message) => {
      if (message.type() !== 'error' && !(message.type() === 'warning' && /unique "key" prop/i.test(message.text())))
        return
      if (message.type() === 'error' && /Failed to load resource: the server responded with a status of (?:400|401|403|404|500) \(/i.test(message.text()))
        return
      if (message.type() === 'error' && /Failed to load resource: net::ERR_FAILED/i.test(message.text()))
        return
      if (ignoredConsoleMessages.some(pattern => pattern.test(message.text())))
        return
      unexpectedErrors.push(`console.${message.type()}: ${message.text()}`)
    })
    await page.clock.setFixedTime(new Date('2026-09-23T10:00:00+08:00'))
    await page.route('**/*', async (route) => {
      if (route.request().resourceType() === 'font')
        return route.abort()
      await route.continue()
    })
    await use(page)
    expect(unexpectedErrors, unexpectedErrors.join('\n')).toEqual([])
  },
})

export { expect }
