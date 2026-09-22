// @env browser

import type { AxiosError, AxiosRequestConfig } from 'axios'
import type { ProblemPayload } from './types'

import axios from 'axios'

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
    }
    return config
  })
}

export function request<T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> {
  return httpClient
    .request<T>({ ...config, ...options })
    .then(response => response.data)
}

export type ErrorType<T = unknown> = AxiosError<T>
export type BodyType<T> = T

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ProblemPayload>(error)) {
    return error.response?.data.detail
      || error.response?.data.title
      || error.message
  }

  return error instanceof Error ? error.message : '请求失败，请稍后重试'
}
