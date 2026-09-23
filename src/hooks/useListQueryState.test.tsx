import type { ReactNode } from 'react'
import type { ListQueryStateOptions } from './useListQueryState'
import { act, renderHook, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { useListQueryState } from './useListQueryState'

const options: ListQueryStateOptions<'status', 'name' | 'lastActiveAt'> = {
  filterValues: { status: ['active', 'disabled'] },
  sortFields: ['name', 'lastActiveAt'],
  defaultPageSize: 10,
  maxPageSize: 100,
}

function TestLocation({ onChange }: { onChange: (search: string) => void }) {
  const location = useLocation()
  onChange(location.search)
  return null
}

describe('useListQueryState', () => {
  it('restores shareable state and translates UI page to a zero-based request page', () => {
    let currentSearch = ''
    const Wrapper = ({ children }: { children: ReactNode }) => (
      <MemoryRouter initialEntries={['/users?page=3&pageSize=25&status=active&sort=name,desc&keyword=secret']}>
        {children}
        <TestLocation onChange={search => currentSearch = search} />
      </MemoryRouter>
    )
    const hook = renderHook(() => useListQueryState(options), { wrapper: Wrapper })

    expect(hook.result.current).toMatchObject({
      page: 3,
      requestPage: 2,
      pageSize: 25,
      filters: { status: 'active' },
      sort: { field: 'name', direction: 'desc' },
    })
    expect(currentSearch).toContain('keyword=secret')
  })

  it('omits defaults and falls back from invalid or duplicate URL values', async () => {
    let currentSearch = ''
    const Wrapper = ({ children }: { children: ReactNode }) => (
      <MemoryRouter initialEntries={['/users?page=0&pageSize=101&status=unknown&sort=name,side&sort=lastActiveAt,asc']}>
        {children}
        <TestLocation onChange={search => currentSearch = search} />
      </MemoryRouter>
    )
    const hook = renderHook(() => useListQueryState(options), { wrapper: Wrapper })

    expect(hook.result.current).toMatchObject({ page: 1, requestPage: 0, pageSize: 10, filters: {}, sort: undefined })
    act(() => hook.result.current.reset())
    await waitFor(() => expect(currentSearch).toBe(''))
  })

  it('resets the page when filter, sort, or page size changes', async () => {
    const Wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter initialEntries={['/users?page=4&pageSize=20']}>{children}</MemoryRouter>
    const hook = renderHook(() => useListQueryState(options), { wrapper: Wrapper })

    act(() => hook.result.current.setFilter('status', 'active'))
    await waitFor(() => expect(hook.result.current.filters.status).toBe('active'))
    expect(hook.result.current.page).toBe(1)

    act(() => hook.result.current.setSort({ field: 'name', direction: 'asc' }))
    await waitFor(() => expect(hook.result.current.sort).toEqual({ field: 'name', direction: 'asc' }))
    act(() => hook.result.current.setPageSize(50))
    await waitFor(() => expect(hook.result.current.pageSize).toBe(50))
  })
})
