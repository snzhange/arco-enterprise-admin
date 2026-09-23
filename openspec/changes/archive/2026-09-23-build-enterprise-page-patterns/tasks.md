# 任务

## 1. 排序契约与生成客户端

- [ ] 1.1 在对应 Java 服务端仓库为用户列表实现 `name`、`lastActiveAt` 的单字段 `sort=字段,方向` 白名单、稳定 `id` 并列顺序和 `sort` 字段校验错误，并通过服务端分页/非法排序/401/403 契约测试验证。
- [x] 1.2 更新 `openapi/admin-api.yaml` 的 `GET /api/users` 可选排序参数及 400 Problem Details 声明，校验 OpenAPI 契约有效。
- [x] 1.3 运行 `pnpm generate:api` 更新只读 `src/api/generated`，检查生成 diff 和 `pnpm typecheck`，确认用户列表参数包含可选排序而没有手改生成文件。
- [x] 1.4 更新 `src/mocks/handlers.ts`，以相同白名单实现排序、稳定并列顺序及重复/未知/非法排序的字段错误响应，并为 query 形状与分页结果添加 Mock 或页面请求测试。

## 2. 列表状态控制器

- [x] 2.1 新建与用户 DTO 无关的 `useListQueryState`，解析并序列化 1 基 `page`、1 至 100 的 `pageSize`、允许的 URL 筛选和单字段排序；通过 hook 测试验证默认值省略、无效参数回退和请求页码转换。
- [x] 2.2 让控制器在筛选、排序和页大小变化时回到第 1 页，并支持浏览器刷新、后退和前进恢复允许分享的状态；通过路由包装测试验证 URL 与状态双向同步。
- [x] 2.3 为用户页组合本地关键词与可分享状态，确保姓名/邮箱关键词从不写入 URL、历史或分享链接，并在列表上下文变化时清空受控行选择；通过组件测试验证这些行为。

## 3. 薄页面原语

- [x] 3.1 实现 `PageContainer` 和可组合的加载、空、错误、无权限 `PageState`，复用现有 `ApiError` 展示辅助并测试首次失败、保留数据时重试、取消静默和无权限状态。
- [x] 3.2 实现接受显式 JSX 字段的 `QueryForm`，提供受控提交、重置、loading 和响应式扩展区；通过行为测试确认它不生成字段、不拼装请求参数。
- [x] 3.3 实现受控 `DataTable`，组合 Arco Table/Pagination、工具栏、刷新、行选择、批量操作槽位和原样上抛的 sorter/filter 事件；通过测试确认它不发请求、不持有 QueryClient、也不依赖 `UserPage`。
- [x] 3.4 实现受控 `CrudDrawer` 与独立描述符的 `DetailPanel`，支持成功/失败时由页面决定关闭与保留内容；通过测试验证关闭回调、确认 loading、详情 loading/empty/error 和表格列未被复用。

## 4. 迁移实际页面

- [x] 4.1 将 `UsersPage` 的标题和查询区域迁移到 `PageContainer`、`QueryForm` 与列表状态控制器，保留显式 Orval query、`users:read` 权限和当前角色目录加载条件；通过页面测试验证 query 参数、URL 恢复和只读权限不请求角色目录。
- [x] 4.2 将 `UsersPage` 的表格、分页、排序、行选择、加载/空/错误/重试迁移到 `DataTable` 与 `PageState`，保留显式缓存失效和字段错误回填；通过页面与 E2E 测试验证筛选、翻页、排序、重试和 1/0 基转换。
- [x] 4.3 为用户页增加查看详情与新增/编辑 `CrudDrawer`，保持 `roleCodes` 提交、停用/未知角色展示、成功关闭刷新以及失败保留表单；通过现有及新增用户页面测试验证请求体和错误路径。
- [x] 4.4 仅迁移官方 `SearchTablePage` 中可复用的查询/表格布局，保留显式本地 records、字段和本地 sorter；通过测试确认其不触发服务端请求且不会将示例 Modal、导入或下载动作泛化。
- [x] 4.5 为新增原语和两个迁移页面补充必要的 Arco Pro 样式及桌面、900px、390px 布局规则；通过 Playwright 检查主要操作可达、抽屉可操作和表格水平溢出不遮挡内容。

## 5. 集成验证与交付

- [x] 5.1 扩展 Playwright 用户流程，覆盖可分享状态恢复、敏感关键词不入 URL、筛选/页大小重置、详情、新增、编辑、字段错误和错误重试，并运行 `pnpm e2e` 验证。
- [ ] 5.2 运行 `pnpm check:api`、`pnpm generate:api`、`pnpm typecheck`、`pnpm lint`、`pnpm test`、`pnpm build` 和 `pnpm e2e`，记录结果并确认生成目录零 diff。`pnpm check:api` 因为在首次提交生成目录之前使用 Git 基线判断 diff 而失败；其余命令通过。
