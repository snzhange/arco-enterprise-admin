# 提案

## Why

用户管理页重复承担查询、分页、错误反馈与弹层生命周期，官方查询表格页也有相似结构；当前列表状态无法通过链接恢复，用户接口尚无排序契约。RBAC 角色代码和 ApiError 已稳定，现在适合从两个实际页面提炼可复用、但不接管业务请求的页面模式。

## What Changes

- 增加薄的页面容器、显式 JSX 查询表单、表格、CRUD 抽屉、详情布局及加载/空/错误/无权限状态组件；受控行选择、批量操作槽位、重试与工具栏由页面提供行为。
- 增加 URL 列表状态控制器，管理非敏感筛选、页码、页大小和单字段排序；转换 Arco 的 1 基页码和 Spring 的 0 基页码，并支持刷新与前进/后退恢复。
- 为 `GET /api/users` 增加可选的 Spring 风格 `sort=字段,方向`，同步 OpenAPI、生成客户端和 MSW；Java 服务端实现及测试须在对应仓库同步，不能把 Mock 当作服务端完成证据。
- 迁移用户管理页的查询、分页、错误及新增/编辑交互，保留显式 Orval hook、query key、权限与字段错误处理；用本地数据的官方查询表格页验证组件不依赖服务端请求，并为用户详情提供真实内容。
- 增加组件、控制器、页面和浏览器行为测试，以及 900px、390px 响应式检查；视觉风格沿用 Arco Pro 基线。
- 不实现完整 ProTable、OpenAPI 自动生成 UI、动态列平台或与 Orval hook 直接绑定的 DataTable；不增添缺少真实契约的批量删除/导入/导出，也不承担下一阶段的最终页面开发规范。

## Capabilities

### 新增能力

- `enterprise-page-patterns`：用户列表的 URL/分页/排序协议、查询和详情/编辑体验，以及与请求源解耦的 Arco 页面原语。

### 修改的能力

无。沿用既有 `rbac-contracts`、`api-error-handling` 和 `contract-ci` 要求，不改变其现有行为契约。

## Impact

- 前端：`src/pages/UsersPage.tsx`、`src/pages/official/SearchTablePage.tsx`、薄组件与列表状态 hook、必要样式和测试。
- 契约：`openapi/admin-api.yaml` 的用户列表可选排序参数；`src/api/generated` 仅经 `pnpm generate:api` 更新；`src/mocks/handlers.ts` 增加排序实现。
- 服务端：Java 用户列表应支持相同排序白名单与稳定次序；本仓库不能代替 Java 服务端实现和鉴权验证。
