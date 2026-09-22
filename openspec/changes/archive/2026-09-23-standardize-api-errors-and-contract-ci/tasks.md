# Tasks

## 1. Problem Details 与错误规范化

- [x] 1.1 在 OpenAPI 中补齐共享 Problem Details 的 500/503 response、`application/problem+json` 内容类型和字段语义，并用固定校验命令验证文档引用、状态码和 schema 约束
- [x] 1.2 新增 `src/api/errors.ts` 及类型，定义 `ApiErrorKind`/`ApiError`、`toApiError`、用户文案 helper、字段错误读取和 traceId 安全展示；用单元测试覆盖 detail/title 优先级、code/traceId/fieldErrors 保留、401/403/404/5xx、network、timeout、abort、普通 Error 和未知值
- [x] 1.3 扩展 `src/api/http.ts` 的 request options 与 mutator policy，使页面只消费规范化错误并能显式选择全局处理或页面接管；保留兼容的 `getErrorMessage`，并用类型/搜索检查页面不再新增 `error.response` 判断
- [x] 1.4 实现 Arco Form 字段错误映射 helper，覆盖点号路径、数组索引和无法映射时的表单级 detail；为用户创建/编辑场景增加组件测试

## 2. 会话生命周期与页面接入

- [x] 2.1 实现单例 session-expired coordinator，区分 login/session/business/logout policy，确保并发业务 401 只失效一次 session query、只提示一次并只导航一次，且安全保留 pathname/search/hash；用集成测试覆盖重复 401 和登录成功重置
- [x] 2.2 重构 `ProtectedLayout` 与会话错误状态：仅明确 session 401 跳转登录，network/timeout/5xx 留在可重试页面，其他错误显示诊断信息；测试原路径保留和重试行为
- [x] 2.3 更新 `LoginPage`，让登录 401 原地显示服务端凭证错误，禁止进入过期循环；增加登录失败和成功返回原路径的组件测试
- [x] 2.4 更新 `UsersPage`、`RolesPage` 和 `DashboardPage` 使用 `ApiError`，接入 403/404/网络/超时/5xx 状态、fieldErrors 和 traceId，避免重复 Message；为代表性 query/mutation 增加 MSW/组件测试
- [x] 2.5 更新 MSW handlers 与 E2E 场景，覆盖 session 401、session 500、登录 401、业务 401、403、字段校验错误和离线/网络失败；确认不修改 DataTable、QueryForm 或页面开发规范

## 3. OpenAPI 生成与契约门禁

- [x] 3.1 在 `package.json` 和必要配置中增加固定版本的 OpenAPI validate/lint 与 `check:api` 脚本，失败信息明确提示先修改 OpenAPI 再生成；验证本地命令可执行
- [x] 3.2 让 `check:api` 在干净树中运行 `pnpm generate:api`，检查 `src/api/generated` 零 diff，并在生成后运行 `pnpm typecheck`；验证正常生成通过且人为制造生成差异会失败
- [x] 3.3 选择并固定一套可用的 breaking-change 检查边界；若当前仓库无后端基线，则在脚本和文档中明确只保证 schema/生成一致性，不声称覆盖 Java Spring Security；用一次兼容性样例验证输出
- [x] 3.4 确认生成客户端只由 Orval 更新，检查 `git diff` 不包含手工修改 generated 文件，并将契约检查加入仓库本地开发说明或 CI 日志提示

## 4. Playwright CI 门禁

- [x] 4.1 将现有登录、导航、用户和角色关键流程整理为 CI 可重复的 Playwright suite，补齐错误分类与会话过期断言；本地 `pnpm e2e` 应通过
- [x] 4.2 更新 `playwright.config.ts` 的 CI timeout、retries、concurrency、固定 base URL 和 webServer 行为，确保不依赖开发机已有进程；验证 CI 模式可独立启动
- [x] 4.3 在 `.github/workflows/ci.yml` 增加独立 `contract` 与 `e2e` jobs，固定 Node/pnpm 安装与缓存；E2E 安装 Chromium 及依赖并上传 trace、截图、`playwright-report` 和 `test-results` artifact
- [x] 4.4 在 CI 配置中验证 quality、contract、e2e 可独立反馈，且契约生成差异、E2E 失败和缺少浏览器依赖都会以明确失败原因结束

## 5. 全量验证与交付

- [x] 5.1 运行 `pnpm generate:api`、`pnpm check:api`、`pnpm typecheck`、`pnpm lint`、`pnpm test`、`pnpm build` 和 `pnpm e2e`，记录结果并确认 generated 目录零 diff
- [x] 5.2 复核变更范围仅包含错误语义、会话策略、Problem Details、OpenAPI 生成门禁和 E2E CI；更新任务勾选与交接说明，准备 archive
