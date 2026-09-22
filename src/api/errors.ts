import type { FormInstance } from '@arco-design/web-react'
import axios, { AxiosError } from 'axios'

export type ApiErrorKind
  = | 'validation'
    | 'unauthenticated'
    | 'forbidden'
    | 'not-found'
    | 'network'
    | 'timeout'
    | 'server'
    | 'unknown'

export interface ApiFieldError {
  field: string
  message: string
}

export interface ApiError {
  kind: ApiErrorKind
  status?: number
  code?: string
  title: string
  detail?: string
  traceId?: string
  fieldErrors?: ApiFieldError[]
  cause: unknown
  cancelled?: boolean
}

interface ProblemDetailsPayload {
  title?: unknown
  status?: unknown
  detail?: unknown
  code?: unknown
  traceId?: unknown
  fieldErrors?: unknown
}

const DEFAULT_MESSAGE = '请求失败，请稍后重试'

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}

function fieldErrorsValue(value: unknown): ApiFieldError[] | undefined {
  if (!Array.isArray(value))
    return undefined

  const fields = value.flatMap((item) => {
    if (!item || typeof item !== 'object')
      return []
    const field = stringValue((item as { field?: unknown }).field)
    const message = stringValue((item as { message?: unknown }).message)
    return field && message ? [{ field, message }] : []
  })
  return fields.length > 0 ? fields : undefined
}

function kindForStatus(status: number | undefined): ApiErrorKind {
  if (status === 400 || status === 422)
    return 'validation'
  if (status === 401)
    return 'unauthenticated'
  if (status === 403)
    return 'forbidden'
  if (status === 404)
    return 'not-found'
  if (status !== undefined && status >= 500)
    return 'server'
  return 'unknown'
}

function defaultTitle(kind: ApiErrorKind): string {
  switch (kind) {
    case 'validation':
      return '请求参数有误'
    case 'unauthenticated':
      return '登录状态已失效'
    case 'forbidden':
      return '没有操作权限'
    case 'not-found':
      return '资源不存在'
    case 'network':
      return '网络不可用'
    case 'timeout':
      return '请求超时'
    case 'server':
      return '服务暂时不可用'
    default:
      return DEFAULT_MESSAGE
  }
}

function fromAxiosError(error: AxiosError<ProblemDetailsPayload>): ApiError {
  const status = error.response?.status
  const payload = error.response?.data
  const body = payload && typeof payload === 'object' ? payload : undefined
  const kind = kindForStatus(status)
  const cancelled = axios.isCancel(error)
  if (cancelled) {
    return {
      kind: 'unknown',
      title: '请求已取消',
      cause: error,
      cancelled: true,
    }
  }

  const isTimeout = error.code === AxiosError.ETIMEDOUT
    || error.code === AxiosError.ECONNABORTED
    || error.message.toLowerCase().includes('timeout')
  const transportKind: ApiErrorKind | undefined = !error.response
    ? (isTimeout ? 'timeout' : 'network')
    : undefined
  const finalKind = transportKind ?? kind

  return {
    kind: finalKind,
    status,
    code: body ? stringValue(body.code) : undefined,
    title: body ? stringValue(body.title) ?? defaultTitle(finalKind) : defaultTitle(finalKind),
    detail: body ? stringValue(body.detail) : undefined,
    traceId: body ? stringValue(body.traceId) : undefined,
    fieldErrors: body ? fieldErrorsValue(body.fieldErrors) : undefined,
    cause: error,
  }
}

export function isApiError(error: unknown): error is ApiError {
  return Boolean(error && typeof error === 'object' && 'kind' in error && 'cause' in error && 'title' in error)
}

export function isCancelledError(error: unknown): boolean {
  return isApiError(error) ? error.cancelled === true : axios.isCancel(error)
}

export function toApiError(error: unknown): ApiError {
  if (isApiError(error))
    return error

  if (axios.isCancel(error) || (error instanceof Error && error.name === 'AbortError')) {
    return {
      kind: 'unknown',
      title: '请求已取消',
      cause: error,
      cancelled: true,
    }
  }

  if (axios.isAxiosError<ProblemDetailsPayload>(error))
    return fromAxiosError(error)

  if (error instanceof Error) {
    const isTimeout = error.name === 'TimeoutError' || error.message.toLowerCase().includes('timeout')
    return {
      kind: isTimeout ? 'timeout' : 'unknown',
      title: isTimeout ? defaultTitle('timeout') : error.message || DEFAULT_MESSAGE,
      detail: error.message || undefined,
      cause: error,
    }
  }

  return {
    kind: 'unknown',
    title: DEFAULT_MESSAGE,
    cause: error,
  }
}

export function getErrorMessage(error: unknown): string {
  const normalized = toApiError(error)
  if (normalized.cancelled)
    return ''
  return normalized.detail || normalized.title || DEFAULT_MESSAGE
}

export function getFieldErrors(error: unknown): ApiFieldError[] {
  return toApiError(error).fieldErrors ?? []
}

export function getTraceId(error: unknown): string | undefined {
  return toApiError(error).traceId
}

export function getTraceMessage(error: unknown): string | undefined {
  const traceId = getTraceId(error)
  return traceId ? `诊断编号：${traceId}` : undefined
}

export function applyFieldErrors<FormData extends object>(
  form: FormInstance<FormData>,
  error: unknown,
): string | undefined {
  const normalized = toApiError(error)
  const fields = normalized.fieldErrors ?? []
  if (fields.length > 0) {
    form.setFields(Object.fromEntries(fields.map(field => [field.field, { error: { message: field.message } }])) as Parameters<FormInstance<FormData>['setFields']>[0])
  }
  return normalized.detail
}
