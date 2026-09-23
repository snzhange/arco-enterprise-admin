# 企业后台页面模式

## Purpose

为企业后台的列表、查询、详情与编辑提供可复用且可测试的交互边界，让用户管理页支持可恢复的安全列表状态，并让同一组页面原语适用于本地数据和服务端数据，而不替代各页面的权限与请求决策。

## ADDED Requirements

### Requirement: 列表状态可恢复且分页基数明确

用户管理列表 SHALL 使用 1 基 UI 页码，在请求服务端时转换为 0 基 `page`，并以响应中的实际 `page` 和 `size` 对齐显示。默认页码 SHALL 为 1、默认页大小 SHALL 为 10；页码、页大小、排序及显式允许分享的非敏感筛选 SHALL 能从 URL 恢复；默认值 SHALL 在 URL 中省略。包含个人信息或敏感内容的查询词 MUST 不进入 URL。筛选、排序和页大小变化 SHALL 回到第一页，刷新与浏览器前进/后退 SHALL 保持可分享状态一致。

#### Scenario: 链接与历史导航恢复列表

- **WHEN** 用户以 `?page=2&pageSize=20&status=active&sort=name,asc` 打开用户列表、刷新或返回该历史记录
- **THEN** 页面 SHALL 显示第 2 页并请求 `page=1&size=20&status=active&sort=name,asc`，且表单状态与 URL 一致

#### Scenario: 筛选或页大小变化重新开始

- **WHEN** 用户切换状态筛选、排序方向或页大小
- **THEN** 当前页 SHALL 变为 1，旧的已选行 SHALL 被清空，非敏感状态 SHALL 反映到 URL

#### Scenario: URL 无效值安全回退

- **WHEN** URL 包含无效页码、过大页大小、未知状态或不受支持的排序
- **THEN** 页面 SHALL 使用安全默认值，不传递无效排序或筛选到接口，也不得出现非法页码或渲染异常

#### Scenario: 私密关键词不泄露到地址栏

- **WHEN** 用户用姓名或邮箱关键词查询用户
- **THEN** 页面 SHALL 用该词过滤当前请求并回到第一页，但 SHALL 不把词加入 URL、浏览器历史或分享链接

### Requirement: 用户列表具有可选的稳定单字段排序

`GET /api/users` SHALL 接受至多一个可选的 `sort=字段,方向` 查询参数，字段仅允许 `name`、`lastActiveAt`，方向仅允许 `asc`、`desc`。未提供排序时 SHALL 保持现有默认次序；提供排序时同值记录 SHALL 以稳定的 `id` 次序作为并列排序依据。无效排序 SHALL 返回可诊断的 400 校验错误，且 SHALL 不改变既有 `page`、`size`、`keyword`、`status` 与响应结构。

#### Scenario: 合法排序与分页联合生效

- **WHEN** 请求 `GET /api/users?page=1&size=10&sort=lastActiveAt,desc`
- **THEN** 响应 SHALL 返回按最近活跃时间降序且并列时次序稳定的第二页，并以 0 基 `page=1` 标识实际服务端页码

#### Scenario: 无效排序拒绝

- **WHEN** 请求提供未知字段、多字段排序或不支持的方向
- **THEN** 接口 SHALL 返回 400 的标准 Problem Details，并给出能定位 `sort` 的校验信息

### Requirement: 查询与表格交互保持显式控制

页面 SHALL 自行决定查询提交、重置、排序、刷新、行选择、批量操作及请求状态，复用的 UI 原语 MUST 不自动发 API 请求、不持有业务缓存、不从契约自动生成查询字段；列定义与详情字段 SHALL 分开提供。本地数据和服务端数据页面 SHALL 均能使用共通的查询/表格布局而保持各自的排序和数据更新语义。

#### Scenario: 用户列表请求由页面控制

- **WHEN** 操作者提交查询、切换服务端排序或点击重试
- **THEN** 页面 SHALL 用当前筛选与页码发起相应请求，并自行控制权限、缓存失效和结果展示；表格 SHALL 不另行请求或推断服务端分页结构

#### Scenario: 本地查询表格复用布局

- **WHEN** 操作者在官方查询表格页展开多行筛选并对本地列排序
- **THEN** 页面 SHALL 用显式字段和本地记录完成筛选与排序，不需要服务端请求配置；收起布局在桌面与窄屏均可操作

#### Scenario: 已选行随列表上下文清理

- **WHEN** 当前表格有选中行，操作者改变筛选、排序、页码或页大小
- **THEN** 页面 SHALL 清空旧选中行，批量操作区域 SHALL 不继续操作旧上下文的数据

### Requirement: 用户页面提供可恢复的详情与编辑体验

用户管理页面 SHALL 展示标题与授权操作、受控表格、可读取的用户详情，以及新增/编辑抽屉。详情 SHALL 显示已有用户记录而不增加虚构接口；新建与编辑 SHALL 保持既有稳定角色代码、角色目录权限及字段校验语义。提交成功 SHALL 关闭抽屉并刷新列表；校验失败、权限失败或服务端故障 SHALL 保持抽屉及未提交内容，用户取消时不得误触保存。

#### Scenario: 用户详情展示真实记录

- **WHEN** 有 `users:read` 权限的操作者查看某行用户
- **THEN** 详情 SHALL 展示该行的姓名、邮箱、部门、状态、角色与最近活跃时间；未知或停用角色 SHALL 使用已有目录映射的兜底表现

#### Scenario: 新建与编辑保留既有契约

- **WHEN** 有 `users:write` 权限的操作者创建或编辑用户
- **THEN** 提交 SHALL 只发送允许的请求字段及 `roleCodes`，成功后 SHALL 关闭抽屉并刷新当前列表；失败 SHALL 保留表单，字段错误 SHALL 对应到输入字段

#### Scenario: 无写权限仍可查看

- **WHEN** 操作者只有 `users:read` 而没有 `users:write`
- **THEN** 操作者 SHALL 能查询并查看详情，创建与编辑操作 SHALL 不可用，角色分配目录 SHALL 不因只读详情而请求

### Requirement: 加载与错误状态可区分并可恢复

页面 SHALL 对首次加载、真正无结果、查询错误和无权限展示不同状态。查询失败 SHALL 提供重试并复用现有应用错误分类及可用的诊断标识；被取消的请求 MUST 不显示错误提示，403 MUST 不被误当空列表；窄屏下查询、操作与表格 SHALL 保持可访问和可横向浏览。

#### Scenario: 失败不伪装成空数据

- **WHEN** 用户列表查询失败且没有成功数据
- **THEN** 页面 SHALL 显示匹配错误类别的提示与重试入口，而不是“暂无数据”；存在 traceId 时 SHALL 展示可用的诊断信息

#### Scenario: 成功空列表与权限不足

- **WHEN** 查询成功但没有匹配记录，或操作者缺少 `users:read`
- **THEN** 前者 SHALL 显示空结果提示与可用的清除筛选入口，后者 SHALL 显示无权限提示且不请求用户数据

#### Scenario: 窄屏仍可操作

- **WHEN** 视口宽度为 900px 或 390px
- **THEN** 查询项、主要操作和抽屉 SHALL 可访问，表格 SHALL 不挤压页面内容而可横向浏览
