// @env browser

import type { AxiosRequestConfig } from 'axios'

import axios from 'axios'
import { notifySessionExpired } from '@/app/session-expired'
import { getErrorMessage as getNormalizedErrorMessage, toApiError } from './errors'

export type { ApiError, ApiErrorKind, ApiFieldError } from './errors'
export {
  applyFieldErrors,
  getFieldErrors,
  getErrorMessage as getNormalizedMessage,
  getTraceId,
  getTraceMessage,
  isApiError,
  isCancelledError,
  toApiError,
} from './errors'

export type RequestPolicy = 'business' | 'session' | 'login' | 'logout'

export interface RequestOptions extends AxiosRequestConfig {
  errorPolicy?: RequestPolicy
  suppressSessionExpiry?: boolean
  onApiError?: (error: ReturnType<typeof toApiError>) => void
}

export type HttpRequestConfig = AxiosRequestConfig & {
  errorPolicy?: RequestPolicy
}

export const httpClient = axios.create({
  // Keep API calls same-origin by default. The runtime bootstrap may set a service URL.
  baseURL: '',
  timeout: 15_000,
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  withXSRFToken: true,
  headers: {
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})

if (import.meta.env.VITE_ENABLE_MOCK === 'true') {
  httpClient.interceptors.request.use((config) => {
    if (typeof document !== 'undefined' && document.cookie.includes('arco_mock_session=1'))
      config.headers.set('X-Mock-Session', '1')
    if (typeof document !== 'undefined') {
      const role = document.cookie.match(/arco_mock_role=([^;]+)/)?.[1]
      if (role)
        config.headers.set('X-Mock-Role', role)
      const failure = document.cookie.match(/arco_mock_failure=([^;]+)/)?.[1]
      if (failure)
        config.headers.set('X-Mock-Failure', failure)
    }
    return config
  })
}

export function request<T>(
  config: HttpRequestConfig,
  options?: RequestOptions,
): Promise<T> {
  const policy = options?.errorPolicy ?? config.errorPolicy ?? 'business'
  const { errorPolicy: _configPolicy, ...baseConfig } = config
  const { errorPolicy: _optionPolicy, suppressSessionExpiry, onApiError, ...axiosOptions } = options ?? {}

  return httpClient
    .request<T>({ ...baseConfig, ...axiosOptions })
    .then(response => response.data)
    .catch((cause: unknown) => {
      const error = toApiError(cause)
      if (error.kind === 'unauthenticated' && policy === 'business' && !suppressSessionExpiry)
        notifySessionExpired(error)
      onApiError?.(error)
      throw error
    })
}

export type ErrorType<_T = unknown> = ReturnType<typeof toApiError> & { cause: unknown }
export type BodyType<T> = T

export function getErrorMessage(error: unknown): string {
  return getNormalizedErrorMessage(error)
}
