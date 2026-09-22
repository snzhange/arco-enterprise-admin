export type NotificationCategory = 'message' | 'notice' | 'todo'

export interface NotificationItem {
  category: NotificationCategory
  content: string
  id: string
  read: boolean
  time: string
  title: string
}
