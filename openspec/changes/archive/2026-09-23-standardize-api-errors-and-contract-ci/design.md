# Design

## Context

当前 `src/api/http.ts` 只暴露 Axios `request` 和基于 `detail/title` 的文案 helper；生成的 Orval hooks 将 request options 透传到同一个 mutator。`ProtectedLayout` 使用 session query 的任意 error 作为登录重定向条件，页面 mutation 又各自调用 `Message.error`。OpenAPI 已有 `ProblemDetail`、`FieldError` 和 400/401/403/404 response，但 500/503 response、校验命令和生成零 diff 门禁尚未形成闭环。

实现必须保留 HttpOnly Cookie 认证、`src/api/generated` 只读、React Router/TanStack Query/Arco 现有组合，并兼容 change 01/02 已落地的 route manifest 与 RBAC code 字段。Java 服务端不在本仓库内，因此前端只能验证消费契约，不能替代服务端安全测试。

## Goals / Non-Goals

**Goals:**

- 让所有 API failure 先转换成可判定的 `ApiError`，统一状态、transport、Problem Details、字段错误和 traceId 语义。
- 用显式 request policy 区分 `login`、`session`、`business`、`logout`，避免 URL 字符串例外。
- 让 session 401、业务 401 和 session transport failure 具有不同且可测试的 UI 行为，并保证并发过期只导航一次。
- 让表单、查询和操作页面可以选择页面接管或全局处理，且同一请求不重复提示。
- 建立 OpenAPI validate、Orval generate、generated zero-diff、typecheck 和 Playwright artifact 的 CI 闭环。

**Non-Goals:**

- 不改变业务 DTO、角色权限模型或 route manifest 的 requirement。
- 不在本 change 中创建 DataTable、QueryForm、CrudDrawer、页面模板或视觉规范。
- 不实现 Java Spring Security、服务端 trace 采集或跨仓库 breaking-change 基线；只记录前端可消费的边界。
- 不把所有页面一次性重写为新错误组件，只迁移规范中列出的代表性样本。

## Decisions

### 1. 在 HTTP mutator 边界规范化错误

新增 `ApiError` 类型和纯函数 `toApiError(error)`，保留原始 `cause`，并让 `getErrorMessage`、field-error mapper、trace helper 都基于它。Axios response 只在这一层读取，页面仅依赖 `ApiError`。

选择边界规范化而不是让每个 hook 自行解析，是因为 Orval 生成代码不可手改，且同一分类必须覆盖 query、mutation 和非 React 请求。`axios.isAxiosError` 保留在实现层，不泄漏到页面类型。

### 2. 用 typed request policy 表达请求意图

扩展 mutator 可接受的 request options（例如 `errorPolicy`/metadata），默认按 `business` 处理，登录、session 和 logout 在生成 hook 调用处显式声明。策略决定 401 是否交给全局过期协调器、是否显示全局 Message，以及页面是否拥有错误处理权；禁止通过 pathname 字符串散落判断。

选择 metadata 而不是为每种请求复制 Axios client，是因为生成客户端已经共享同一 request mutator，metadata 可以在不改 generated 文件的情况下沿调用链传递。

### 3. 由单例协调器处理会话过期

在应用层提供 session-expired coordinator：第一次业务 401 失效当前 session query、记录安全 return URL、发出一次提示并导航到 `/login`；后续并发 401 只观察已有流程。登录页、session 探测和 logout 被标记为不参与该协调器。return URL 只接受同源 pathname/search/hash，拒绝绝对 URL 或协议相对 URL。

选择协调器而不是 Axios response interceptor 直接导航，是为了让 QueryClient 的失效、React Router 导航和页面测试拥有明确注入点，并避免 session query 自己触发递归处理。

### 4. ProtectedLayout 显式区分 pending/unauthenticated/retryable failure

`ProtectedLayout` 只把规范化后的 `unauthenticated` 当作登录重定向；`network`、`timeout`、`server` 渲染可重试的 session error state；其他错误显示诊断信息并保留当前上下文。登录 401 由 LoginPage 表单级错误消费，业务 query/mutation 通过页面或全局 policy 消费。

### 5. Problem Details 以共享 schema 和 response 引用维护

OpenAPI 保留单一 `ProblemDetail`/`FieldError` schema，补齐通用 500/503 response，并将错误 content type 和状态码引用化。`pnpm check:api` 使用仓库锁定的校验工具（优先采用已有 Node 生态依赖或固定 npx 版本），运行 validate、generate、git diff 检查和 typecheck；不手改 generated 输出。

### 6. CI 将契约和 E2E 拆成独立 jobs

保留快速 `quality` job，新增 `contract` job 和 `e2e` job。两者都使用锁定 Node/pnpm，contract job 上传生成差异上下文（失败即退出），E2E job 安装 Chromium、设置 CI-safe retries/timeout/concurrency，并始终上传 `playwright-report`、`test-results` 和 trace。E2E 不依赖开发机已有 server；Playwright webServer 在 CI 独立启动。

选择独立 jobs 是为了让契约漂移、代码质量和浏览器回归分别反馈，避免慢 E2E 阻塞最基本的 type/lint/test，也避免只通过单元测试宣称覆盖真实浏览器流程。

## Risks / Trade-offs

- [Risk] 现有页面对 AxiosError 的隐式依赖可能遗漏。→ 先保留兼容的 `getErrorMessage` 签名，逐页迁移并用类型搜索禁止新增 `response` 判断。
- [Risk] 全局 401 协调器可能在登录后旧请求完成时误跳转。→ 仅对带 `business` policy 且当前仍有有效会话上下文的请求触发，并在登录成功/登出时重置协调器。
- [Risk] Arco Form 字段路径可能包含嵌套或数组。→ 定义点号/数组索引到 Form field key 的明确映射，无法映射的错误留在表单级，不丢失原文。
- [Risk] OpenAPI 校验器与 Java springdoc 的细节存在差异。→ 将前端门禁限定为 YAML/OpenAPI schema 和生成稳定性；服务端 content type、状态码与 traceId 用 Java MockMvc 契约测试验证。
- [Risk] Playwright 浏览器下载增加 CI 时间。→ 使用 pnpm/action-setup、setup-node 和 Playwright browser cache，固定项目版本并只运行现有关键 suite；失败 artifact 始终保留。

## Migration Plan

1. 先扩展 Problem Details/OpenAPI response 与 `ApiError` 单元测试，保持现有 `getErrorMessage` 兼容。
2. 接入 request policy、session coordinator 和 `ProtectedLayout` retry state，再迁移 Login/Users/Roles/Dashboard 样本。
3. 在本地运行生成、typecheck、lint、unit、build 和 E2E；确认生成目录零 diff。
4. 启用 contract/e2e CI jobs，观察一次 PR 运行后再将其作为必需检查。
5. 回滚时可移除新 CI jobs 和页面接入；Cookie 认证、OpenAPI 文件和旧路由行为不需要数据迁移。

## Open Questions

无。breaking-change 基线若未来需要跨仓库比较，应另建 change，不改变本 change 已定义的生成零 diff 门禁。
