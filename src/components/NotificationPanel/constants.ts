import type { NotificationItem } from './types'

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: 'message-1', category: 'message', title: '周明 回复了你', content: '数据分析看板已完成复核，可以发布。', time: '10 分钟前', read: false },
  { id: 'message-2', category: 'message', title: '王璐 提到了你', content: '请确认本周运营活动的目标人群。', time: '1 小时前', read: false },
  { id: 'notice-1', category: 'notice', title: '系统升级通知', content: '系统将在周六 02:00 进行例行维护。', time: '今天 09:30', read: false },
  { id: 'notice-2', category: 'notice', title: '权限策略已更新', content: '新的数据导出审批策略已经生效。', time: '昨天 16:20', read: true },
  { id: 'todo-1', category: 'todo', title: '待审批：营销活动预算', content: '申请人王璐，预算金额 28,000 元。', time: '截止今天 18:00', read: false },
]
