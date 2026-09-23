# 设计

## 背景

参见 `proposal.md` 的背景。当前 `UsersPage` 同时维护 Arco Form、列表查询、分页、选中行、Modal、mutation、缓存失效和错误展示；其中用户列表请求已有 `page`、`size`、`keyword`、`status`，但没有排序参数。`SearchTablePage` 是本地记录场景，已经有独立筛选与 Arco 本地 sorter。路由层使用 React Router，页面可直接使用 URL search 参数；请求和错误处理分别由 Orval/TanStack Query 与既有 `ApiError` 层承担。

RBAC 目录和错误分类是已稳定的前置能力：页面继续从角色目录展示名称和提交 `roleCodes`，并继续由页面处理字段错误、权限和缓存失效。生成客户端仍是只读产物。

## 目标与非目标

**目标：**

- 将重复的 Arco 页面布局和状态表现收敛为窄接口原语，同时使页面保有领域数据、权限、请求、排序策略和 mutation 的显式控制。
- 为用户列表提供可分享的非敏感 URL 状态和确定的分页/排序转换，并以第二个本地数据样本验证抽象没有隐含 TanStack Query 依赖。
- 在保留现有视觉语言的前提下，为加载、空、错误、无权限、详情和抽屉生命周期建立可测试行为。

**非目标：**

- 不提供请求函数、Orval hook、QueryClient、生成 DTO、query key 或 OpenAPI schema 驱动的通用组件 props。
- 不仿制 ProTable 的列配置、字段生成、持久化设置、批量网络操作或动态列平台。
- 不修改 route manifest、RBAC 契约、`ApiError` 分类及全局会话过期策略；不把 Java 服务端实现伪装为前端 Mock 验证。

## 决策

### 三层职责保持单向

页面保有所有领域决策：Orval hook、query key、`users:read`/`users:write`、请求参数映射、mutation、详情描述符和错误回填。`useListQueryState` 只在 React Router URL 与类型化列表状态之间转换，不导入业务 DTO 或请求 hook。页面原语只组合 Arco 控件与 React 节点，接收受控数据和回调。

| 层级 | 负责内容 | 明确不负责内容 |
| --- | --- | --- |
| 页面 | API 调用、权限、缓存失效、请求体、领域列、详情字段 | 将领域规则交给通用组件 |
| 列表状态控制器 | URL 解析/序列化、页码与页大小、排序、允许分享的筛选 | 发送请求、保存关键词、读取用户数据 |
| 页面原语 | 布局、Arco Table/Pagination/Form/Drawer/Descriptions 组合、受控状态展示 | 推断 API 分页结构、自动生成字段或管理 TanStack Query |

这使页面仍能从 JSX 和 hook 调用读出完整数据流。备选方案是 DataTable 接受 `request` 函数或直接接收 Orval hook；它会把缓存、错误、权限与 DTO 泛化为隐式约定，因而不采用。

### URL 状态采用显式白名单和本地敏感筛选

`useListQueryState` 基于 React Router search 参数实现，固定解析与序列化 `page`、`pageSize`、`status`、`sort`。默认值为 `page=1`、`pageSize=10`，写回 URL 时省略默认值；`status` 仅允许当前 `UserStatus` 枚举，`sort` 仅允许一个 `name|lastActiveAt,asc|desc` 值。无效数值、状态或排序回退到默认并不发送到 API。页大小遵守现有接口的 1 至 100 范围。

姓名/邮箱关键词留在页面受控 Form 和本地筛选状态中，提交、重置、页大小或排序变化会重新从第 1 页开始；只有显式安全的状态进入 URL。用户操作产生新的 search 历史记录，因此刷新、后退与前进能复原可分享状态。选中行属于页面状态，页面监听列表上下文变化后清空它。

对请求的适配在用户页边界完成：`current` 为 1 基，调用列表接口时传递 `page: current - 1`；响应的 `page`、`size` 用于纠正分页控件显示。备选方案是把所有筛选项都放到 URL 或全部留在内存；前者会泄露关键词，后者不能分享和恢复安全筛选，均不采用。

### 排序契约先限制为用户页可见字段

OpenAPI 为 `GET /api/users` 增加可选单个 `sort` 字符串，合法值对应 `name` 和 `lastActiveAt` 的升降序组合。MSW 用同一白名单验证重复、未知或方向错误的参数并返回带 `sort` field error 的 Problem Details；排序后的相同值以 `id` 作为稳定次序。生成客户端通过 `pnpm generate:api` 更新，禁止手改。

Java 服务端须以相同白名单和稳定次序实现，在前端上线前完成 OpenAPI/服务端一致性验证。该参数为可选，因此先部署服务端再部署前端；回滚前端时服务端接受额外参数不影响旧客户端。备选方案是现在支持任意字段、多字段数组或 `sortBy`/`sortOrder` 双参数；这些会在真实需求前扩大 API 与组件复杂度，因而不采用。

### 页面原语保持小而可组合

建议在 `src/components/page/`、`src/components/data/`、`src/components/form/` 和 `src/hooks/` 中落地，下列接口应优先复用 Arco 类型，且只接收页面已准备好的数据：

| 原语 | 职责与输入 | 边界 |
| --- | --- | --- |
| `PageContainer` | 标题、说明、可选 eyebrow、页面操作和内容间距 | 不读取路由面包屑、权限或数据 |
| `QueryForm` | 受控 Arco Form 布局、提交/重置动作、loading、显式 JSX children、可折叠扩展区域 | 不以 schema 创建字段，不拼装请求参数 |
| `DataTable` | 已准备的 `data`、`total`、受控分页、columns、rowSelection、工具栏/批量操作槽位、刷新与 Arco 变更回调 | 不接收 `request`、不持有 QueryClient、不猜测 `UserPage` |
| `CrudDrawer` | 受控可见性、标题、footer、确认 loading、关闭请求和内容 | 不持有 Form、脏状态、DTO 或 mutation；页面在打开、成功和关闭时显式初始化/清理表单 |
| `DetailPanel` | 单独的 label/value 描述符、loading、empty、error 展示 | 不复用表格 columns 或推断记录结构 |
| `PageState` | 加载、空、错误、无权限的可组合状态；错误接收既有规范化错误及重试回调 | 不分类 Axios response 或触发全局错误提示 |

`DataTable` 将 Arco 的 sorter/filter 变更原样交给页面：用户页把它转换为服务端单字段排序，本地样本保留本地 sorter。首次查询错误显示完整错误状态；已有保留数据时显示内联错误与重试，避免把已显示结果替换为空。取消请求保持安静，401 沿用既有全局会话策略，403 不被渲染为空数据。

### 分阶段迁移两个真实样本

用户页先接入 `PageContainer`、`QueryForm`、`useListQueryState`、`DataTable`、`CrudDrawer`、`DetailPanel` 和 `PageState`。操作列拆分为查看与在有写权限时的编辑；详情读取当前行，不增加详情 API。角色目录继续只在同时具有读写权限时加载。页面将显式把用户响应 `content`/`totalElements` 映射为表格 props，把当前状态映射为 Orval 参数，并在保存后失效用户 query。

官方查询表格页只迁移已能被第二样本验证的 `QueryForm` 与 `DataTable` 组合，保留本地 `records`、显式字段和本地创建交互。不会为了统一而把仅属于该示例的 Modal 或导入/下载占位动作提升为通用能力。

CSS 延续现有全局 Arco Pro token 与断点规则，新增类名仅服务这些原语和已迁移页面；不借此建立新主题或全局页面规范。

### 验证覆盖行为边界

组件测试覆盖受控回调、加载/空/错误/无权限表现和抽屉成功/失败关闭语义。控制器测试覆盖 URL 解析、默认值省略、敏感关键词排除、1/0 基转换、筛选/排序/页大小重置以及历史恢复。用户页和 E2E 测试检查请求 query、排序、详情、创建/编辑、字段错误和重试；本地样本测试检查其不触发服务端请求。Playwright 在桌面、900px 和 390px 验证关键控件可达与表格溢出行为，不在本 change 引入下一阶段的视觉快照规范。

## 风险与权衡

- [前后端排序不同步] → 后端先部署，OpenAPI、生成客户端、Mock 和 Java 测试以同一白名单验证；前端不把 Mock 当作服务端完成依据。
- [URL 泄露筛选信息] → 只序列化明确允许的字段，关键词始终保持本地。
- [薄组件逐步膨胀] → 两个异构样本均验证后才保留 props；单页专用需求留在页面。
- [Arco 排序事件与服务端语义混淆] → `DataTable` 仅上抛事件，用户页适配服务端排序，本地页保留原有本地比较器，并分别测试。
- [迁移时损失角色或错误行为] → 原样保留现有目录查询条件、`roleCodes` 映射、字段错误回填和 query invalidation，并为失败路径补回归测试。

## 迁移计划

1. 定义可选排序参数，先在 Java 服务端完成兼容实现与契约测试；同步本仓库 OpenAPI、MSW 与生成客户端。
2. 增加页面原语和列表状态控制器，先以独立行为测试固定其受控边界。
3. 迁移用户页并补齐详情、URL 状态、排序和错误路径测试；随后以官方查询表格页验证本地数据模式。
4. 运行 API 生成、类型检查、lint、单元测试、构建和 E2E；部署时先后端后前端。

若出现回归，前端可回退到当前页面实现，因为新 `sort` 参数可选且不改变原有响应结构；保留后端参数支持不会影响旧前端。
