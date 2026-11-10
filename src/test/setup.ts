import { Message } from '@arco-design/web-react'
import { afterEach, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'

// Arco renders toasts into a body-level container that Testing Library's cleanup does not remove.
afterEach(async () => {
  Message.clear()
  // Let Message's state update flush before the next test renders into the same document.
  await new Promise(resolve => setTimeout(resolve, 0))
})

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
