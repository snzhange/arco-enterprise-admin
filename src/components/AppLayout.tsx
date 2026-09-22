import type { AppLocale } from '@/app/settings'

import {
  Avatar,
  Breadcrumb,
  Button,
  Divider,
  Dropdown,
  Input,
  Layout,
  Menu,
  Message,
  Select,
  Tooltip,
} from '@arco-design/web-react'
import {
  IconDashboard,
  IconExperiment,
  IconLanguage,
  IconMenuFold,
  IconMenuUnfold,
  IconMoonFill,
  IconPoweroff,
  IconSettings,
  IconSkin,
  IconSunFill,
} from '@arco-design/web-react/icon'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'

import { getGetCurrentUserQueryKey, useLogout } from '@/api/generated/admin-api'
import { useAuth } from '@/app/auth'
import { useLocale } from '@/app/i18n'
import { getNavigationGroup, getNavigationItem, getVisibleNavigationGroups } from '@/app/navigation'
import { useAppSettings } from '@/app/settings'
import { THEME_COLORS } from '@/app/settings/constants'
import arcoProLogo from '@/assets/arco-pro-logo.svg'
import { clearMockSession } from '@/mocks/session'

import { NotificationPanel } from './NotificationPanel'
import { SettingsDrawer } from './SettingsDrawer'

const { Content, Footer, Header, Sider } = Layout

const NAVBAR_HEIGHT = 60
const COLLAPSED_WIDTH = 48

export function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuth()
  const t = useLocale()
  const { locale, setLocale, setTheme, settings, theme, updateSettings } = useAppSettings()
  const currentGroup = getNavigationGroup(location.pathname)
  const currentItem = getNavigationItem(location.pathname)
  const visibleNavigationGroups = getVisibleNavigationGroups(user)
  const [collapsed, setCollapsed] = useState(false)
  const [openKeys, setOpenKeys] = useState<string[]>(currentGroup ? [currentGroup.key] : [])

  const logout = useLogout({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() })
        navigate('/login', { replace: true })
      },
      onError: () => Message.error('退出失败，请稍后重试'),
    },
  })

  const menuWidth = collapsed ? COLLAPSED_WIDTH : settings.menuWidth
  const effectiveOpenKeys = collapsed
    ? []
    : currentGroup && !openKeys.includes(currentGroup.key)
      ? [...openKeys, currentGroup.key]
      : openKeys
  const contentStyle = {
    paddingLeft: settings.menu ? menuWidth : 0,
    paddingTop: settings.navbar ? NAVBAR_HEIGHT : 0,
  }

  const userMenu = (
    <Menu
      onClickMenuItem={(key) => {
        if (key === 'profile')
          navigate('/user/setting')
        if (key === 'welcome')
          navigate('/welcome')
        if (key === 'workplace')
          navigate('/dashboard/workplace')
        if (key === 'logout') {
          logout.mutate(undefined, {
            onSettled: () => {
              if (import.meta.env.VITE_ENABLE_MOCK === 'true')
                clearMockSession()
            },
          })
        }
      }}
    >
      <Menu.Item key="profile">
        <IconSettings />
        {t('navbar.profile')}
      </Menu.Item>
      <Menu.Item key="welcome">
        <IconExperiment />
        Welcome
      </Menu.Item>
      <Menu.Item key="workplace">
        <IconDashboard />
        {t('menu.dashboard.workplace')}
      </Menu.Item>
      <Divider style={{ margin: '4px 0' }} />
      <Menu.Item key="logout">
        <IconPoweroff />
        {t('navbar.logout')}
      </Menu.Item>
    </Menu>
  )

  return (
    <Layout className="app-shell">
      {settings.navbar
        ? (
            <div className="layout-navbar">
              <Header className="navbar">
                <div className="navbar-left">
                  <Link className="navbar-logo" to="/dashboard/workplace" aria-label="Arco Pro">
                    <img className="brand-logo-image" src={arcoProLogo} alt="" />
                    <span className="brand-name">{t('brand.name')}</span>
                  </Link>
                </div>
                <ul className="navbar-right">
                  <li className="navbar-search-item">
                    <Input.Search className="navbar-search" placeholder={t('navbar.search.placeholder')} allowClear />
                  </li>
                  <li>
                    <Select
                      trigger="hover"
                      triggerElement={(
                        <Button
                          shape="circle"
                          type="secondary"
                          className="navbar-icon-button"
                          aria-label="Language"
                          icon={<IconLanguage />}
                        />
                      )}
                      options={[
                        { label: '中文', value: 'zh-CN' },
                        { label: 'English', value: 'en-US' },
                      ]}
                      value={locale}
                      triggerProps={{ autoAlignPopupWidth: false, autoAlignPopupMinWidth: true, position: 'br' }}
                      onChange={(value) => {
                        setLocale(value as AppLocale)
                        Message.info(value === 'zh-CN' ? '语言已切换至简体中文' : 'Language switched to English')
                      }}
                    />
                  </li>
                  <li><NotificationPanel /></li>
                  <li>
                    <Tooltip content={theme === 'dark' ? t('navbar.theme.light') : t('navbar.theme.dark')}>
                      <Button
                        shape="circle"
                        type="secondary"
                        className="navbar-icon-button"
                        aria-label={theme === 'dark' ? t('navbar.theme.light') : t('navbar.theme.dark')}
                        icon={theme === 'dark' ? <IconSunFill /> : <IconMoonFill />}
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                      />
                    </Tooltip>
                  </li>
                  <li>
                    <Tooltip content={t('settings.themeColor')}>
                      <Button
                        shape="circle"
                        type="secondary"
                        className="navbar-icon-button"
                        aria-label={t('settings.themeColor')}
                        icon={<IconSkin />}
                        onClick={() => {
                          const currentIndex = THEME_COLORS.findIndex(color => color.toLowerCase() === settings.themeColor.toLowerCase())
                          updateSettings({ themeColor: THEME_COLORS[(currentIndex + 1) % THEME_COLORS.length] })
                        }}
                      />
                    </Tooltip>
                  </li>
                  <li><SettingsDrawer /></li>
                  <li>
                    <Dropdown droplist={userMenu} position="br">
                      <Avatar size={32} className="user-avatar">
                        {user.displayName.slice(0, 1)}
                      </Avatar>
                    </Dropdown>
                  </li>
                </ul>
              </Header>
            </div>
          )
        : (
            <div className="fixed-settings">
              <SettingsDrawer
                trigger={<Button type="primary" size="large" aria-label={t('settings.title')} icon={<IconSettings />} />}
              />
            </div>
          )}

      {settings.menu && (
        <Sider
          className="layout-sider"
          width={settings.menuWidth}
          collapsedWidth={COLLAPSED_WIDTH}
          collapsed={collapsed}
          theme="light"
          breakpoint="xl"
          collapsible
          trigger={null}
          onCollapse={setCollapsed}
          style={{ paddingTop: settings.navbar ? NAVBAR_HEIGHT : 0 }}
        >
          <div className="menu-wrapper">
            <Menu
              className="app-menu"
              collapse={collapsed}
              selectedKeys={[location.pathname]}
              openKeys={effectiveOpenKeys}
              onClickMenuItem={key => navigate(key)}
              onClickSubMenu={(_, keys) => setOpenKeys(keys)}
            >
              {visibleNavigationGroups.map(group => (
                <Menu.SubMenu
                  key={group.key}
                  title={(
                    <>
                      {group.icon}
                      {t(group.messageKey)}
                    </>
                  )}
                >
                  {group.children.map(item => <Menu.Item key={item.key}>{t(item.messageKey)}</Menu.Item>)}
                </Menu.SubMenu>
              ))}
            </Menu>
          </div>
          <button
            className="collapse-btn"
            type="button"
            aria-label={collapsed ? '展开侧栏' : '收起侧栏'}
            onClick={() => setCollapsed(value => !value)}
          >
            {collapsed ? <IconMenuUnfold /> : <IconMenuFold />}
          </button>
        </Sider>
      )}

      <Layout className="layout-content" style={contentStyle}>
        <Content className="app-content">
          <div className="layout-content-wrapper">
            {currentGroup && currentItem?.breadcrumb !== false && (
              <Breadcrumb className="layout-breadcrumb">
                <Breadcrumb.Item>{currentGroup.icon}</Breadcrumb.Item>
                <Breadcrumb.Item>{t(currentGroup.messageKey)}</Breadcrumb.Item>
                <Breadcrumb.Item>{currentItem && t(currentItem.messageKey)}</Breadcrumb.Item>
              </Breadcrumb>
            )}
            <Outlet />
          </div>
        </Content>
        {settings.footer && <Footer className="app-footer">Arco Design Pro</Footer>}
      </Layout>
    </Layout>
  )
}
