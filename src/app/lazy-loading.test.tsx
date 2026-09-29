import { render, screen } from '@testing-library/react'
import { Suspense } from 'react'
import { describe, expect, it } from 'vitest'

import { clearChunkRetryMarker, getChunkRetryKey, requestChunkRetry } from './error-recovery'
import { lazyNamed } from './route-manifest'

describe('lazy route loading recovery', () => {
  it('clears a route retry marker after a lazy module loads successfully', async () => {
    const route = `${window.location.pathname}${window.location.search}${window.location.hash}`
    clearChunkRetryMarker(route)
    requestChunkRetry(route)

    const LoadedPage = lazyNamed(
      async () => ({ LoadedPage: () => <div>模块已加载</div> }),
      'LoadedPage',
    )

    render(
      <Suspense fallback={<div>加载中</div>}>
        <LoadedPage />
      </Suspense>,
    )

    expect(await screen.findByText('模块已加载')).toBeVisible()
    expect(window.sessionStorage.getItem(getChunkRetryKey(route))).toBeNull()
  })
})
