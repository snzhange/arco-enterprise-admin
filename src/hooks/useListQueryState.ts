import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

export type ListSortDirection = 'asc' | 'desc'

export interface ListSort<TField extends string = string> {
  field: TField
  direction: ListSortDirection
}

export interface ListQueryStateOptions<TFilter extends string, TSortField extends string> {
  filterValues: Readonly<Record<TFilter, readonly string[]>>
  sortFields: readonly TSortField[]
  defaultPageSize?: number
  maxPageSize?: number
}

export interface ListQueryStateValue<TFilter extends string, TSortField extends string> {
  page: number
  pageSize: number
  filters: Partial<Record<TFilter, string>>
  sort?: ListSort<TSortField>
}

export interface ListQueryState<TFilter extends string, TSortField extends string>
  extends ListQueryStateValue<TFilter, TSortField> {
  requestPage: number
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  setFilter: (filter: TFilter, value?: string) => void
  setFilters: (filters: Partial<Record<TFilter, string>>) => void
  setSort: (sort?: ListSort<TSortField>) => void
  reset: () => void
}

function positiveInteger(value: string | undefined, fallback: number, minimum: number, maximum?: number): number {
  if (!value || !/^\d+$/.test(value))
    return fallback

  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < minimum || (maximum !== undefined && parsed > maximum))
    return fallback

  return parsed
}

function singleValue(searchParams: URLSearchParams, key: string): string | undefined {
  const values = searchParams.getAll(key)
  return values.length === 1 ? values[0] : undefined
}

function defaultPageSize<TFilter extends string, TSortField extends string>(options: ListQueryStateOptions<TFilter, TSortField>): number {
  return options.defaultPageSize ?? 10
}

function maxPageSize<TFilter extends string, TSortField extends string>(options: ListQueryStateOptions<TFilter, TSortField>): number {
  return options.maxPageSize ?? 100
}

function parseSort<TSortField extends string>(
  value: string | undefined,
  sortFields: readonly TSortField[],
): ListSort<TSortField> | undefined {
  if (!value)
    return undefined

  const [field, direction, extra] = value.split(',')
  if (extra !== undefined || !field || !isAllowedSortDirection(direction) || !sortFields.includes(field as TSortField))
    return undefined

  return { field: field as TSortField, direction }
}

function isAllowedSortDirection(value: unknown): value is ListSortDirection {
  return value === 'asc' || value === 'desc'
}

function isAllowedSort<TSortField extends string>(
  sort: ListSort<TSortField> | undefined,
  sortFields: readonly TSortField[],
): sort is ListSort<TSortField> {
  return Boolean(sort && sortFields.includes(sort.field) && isAllowedSortDirection(sort.direction))
}

export function parseListQueryState<TFilter extends string, TSortField extends string>(
  searchParams: URLSearchParams,
  options: ListQueryStateOptions<TFilter, TSortField>,
): ListQueryStateValue<TFilter, TSortField> {
  const filters: Partial<Record<TFilter, string>> = {}
  for (const filter of Object.keys(options.filterValues) as TFilter[]) {
    const value = singleValue(searchParams, filter)
    if (value && options.filterValues[filter].includes(value))
      filters[filter] = value
  }

  return {
    page: positiveInteger(singleValue(searchParams, 'page'), 1, 1),
    pageSize: positiveInteger(singleValue(searchParams, 'pageSize'), defaultPageSize(options), 1, maxPageSize(options)),
    filters,
    sort: parseSort(singleValue(searchParams, 'sort'), options.sortFields),
  }
}

export function serializeListQueryState<TFilter extends string, TSortField extends string>(
  value: ListQueryStateValue<TFilter, TSortField>,
  options: ListQueryStateOptions<TFilter, TSortField>,
): URLSearchParams {
  const params = new URLSearchParams()
  const page = positiveInteger(String(value.page), 1, 1)
  const pageSize = positiveInteger(String(value.pageSize), defaultPageSize(options), 1, maxPageSize(options))

  if (page !== 1)
    params.set('page', String(page))
  if (pageSize !== defaultPageSize(options))
    params.set('pageSize', String(pageSize))

  for (const filter of Object.keys(options.filterValues) as TFilter[]) {
    const filterValue = value.filters[filter]
    if (filterValue && options.filterValues[filter].includes(filterValue))
      params.set(filter, filterValue)
  }

  if (isAllowedSort(value.sort, options.sortFields))
    params.set('sort', `${value.sort.field},${value.sort.direction}`)

  return params
}

export function useListQueryState<TFilter extends string, TSortField extends string>(
  options: ListQueryStateOptions<TFilter, TSortField>,
): ListQueryState<TFilter, TSortField> {
  const [searchParams, setSearchParams] = useSearchParams()
  const value = useMemo(
    () => parseListQueryState(searchParams, options),
    [options, searchParams],
  )

  const commit = useCallback((nextValue: ListQueryStateValue<TFilter, TSortField>) => {
    setSearchParams(serializeListQueryState(nextValue, options))
  }, [options, setSearchParams])

  const setPage = useCallback((page: number) => {
    commit({ ...value, page: positiveInteger(String(page), 1, 1) })
  }, [commit, value])

  const setPageSize = useCallback((pageSize: number) => {
    commit({
      ...value,
      page: 1,
      pageSize: positiveInteger(String(pageSize), defaultPageSize(options), 1, maxPageSize(options)),
    })
  }, [commit, options, value])

  const setFilter = useCallback((filter: TFilter, filterValue?: string) => {
    const filters = { ...value.filters }
    if (filterValue && options.filterValues[filter].includes(filterValue))
      filters[filter] = filterValue
    else
      delete filters[filter]
    commit({ ...value, page: 1, filters })
  }, [commit, options.filterValues, value])

  const setFilters = useCallback((filters: Partial<Record<TFilter, string>>) => {
    const safeFilters: Partial<Record<TFilter, string>> = {}
    for (const filter of Object.keys(options.filterValues) as TFilter[]) {
      const filterValue = filters[filter]
      if (filterValue && options.filterValues[filter].includes(filterValue))
        safeFilters[filter] = filterValue
    }
    commit({ ...value, page: 1, filters: safeFilters })
  }, [commit, options, value])

  const setSort = useCallback((sort?: ListSort<TSortField>) => {
    const safeSort = isAllowedSort(sort, options.sortFields) ? sort : undefined
    commit({ ...value, page: 1, sort: safeSort })
  }, [commit, options.sortFields, value])

  const reset = useCallback(() => {
    commit({
      page: 1,
      pageSize: defaultPageSize(options),
      filters: {},
    })
  }, [commit, options])

  return {
    ...value,
    requestPage: value.page - 1,
    setPage,
    setPageSize,
    setFilter,
    setFilters,
    setSort,
    reset,
  }
}
