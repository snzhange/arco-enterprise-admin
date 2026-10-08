# Change 03：standardize-api-errors-and-contract-ci 落地清单

> 文档性质：历史设计与实施记录。该 change 已归档；当前请求错误语义以 `src/api/errors.ts`、`src/api/http.ts`、`pnpm check:api` 和[页面开发指南](../page-development-guide.md)为准。本文件中的未勾选项保留原始规划，不代表当前待办。

> 原 OpenSpec change ID：`standardize-api-errors-and-contract-ci`
> 优先级：P0  
> 建议依赖：`normalize-rbac-contracts`  
> 目标：统一请求错误语义，并让 OpenAPI、生成客户端和关键 E2E 进入 CI 门禁

## 1. 问题定义

当前错误处理存在两个方向的问题：

- 会话接口的网络错误、超时和 5xx 都会被当成未登录并跳转登录页。
- 登录后的普通接口返回 401 时，各页面没有统一的会话过期处理。

同时，OpenAPI 已经定义了 RFC 9457 风格的 `ProblemDetail`，但请求层只读取 `detail/title`，没有消费字段错误、业务代码和 traceId。CI 也没有检查重新生成后的差异，更没有运行现成的 Playwright E2E。

本 change 把“错误体验”和“契约门禁”放在一起，是因为它们共同依赖稳定的 Problem Details 和 OpenAPI 事实源。

## 2. 范围

### 包含

- 将 Axios/Problem Details 规范化为应用级错误模型。
- 明确 400、401、403、404、网络错误、超时和 5xx 的统一处理策略。
- 区分登录接口 401、会话接口 401 和登录后业务接口 401。
- 支持把 `fieldErrors` 映射回 Arco Form。
- 支持展示或复制 `traceId`。
- 为全局错误处理提供可跳过或由页面接管的机制。
- 在 CI 中校验 OpenAPI、重新生成客户端并检查零 diff。
- 将关键 Playwright E2E 纳入 CI。
- 建立错误分类和契约生成测试。

### 不包含

- 不实现企业页面组件库。
- 不修改具体业务 DTO，除非为完善 Problem Details 契约所必需。
- 不引入 Token/localStorage 认证。
- 不替代 Java 服务端日志和链路追踪平台。
- 不要求所有页面在同一 change 中完成视觉重构。

## 3. 推荐错误模型

建议定义应用级错误，不让页面直接判断 Axios 结构：

```ts
type ApiErrorKind
  = | 'validation'
    | 'unauthenticated'
    | 'forbidden'
    | 'not-found'
    | 'network'
    | 'timeout'
    | 'server'
    | 'unknown'

interface ApiError {
  kind: ApiErrorKind
  status?: number
  code?: string
  title: string
  detail?: string
  traceId?: string
  fieldErrors?: Array<{ field: string, message: string }>
  cause: unknown
}
```

页面使用 `toApiError(error)`、`getErrorMessage(error)` 或更具体的 helper，而不是读取 `error.response`。

## 4. 错误处理策略

| 场景 | 推荐行为 |
| --- | --- |
| 登录接口 401 | 留在登录页，显示“邮箱或密码错误”等服务端 detail，不触发会话过期跳转 |
| 会话接口 401 | 进入登录页，并保留安全的原路径以便登录后返回 |
| 会话接口网络错误/超时/5xx | 显示可重试的会话加载失败页，不伪装成未登录 |
| 已登录业务接口 401 | 清理当前会话 query，单次提示登录已过期并跳转登录页 |
| 403 | 页面查询显示无权限状态；操作请求保留当前页面并提示没有操作权限 |
| 400 + fieldErrors | 将字段错误写回当前表单；非字段 detail 作为表单级错误展示 |
| 404 | 查询场景显示资源不存在；操作场景提示数据已变化并建议刷新 |
| 网络错误/离线 | 显示网络不可用和重试入口，不显示服务端错误文案 |
| 超时 | 明确提示超时，可安全重试的查询提供重试按钮 |
| 5xx | 显示服务暂时不可用；存在 traceId 时提供诊断编号 |

### 防止重复处理

- 同一请求不能既被全局 handler 弹一次 Message，又被页面弹第二次。
- 多个并发请求同时返回 401 时，只触发一次导航和一次提示。
- 登录、会话探测等请求需要明确的 handler 策略，而不是通过 URL 字符串到处写例外。
- 页面如果要自行处理错误，应通过 typed request option 或 query/mutation metadata 显式声明。

## 5. 实施任务

### 5.1 完善 Problem Details 契约

- [ ] 确认所有错误响应使用 `application/problem+json`。
- [ ] 确认 `title/status/detail/code/traceId/fieldErrors` 的语义和可选性。
- [ ] 确认字段路径格式，推荐与前端 Form field key 可映射。
- [ ] 为常见 500/503 响应增加可复用 response 定义。
- [ ] 确认 401 与 403 的服务端状态码不会通过 200 业务包装返回。
- [ ] 重新生成客户端，禁止手改 `src/api/generated`。

### 5.2 建立错误规范化层

- [ ] 在 `src/api/http.ts` 或邻近模块实现 `toApiError`。
- [ ] 识别 Axios response、无 response、timeout、abort 和未知异常。
- [ ] 保留原始 cause，便于日志或调试。
- [ ] 让 `getErrorMessage` 基于规范化错误返回用户文案。
- [ ] 增加 `getFieldErrors` 或 `applyFieldErrors(form, error)` helper。
- [ ] 增加 traceId 的安全展示 helper。

### 5.3 会话生命周期

- [ ] 重构 `ProtectedLayout`，只在明确 401 时跳登录。
- [ ] 会话网络错误和 5xx 显示重试状态。
- [ ] 建立全局 session-expired 协调器，保证并发 401 只处理一次。
- [ ] 清除或失效当前会话 query 后再跳转。
- [ ] 保留 pathname、search 和 hash，登录成功后安全返回。
- [ ] 防止登录页、登录请求和登出请求进入过期循环。

### 5.4 页面接入样本

- [ ] 登录页验证登录 401 的原地错误展示。
- [ ] 用户新增/编辑表单接入 `fieldErrors`。
- [ ] 用户列表查询接入加载失败和重试状态。
- [ ] 角色保存接入 403、400 和 5xx 文案。
- [ ] Dashboard 的错误状态改用规范化错误，但不在本 change 中抽取最终页面组件。

### 5.5 OpenAPI CI 门禁

- [ ] 增加 `check:api` 或同类脚本。
- [ ] 对 `openapi/admin-api.yaml` 执行 lint/validate。
- [ ] 执行 `pnpm generate:api`。
- [ ] 使用版本控制 diff 检查 `src/api/generated` 没有未提交变化。
- [ ] 生成后再次运行 typecheck，确保调用方与新契约兼容。
- [ ] 如引入 breaking-change 检查，只选择一套工具并固定版本。
- [ ] CI 失败信息明确说明应先修改 OpenAPI 再重新生成。

### 5.6 E2E CI

- [ ] 为 CI 安装 Chromium 及必要依赖。
- [ ] 将 `pnpm e2e` 加入独立 job，避免和快速 type/lint job 串行阻塞。
- [ ] 缓存 pnpm 和 Playwright 浏览器时避免依赖未固定的全局状态。
- [ ] 保留失败 trace、截图或报告为 artifact。
- [ ] 给 E2E 设置合理 timeout 和 concurrency，避免重复启动冲突。

## 6. 测试清单

### 单元测试

- [ ] Problem Details 的 detail/title 优先级。
- [ ] fieldErrors、code 和 traceId 被完整保留。
- [ ] 401、403、404、5xx 分类正确。
- [ ] 无响应错误被区分为 network/timeout。
- [ ] abort 不产生误导性 Message。
- [ ] 普通 `Error` 和未知值有安全兜底。
- [ ] 字段错误能映射到 Arco Form 接受的结构。

### 组件/集成测试

- [ ] 会话 401 跳登录并保留原地址。
- [ ] 会话 500 显示重试页，不跳登录。
- [ ] 登录 401 留在登录页。
- [ ] 用户查询 403 显示权限状态。
- [ ] mutation 字段错误出现在对应表单项。
- [ ] 两个并发 401 只产生一次过期处理。

### E2E

- [ ] 登录失效后执行受保护操作，跳回登录页。
- [ ] 模拟离线/接口失败，页面显示网络或服务错误而非未登录。
- [ ] 角色无写权限时保存请求被拒绝并保留页面状态。
- [ ] 关键登录、导航、用户和角色流程在 CI 中运行。

## 7. 预计涉及文件

可能新增：

- `src/api/errors.ts`
- `src/api/errors.test.ts`
- `src/app/SessionErrorState.tsx`
- OpenAPI 校验配置文件（仅在工具确有需要时）

可能修改：

- `openapi/admin-api.yaml`
- `src/api/http.ts`
- `src/api/http.test.ts`
- `src/app/routes.tsx` 或 change 01 后的路由模块
- `src/main.tsx`
- `src/pages/LoginPage.tsx`
- `src/pages/UsersPage.tsx`
- `src/pages/RolesPage.tsx`
- `src/pages/DashboardPage.tsx`
- `src/mocks/handlers.ts`
- `package.json`
- `.github/workflows/ci.yml`
- `playwright.config.ts`
- `e2e/admin.spec.ts`
- `docs/authorization.md`

## 8. Java 后端同步要求

- [ ] 所有错误响应使用稳定 Problem Details 结构。
- [ ] 401、403、400、404 和 5xx 使用正确 HTTP 状态码。
- [ ] Bean Validation 错误转换为字段错误数组。
- [ ] 每个可诊断错误返回 traceId，并与服务端日志关联。
- [ ] 登录凭证错误和登录后会话过期使用可区分 code。
- [ ] MockMvc 测试验证 content type、状态码和 Problem Details 字段。

## 9. 必跑命令

```bash
pnpm generate:api
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm e2e
```

还应在本地模拟一次生成后零 diff 的 CI 命令。

## 10. 完成标准

- [ ] 网络错误和 5xx 不再被误判为未登录。
- [ ] 业务请求 401 能统一触发一次会话过期流程。
- [ ] 登录 401 不触发全局跳转循环。
- [ ] fieldErrors 和 traceId 能被前端使用。
- [ ] 页面不再直接依赖 AxiosError 结构判断状态。
- [ ] 修改 OpenAPI 后未重新生成客户端会被 CI 阻止。
- [ ] Playwright 关键流程在 CI 中实际运行。

## 11. 交接提示

```text
$openspec-propose 
读取以下文件：
  - AGENTS.md
  - docs/capability-roadmap/analysis-report.md
为 docs/capability-roadmap/change-03-standardize-api-errors-and-contract-ci.md
描述的范围创建 change，change id 使用 standardize-api-errors-and-contract-ci。
重点先明确错误分类和会话 401 策略，再设计 OpenAPI 生成零 diff 与 E2E CI。
不要在本 change 中提前实现 DataTable、QueryForm 或页面开发规范。

不用向我确认分支名，落change之后直接apply，apply完成之后直接archive，archive完成之后提交并合并回main分支
```
