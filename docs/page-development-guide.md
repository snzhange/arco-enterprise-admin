# 页面开发指南

本文适用于新增和维护业务页面。先按页面的数据来源与交互需求选择模式，再组合现有组件；不要求每个页面都具备查询、表格和 CRUD。现有服务端分页样例见 [用户管理](../src/pages/UsersPage.tsx)，本地数据样例见 [查询表格](../src/pages/official/SearchTablePage.tsx)，样式入口见 [src/index.css](../src/index.css)。

## 1. 页面目录与职责

- 业务页放在 `src/pages/`；官方展示页放在 `src/pages/official/`，不把它们当成业务 API 模板。一个页面专用的 hook、表单值类型、组件及测试应与页面共置；只有被至少两个业务领域复用且不依赖具体 DTO 的 UI 才考虑进入 `src/components/`。
- 路由、权限常量、i18n 文案分别放在 `src/app/route-manifest.tsx`、`src/app/permissions.constants.ts` 和 `src/app/i18n/messages.ts`。共享列表 URL 状态可使用 [useListQueryState](../src/hooks/useListQueryState.ts)。
- DTO 和响应从 `src/api/generated/models` 导入；生成目录由 OpenAPI/Orval 管理，不能手改。表单值允许定义独立的 UI 类型，以表达尚未填写的字段和临时状态，不应复制手写 API DTO。
- 测试共置于页面旁（如 [UsersPage.test.tsx](../src/pages/UsersPage.test.tsx)）；跨路由流程位于 `e2e/`。应用布局、HTTP 请求层和 Mock 分属 `src/components/`、`src/api/` 与 `src/mocks/`。

## 2. 路由、菜单和语言

在 [route manifest](../src/app/route-manifest.tsx) 的 `routeGroups` 下增加页面，复用 `lazyNamed` 延迟加载；分组 `messageKey` 和叶子 `messageKey` 要在 [中英文词条](../src/app/i18n/messages.ts) 中声明。分组权限和叶子权限共同约束菜单与直接访问，同一 URL 不另建 pathname 权限表。例如现有系统分组的写法：

```text
// 放在 routeGroups 的 system.children 内；这是当前 UsersPage 的 manifest 记录。
{ kind: 'page', path: '/users', component: UsersPage, messageKey: 'menu.system.users', permission: { all: [PERMISSIONS.usersRead] } },
```

普通分组页默认显示面包屑；仅不希望显示时设置 `breadcrumb: false`。受保护但不进菜单的页面放在 `hiddenProtectedRoutes`，设 `menu: false`，需要标题时仍登记 `messageKey`。登录等公开页放 `publicRouteManifest`；`/` 之类的入口跳转放 `redirectRouteManifest`。未声明路径走 404；已登录但权限不足走 403，会话 401 走登录流程。这些边界见 [路由测试](../src/app/route-manifest.test.tsx) 与 [E2E](../e2e/admin.spec.ts)。

## 3. OpenAPI、请求与缓存

1. 以 Java 的 `/v3/api-docs` 为真实后端契约；当前示例项目修改 [openapi/admin-api.yaml](../openapi/admin-api.yaml)。先定义 DTO、分页协议和 Problem Details，再执行 `pnpm generate:api`，提交生成的客户端；绝不手改 `src/api/generated`。
2. 执行 `pnpm check:api` 校验 schema、生成结果零 diff 与类型检查。页面只调用生成的 `use*` hook 和 `get*QueryKey`，不要直接使用 Axios；Axios 只在 [请求层](../src/api/http.ts) 和生成代码中使用。
3. 页面自己决定筛选、请求 `enabled`、mutation、提交中状态及精确失效的缓存。成功后失效相关资源的生成 query key，例如 `queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() })`；普通业务 mutation 不要无差别清空全部 Query 缓存。账号切换是例外：登录成功、退出成功与业务 401 应通过 [clearSessionCache](../src/app/session-cache.ts) 取消进行中的查询并清理所有旧账号缓存。页面层捕获 mutation 错误时，遵循请求层的 `errorPolicy`，避免同一错误重复弹窗。
4. 服务端列表的 UI 页码从 1 开始，接口 `page` 从 0 开始。`useListQueryState` 暴露 `page`、`pageSize`、`requestPage` 和 `setFilters`/`setSort` 等方法；只把获准分享的非敏感筛选放 URL，姓名、邮箱等关键词留在页面状态。筛选、排序和页大小变更要清空旧行选择。参见 [用户列表实现](../src/pages/UsersPage.tsx)；本地数据过滤和排序无需后端 hook，参见 [查询表格实现](../src/pages/official/SearchTablePage.tsx)。
5. 生成 hook 已经通过 TanStack Query 向请求层传递 `AbortSignal`；如单独调用生成请求方法，应沿用其 `signal`/`request` 选项，不把被取消请求当网络失败。

## 4. 权限与数据范围

manifest 的 `permission: { all: [...] }` 或 `any` 管页面入口；[Permission](../src/components/Permission.tsx) 的 `all`/`any` 管局部操作显示，`fallback` 可显示只读状态。服务端字段使用稳定角色/权限代码，角色名称只用于展示。只有 `users:read` 的人员仍可查看用户详情，不应因为缺少 `users:write` 而请求角色分配目录。

菜单隐藏、路由 403 和按钮禁用都只是界面体验。Java Spring Security 必须按接口再校验读写权限，在 Service/Repository 应用 `all`、`department`、`self` 数据范围；前端 MSW 只能验证交互，无法证明服务端鉴权。详细契约见 [权限说明](authorization.md) 和 [RBAC spec](../openspec/specs/rbac-contracts/spec.md)。

## 5. 页面骨架与已有组件

页面整体标题、描述、操作区使用 [PageContainer](../src/components/page/PageContainer.tsx)，参数为 `title`、可选 `eyebrow`/`description`/`actions` 和 `children`。普通内容页按需组合 Arco 表单、文本或 Card；仪表盘/可视化页按信息密度选择对应图表与内容区，参考 [工作台](../src/pages/DashboardPage.tsx)，不强制使用表格。

服务端分页列表可以按下述最小形态拼装；变量来自页面自己的状态与生成 hook，这段是结构示例而非可直接运行的业务代码：

```tsx
<PageContainer title="用户管理" actions={canEdit ? createButton : undefined}>
  <QueryForm form={searchForm} onSubmit={handleSearch} onReset={resetSearch} loading={usersQuery.isFetching}>
    <Form.Item field="keyword" label="关键词"><Input allowClear /></Form.Item>
  </QueryForm>
  <DataTable<User>
    rowKey="id"
    columns={columns}
    data={usersQuery.data?.content ?? []}
    loading={usersQuery.isPending || usersQuery.isFetching}
    error={usersQuery.isError ? usersQuery.error : undefined}
    onRetry={() => void usersQuery.refetch()}
    pagination={{ current: currentPage, pageSize: currentPageSize, total: usersQuery.data?.totalElements ?? 0, onChange: changePage }}
  />
</PageContainer>
```

- [QueryForm](../src/components/data/QueryForm.tsx) 需要 Arco `form` 实例、显式表单项、`onSubmit` 和 `onReset`；可用 `advancedChildren`/`expanded`/`onExpandedChange` 展开高级查询。组件不自动生成字段或发请求。
- [DataTable](../src/components/data/DataTable.tsx) 需要 `rowKey`、`columns` 和 `data`；分页通过 `{ current, pageSize, total, onChange }` 显式控制，另可传 `toolbar`、`batchActions`、`onRefresh`、`rowSelection`、`onTableChange`、`error`/`onRetry`。初次加载、空结果与背景刷新由页面状态和表格共同处理。窄屏保持横向滚动。
- 新增/编辑抽屉用 [CrudDrawer](../src/components/form/CrudDrawer.tsx)：`visible`、`title`、`onCancel`、`onConfirm` 和 `children` 必填；`confirmLoading`、`confirmDisabled`、`afterClose` 可选，默认宽 520。表单校验、创建/更新 mutation、取消与成功关闭由页面显式处理，失败时保留表单。
- 详情字段使用 [DetailPanel](../src/components/data/DetailPanel.tsx) 的 `items: { key, label, value, span? }[]`，与表格列分开维护；详情抽屉由页面使用 Arco Drawer 控制。如果只有只读详情，不需要 CrudDrawer。
- 需要独立状态时使用 [PageState](../src/components/page/PageState.tsx) 的 `PageLoadingState`、`PageEmptyState`、`PageErrorState`（`error`、可选 `onRetry`）、`PageForbiddenState`，避免在错误时显示“暂无数据”。

## 6. 错误和页面状态

[ApiError](../src/api/errors.ts) 以 `kind` 区分 `validation`、`unauthenticated`、`forbidden`、`not-found`、`network`、`timeout`、`server`、`unknown`，并保存可用的 `code`、`traceId`、`fieldErrors`。查询失败按状态显示重试；已有数据的后台刷新保留上下文。成功但无结果才显示空态；取消请求不提示。400/422 的字段错误通过 `applyFieldErrors(form, error)` 映射到 Arco Form，并保留表单级 detail；403 保留当前上下文并告知权限不足；5xx 展示可用诊断编号及重试。

会话探测 401 才表示未登录；会话网络/5xx 显示重试，业务请求 401 走统一过期协调器，页面不要自行跳转登录。调用 `getErrorMessage`/`toApiError`，不要再解读 Axios response。测试参考 [请求层用例](../src/api/http.test.ts) 和 [用户页用例](../src/pages/UsersPage.test.tsx)。

## 7. Arco Pro 视觉和可访问性

页面宽度、内边距与断点使用布局及 `PageContainer` 的现有样式；不在页面单独复制一套最大宽度或侧栏规则。当前页面基线为 60px 顶栏、220px/48px 侧栏，通用卡片采用 `panel-card`，抽屉优先使用组件默认 520px（详情示例为 460px）；表格使用现有行高、密度和独立分页，筛选工具栏可换行。小屏查询项、页面操作不得互相遮挡，表格可横向浏览，抽屉内容保持可访问。

新样式优先用 Arco 的 `--color-text-*`、`--color-border-*`、`--color-fill-*`、`--color-bg-*` 和 `rgb(var(--primary-6))`，或 [现有项目变量](../src/index.css)；常见文本、边框和背景不要再硬编码色值。图表分组色和品牌对照素材可保留专用语义。`vendor/` 的官方归档只用于视觉对照，不能作为运行时依赖。

为输入加可识别的 `Form.Item` label，为纯图标按钮加 `aria-label` 或 Tooltip；保证 Tab/Enter/Escape 可用、弹层焦点可恢复，加载和错误有可读反馈。对照 1440 x 900、900 x 700 和 390 x 844 三个视口，检查标题、操作区、表格滚动及抽屉边界。

## 8. 测试与完成清单

纯逻辑与 hook 用 Vitest；查询参数、请求体、精确失效、字段错误与权限矩阵用页面集成测试；至少一个关键正向路径和一个空数据/失败/无权限路径用 E2E。关键页面截图断言见 [visual.spec.ts](../e2e/visual.spec.ts)；普通 `page.screenshot` 只供诊断，不是像素回归。基线按 `chromium-linux` 命名，须在 Playwright `1.63.0` Linux 镜像内生成：将仓库挂载到 `/workspace`，启动 `pnpm dev --host 0.0.0.0`，再设置 `PLAYWRIGHT_BASE_URL=http://host.docker.internal:5173` 并运行 `pnpm exec playwright test e2e/visual.spec.ts --update-snapshots`。视觉基线更新须审查差异并和页面修改一起提交；CI 失败时下载 `playwright-diagnostics` 检查 actual/expected/diff 与 trace。

新增页面合并前逐项检查：

- [ ] route manifest、i18n、菜单、标题、面包屑和页面权限正确，直接 URL 无权限为 403。
- [ ] 新接口先更新 OpenAPI 并运行 `pnpm generate:api`、`pnpm check:api`；页面不直接用 Axios，也不修改生成目录。
- [ ] 列表查询、分页基数、排序、URL 中可分享状态与敏感关键词隔离正确；mutation 有提交中状态，成功后精确失效，失败保留上下文。
- [ ] loading、背景刷新、空数据、失败重试、401、403、字段错误、5xx 与 traceId 各有合理处理。
- [ ] 1440px、900px、390px 的响应式布局及键盘操作、label、图标说明和焦点行为可用。
- [ ] 纯逻辑单测、请求/权限集成测试、关键正向与异常 E2E 以及必要视觉基线通过；Java 服务端另行验证接口鉴权和数据范围。

本地验证命令：`pnpm typecheck`、`pnpm lint`、`pnpm test`、`pnpm test:coverage:check`、`pnpm build`、`pnpm e2e`；契约变更再执行 `pnpm check:api`。

覆盖率以 Vitest V8 的 `src` 非生成代码为统计范围，当前基线为 Lines 33.69%、Branches 42.58%，质量门禁暂设 Lines 33%、Branches 42%，后续补齐核心页面测试后再提升。`pnpm test:coverage` 与 CI 的 `pnpm test:coverage:check` 使用同一配置，并生成 text、`coverage/coverage-summary.json` 和 HTML 报告。CI 即使覆盖率失败也会上传 `coverage/` artifact。

组件测试不得复用应用入口的 QueryClient；使用 `src/test/query-client.tsx` 的 `createTestQueryClient` 或 `TestQueryClientProvider`，测试结束取消进行中请求并清理缓存。MSW 的用户、角色和当前身份在测试边界调用 `resetMockStateForTests` 复位，`server.resetHandlers()` 只处理 handler override；同一测试内的登录、角色保存和 sessionStorage 持久化仍应保持有效。页面集成测试覆盖请求参数、缓存失效、权限和失败状态，纯逻辑使用 Vitest，关键用户路径再使用 E2E。
