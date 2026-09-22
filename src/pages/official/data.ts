export interface ContentRecord {
  id: string
  name: string
  contentType: string
  filterType: string
  count: number
  createdTime: string
  status: '已上线' | '未上线'
}

export interface CardRecord {
  id: string
  title: string
  description: string
  type: string
  icon: 'file' | 'settings' | 'storage'
  enabled: boolean
}

export interface AuthorRecord {
  id: number
  author: string
  contentCount: number
  clickCount: number
}

export interface ActivityRecord {
  name: string
  value: number
  color: string
}

export interface AdjustmentRecord {
  contentId: string
  content: string
  status: boolean
  updatedTime: string
}

export const contentRecords: ContentRecord[] = [
  { id: '00001', name: '首页推荐内容', contentType: '图文', filterType: '规则筛选', count: 230, createdTime: '2026-09-06 09:30', status: '已上线' },
  { id: '00002', name: '产品发布短片', contentType: '横版短视频', filterType: '人工', count: 180, createdTime: '2026-09-05 16:20', status: '已上线' },
  { id: '00003', name: '用户增长专题', contentType: '图文', filterType: '规则筛选', count: 96, createdTime: '2026-09-05 11:42', status: '未上线' },
  { id: '00004', name: '直播活动预告', contentType: '竖版短视频', filterType: '人工', count: 75, createdTime: '2026-09-04 18:05', status: '已上线' },
  { id: '00005', name: '客户案例精选', contentType: '图文', filterType: '规则筛选', count: 142, createdTime: '2026-09-03 14:12', status: '已上线' },
  { id: '00006', name: '运营周报第 36 期', contentType: '图文', filterType: '人工', count: 88, createdTime: '2026-09-02 10:18', status: '未上线' },
  { id: '00007', name: '功能使用指南', contentType: '横版短视频', filterType: '规则筛选', count: 124, createdTime: '2026-09-01 17:30', status: '已上线' },
]

export const cardRecords: CardRecord[] = [
  { id: '1', title: '内容管理', description: '统一管理企业内容资产、发布状态和内容分类。', type: '内容应用', icon: 'file', enabled: true },
  { id: '2', title: '数据分析', description: '聚合核心运营指标，查看用户与内容增长趋势。', type: '数据应用', icon: 'storage', enabled: true },
  { id: '3', title: '权限中心', description: '维护角色、资源和操作级权限，支持审计追踪。', type: '系统应用', icon: 'settings', enabled: true },
  { id: '4', title: '活动运营', description: '配置线上活动、触达渠道和转化目标。', type: '运营应用', icon: 'file', enabled: false },
  { id: '5', title: '客户服务', description: '整合服务请求与客户反馈，跟踪处理进度。', type: '服务应用', icon: 'storage', enabled: true },
  { id: '6', title: '审批管理', description: '定义企业审批流程，处理待办和历史申请。', type: '协作应用', icon: 'settings', enabled: true },
]

export const authorRecords: AuthorRecord[] = [
  { id: 1, author: '林晓', contentCount: 3520, clickCount: 125680 },
  { id: 2, author: '周明', contentCount: 2980, clickCount: 108430 },
  { id: 3, author: '王璐', contentCount: 2640, clickCount: 96520 },
  { id: 4, author: '陈思远', contentCount: 2150, clickCount: 84320 },
  { id: 5, author: '赵启航', contentCount: 1890, clickCount: 72410 },
]

export const activityRecords: ActivityRecord[] = [
  { name: '内容生产', value: 82, color: '#165dff' },
  { name: '内容点击', value: 68, color: '#14c9c9' },
  { name: '互动评论', value: 56, color: '#722ed1' },
  { name: '内容分享', value: 42, color: '#f7ba1e' },
  { name: '新增关注', value: 35, color: '#00b42a' },
]

export const adjustmentRecords: AdjustmentRecord[] = [
  { contentId: 'A-20260901', content: '调整视频默认码率为 3000 bps', status: true, updatedTime: '2026-09-01 12:20' },
  { contentId: 'A-20260828', content: '修改音频采样率和声道配置', status: true, updatedTime: '2026-08-28 16:42' },
  { contentId: 'A-20260825', content: '申请启用新的直播编码方案', status: false, updatedTime: '2026-08-25 10:05' },
]

export const chartValues = [42, 58, 47, 72, 64, 83, 76, 91, 88, 104, 96, 112]
