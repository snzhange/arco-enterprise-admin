import { beforeEach, describe, expect, it, vi } from 'vitest'

import { copyText } from './clipboard'

describe('copyText', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('uses the async clipboard API when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })

    await copyText('hello')

    expect(writeText).toHaveBeenCalledWith('hello')
    expect(document.querySelector('textarea')).not.toBeInTheDocument()
  })

  it('falls back to a temporary textarea when the clipboard API is unavailable', async () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
    const execCommand = vi.fn().mockReturnValue(true)
    Object.defineProperty(document, 'execCommand', { configurable: true, value: execCommand })

    await copyText('fallback')

    expect(execCommand).toHaveBeenCalledWith('copy')
    expect(document.querySelector('textarea')).not.toBeInTheDocument()
  })
})
