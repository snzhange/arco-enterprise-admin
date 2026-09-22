import type { NotificationCategory } from './types'

import {
  Avatar,
  Badge,
  Button,
  List,
  Result,
  Tabs,
  Trigger,
  Typography,
} from '@arco-design/web-react'
import {
  IconCustomerService,
  IconFile,
  IconMessage,
  IconNotification,
} from '@arco-design/web-react/icon'
import { useMemo, useState } from 'react'

import { useLocale } from '@/app/i18n'

import { INITIAL_NOTIFICATIONS } from './constants'

const categoryIcons = {
  message: <IconMessage />,
  notice: <IconCustomerService />,
  todo: <IconFile />,
}

export function NotificationPanel() {
  const t = useLocale()
  const [items, setItems] = useState(INITIAL_NOTIFICATIONS)
  const unreadCount = items.filter(item => !item.read).length

  const groupedItems = useMemo(() => ({
    message: items.filter(item => item.category === 'message'),
    notice: items.filter(item => item.category === 'notice'),
    todo: items.filter(item => item.category === 'todo'),
  }), [items])

  const markCategoryRead = (category: NotificationCategory): void => {
    setItems(current => current.map(item => item.category === category ? { ...item, read: true } : item))
  }

  const panel = (
    <div className="message-panel">
      <Tabs
        defaultActiveTab="message"
        type="rounded"
        extra={<Button type="text" onClick={() => setItems([])}>{t('message.empty')}</Button>}
      >
        {(Object.keys(groupedItems) as NotificationCategory[]).map((category) => {
          const categoryItems = groupedItems[category]
          const categoryUnread = categoryItems.filter(item => !item.read).length
          return (
            <Tabs.TabPane
              key={category}
              title={`${t(`message.tab.${category}`)}${categoryUnread ? ` (${categoryUnread})` : ''}`}
            >
              {categoryItems.length
                ? (
                    <List
                      footer={(
                        <div className="message-panel-footer">
                          <Button type="text" size="small" onClick={() => markCategoryRead(category)}>{t('message.allRead')}</Button>
                          <Button type="text" size="small">{t('message.seeMore')}</Button>
                        </div>
                      )}
                    >
                      {categoryItems.map(item => (
                        <List.Item className={item.read ? 'message-item-read' : ''} key={item.id}>
                          <button
                            type="button"
                            className="message-item-button"
                            onClick={() => setItems(current => current.map(currentItem => currentItem.id === item.id ? { ...currentItem, read: true } : currentItem))}
                          >
                            <List.Item.Meta
                              avatar={<Avatar size={36}>{categoryIcons[category]}</Avatar>}
                              title={item.title}
                              description={(
                                <div className="message-item-description">
                                  <Typography.Paragraph ellipsis={{ rows: 1 }}>{item.content}</Typography.Paragraph>
                                  <Typography.Text type="secondary">{item.time}</Typography.Text>
                                </div>
                              )}
                            />
                          </button>
                        </List.Item>
                      ))}
                    </List>
                  )
                : <Result status="404" subTitle={t('message.empty.tips')} />}
            </Tabs.TabPane>
          )
        })}
      </Tabs>
    </div>
  )

  return (
    <Trigger trigger="click" popup={() => panel} position="br" popupAlign={{ bottom: 4 }}>
      <Badge count={unreadCount} dot>
        <Button
          shape="circle"
          type="secondary"
          className="navbar-icon-button"
          aria-label={t('message.tab.notice')}
          icon={<IconNotification />}
        />
      </Badge>
    </Trigger>
  )
}
