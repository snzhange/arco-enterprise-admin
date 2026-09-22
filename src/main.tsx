import { ConfigProvider } from '@arco-design/web-react'
import enUS from '@arco-design/web-react/es/locale/en-US'
import zhCN from '@arco-design/web-react/es/locale/zh-CN'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { httpClient } from './api/http'
import { AppRoutes } from './app/routes'
import { AppSettingsProvider, useAppSettings } from './app/settings'
import '@arco-design/web-react/dist/css/arco.css'
import '@arco-themes/react-arco-pro/theme.css'

import '@arco-design/web-react/es/_util/react-19-adapter'
import './index.css'
import './official-pages.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

function ConfiguredApplication() {
  const { locale } = useAppSettings()

  return (
    <ConfigProvider
      locale={locale === 'zh-CN' ? zhCN : enUS}
      componentConfig={{
        Button: { size: 'default' },
        Card: { bordered: false },
        Table: { border: false },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </QueryClientProvider>
    </ConfigProvider>
  )
}

async function bootstrap() {
  httpClient.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || ''

  if (import.meta.env.VITE_ENABLE_MOCK === 'true') {
    const { worker } = await import('./mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass' })
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AppSettingsProvider>
        <ConfiguredApplication />
      </AppSettingsProvider>
    </StrictMode>,
  )
}

void bootstrap()
