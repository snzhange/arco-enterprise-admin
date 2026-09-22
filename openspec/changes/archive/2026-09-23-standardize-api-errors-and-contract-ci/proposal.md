# Proposal

## Why

当前请求层只读取 Axios 错误中的 `detail/title`，会话探测又把网络中断、超时和服务端 5xx 误判为未登录，导致用户被错误地送回登录页。登录后的业务接口返回 401 时也没有统一的单次过期处理，字段校验错误和 `traceId` 无法稳定回填或诊断。

OpenAPI 已经是前端生成客户端的事实源，但 CI 没有验证文档、生成客户端和提交内容的一致性，也没有运行仓库已有的 Playwright 关键流程。本 change 先固定可观察的错误语义和会话策略，再建立生成零 diff 与 E2E 门禁，避免后续页面抽象建立在漂移的契约之上。

## What Changes

- 新增应用级 `ApiError` 规范化模型，统一识别 Problem Details、HTTP 状态、网络错误、超时、取消和未知异常，并保留 `cause`、`code`、`traceId` 与 `fieldErrors`。
- 明确 400、401、403、404、网络错误、超时和 5xx 的页面处理边界；页面通过 typed helpers 消费错误，不再读取 Axios 响应结构。
- 区分登录接口 401、会话探测 401 和已登录业务接口 401：前者原地展示凭证错误，第二类跳转并安全保留原路径，第三类通过全局协调器只触发一次会话过期流程。
- 为会话加载失败提供可重试状态；允许 query/mutation 通过显式 metadata 或 request option 由页面接管错误，避免全局提示与页面提示重复。
- 将字段错误映射到 Arco Form，将 `traceId` 以安全文本展示或复制；补齐登录、用户、角色和 Dashboard 的代表性接入与测试。
- 为 `openapi/admin-api.yaml` 增加稳定的 Problem Details response 约束和校验脚本；`check:api` 执行 lint/validate、重新生成 Orval 客户端、检查 `src/api/generated` 零 diff，并在生成后运行类型检查。
- 将 Playwright 关键流程放入独立 CI job，固定 Node/pnpm/浏览器安装与缓存，失败时保留 trace、截图和报告 artifact。
- 不实现 `DataTable`、`QueryForm`、`CrudDrawer` 或页面开发规范，不进行无关视觉重构，也不把前端测试当作 Java Spring Security 鉴权证明。

## Capabilities

### New Capabilities

- `api-error-handling`: 定义 Problem Details 到应用错误模型的分类、会话生命周期策略、字段错误/诊断信息消费方式和重复处理防护。
- `contract-ci`: 定义 OpenAPI 校验、生成客户端零 diff、兼容性检查选择和 Playwright E2E CI 门禁。

### Modified Capabilities

无。现有 `route-manifest` 与 `rbac-contracts` 的 requirement 不变；本 change 只消费它们已经稳定的路由和角色契约。

## Impact

- 前端请求与状态：`src/api/http.ts`、新增错误 helper/测试、QueryClient 或会话协调器、`src/app/routes.tsx` 和会话错误状态组件。
- 页面接入：`LoginPage`、`UsersPage`、`RolesPage`、`DashboardPage` 及对应 MSW handlers/测试。
- 契约与生成：`openapi/admin-api.yaml`、Orval 输出（只能由 `pnpm generate:api` 更新）、`package.json` 中的校验脚本。
- CI/E2E：`.github/workflows/ci.yml`、`playwright.config.ts`、`e2e` 测试与 artifact 配置。
- Java 后端需同步遵守 `application/problem+json`、正确 401/403/4xx/5xx 状态、字段路径和 traceId 语义；该仓库只定义前端消费契约和可验证的边界。
