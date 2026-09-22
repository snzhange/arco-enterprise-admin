// @env browser

import type { LoginRequest } from '@/api/generated/models'

import {
  Button,
  Carousel,
  Checkbox,
  Form,
  Input,
  Link,
  Message,
  Space,
} from '@arco-design/web-react'
import { IconLock, IconUser } from '@arco-design/web-react/icon'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { applyFieldErrors, getErrorMessage } from '@/api/errors'
import {
  getGetCurrentUserQueryKey,
  useLogin,
} from '@/api/generated/admin-api'
import { useLocale } from '@/app/i18n'
import { resetSessionExpired, toSafeReturnPath } from '@/app/session-expired'
import arcoProLoginBanner from '@/assets/arco-pro-login-banner.png'
import arcoProLogo from '@/assets/arco-pro-logo.svg'
import { setMockSession } from '@/mocks/session'

const loginBanners = [
  ['login.banner.slogan1', 'login.banner.subSlogan1'],
  ['login.banner.slogan2', 'login.banner.subSlogan2'],
  ['login.banner.slogan3', 'login.banner.subSlogan3'],
] as const

export function LoginPage() {
  const [form] = Form.useForm<LoginRequest>()
  const [errorMessage, setErrorMessage] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const t = useLocale()

  useEffect(() => {
    const previousTheme = document.body.getAttribute('arco-theme')
    document.body.removeAttribute('arco-theme')
    return () => {
      if (previousTheme)
        document.body.setAttribute('arco-theme', previousTheme)
    }
  }, [])

  const login = useLogin({
    mutation: {
      onSuccess: async () => {
        resetSessionExpired()
        if (import.meta.env.VITE_ENABLE_MOCK === 'true') {
          const email = form.getFieldValue('email')
          const role = email === 'operator@arco.dev'
            ? 'operator'
            : email === 'list-reader@arco.dev'
              ? 'list-reader'
              : email === 'user-reader@arco.dev'
                ? 'user-reader'
                : 'admin'
          setMockSession(role)
        }
        await queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() })
        Message.success('登录成功')
        const from = toSafeReturnPath((location.state as { from?: string } | null)?.from)
        navigate(from, { replace: true })
      },
      onError: (error) => {
        const formError = applyFieldErrors(form, error)
        setErrorMessage(formError || getErrorMessage(error))
      },
    },
    request: { errorPolicy: 'login', suppressSessionExpiry: true },
  })

  const submit = async (): Promise<void> => {
    setErrorMessage('')
    try {
      const values = await form.validate()
      login.mutate({ data: values })
    }
    catch {
      // Field-level validation is rendered by Arco Form.
    }
  }

  return (
    <main className="login-page">
      <div className="login-brand">
        <img src={arcoProLogo} alt="" />
        <span>Arco Design Pro</span>
      </div>

      <section className="login-banner" aria-label="Arco Design Pro">
        <Carousel className="login-carousel" animation="fade" autoPlay showArrow="always">
          {loginBanners.map(([title, subtitle]) => (
            <div key={title}>
              <div className="login-carousel-item">
                <div className="login-carousel-title">{t(title)}</div>
                <div className="login-carousel-subtitle">{t(subtitle)}</div>
                <img className="login-carousel-image" src={arcoProLoginBanner} alt="" />
              </div>
            </div>
          ))}
        </Carousel>
      </section>

      <section className="login-content">
        <div className="login-form-wrapper">
          <div className="login-form-title">{t('login.form.title')}</div>
          <div className="login-form-subtitle">{t('login.form.title')}</div>
          <div className="login-form-error" role={errorMessage ? 'alert' : undefined}>{errorMessage}</div>
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              email: 'admin@arco.dev',
              password: 'admin1234',
              remember: false,
            }}
          >
            <Form.Item field="email" rules={[{ required: true, message: t('login.form.email.error') }]}>
              <Input
                prefix={<IconUser />}
                aria-label="工作邮箱"
                placeholder={t('login.form.email.placeholder')}
                onPressEnter={() => void submit()}
              />
            </Form.Item>
            <Form.Item field="password" rules={[{ required: true, message: t('login.form.password.error') }]}>
              <Input.Password
                prefix={<IconLock />}
                aria-label="密码"
                placeholder={t('login.form.password.placeholder')}
                onPressEnter={() => void submit()}
              />
            </Form.Item>
            <Space size={16} direction="vertical" style={{ width: '100%' }}>
              <div className="login-password-actions">
                <Form.Item field="remember" triggerPropName="checked" noStyle>
                  <Checkbox aria-label="记住登录状态">{t('login.form.rememberPassword')}</Checkbox>
                </Form.Item>
                <Link>{t('login.form.forgetPassword')}</Link>
              </div>
              <Button type="primary" long aria-label="登录工作台" loading={login.isPending} onClick={() => void submit()}>
                {t('login.form.login')}
              </Button>
              <Button type="text" long className="login-register-button">
                {t('login.form.register')}
              </Button>
            </Space>
          </Form>
        </div>
        <footer className="login-footer">Arco Design Pro</footer>
      </section>
    </main>
  )
}
