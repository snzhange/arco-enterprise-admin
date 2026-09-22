# Spec Delta

## Purpose

为 OpenAPI 文档、Orval 生成客户端和关键浏览器流程建立可重复的 CI 门禁，使契约漂移在合并前失败并留下足够的 E2E 诊断证据。

## ADDED Requirements

### Requirement: OpenAPI 必须通过可重复的契约校验

项目 SHALL 提供一个固定版本和可本地运行的契约检查命令，对 `openapi/admin-api.yaml` 执行 OpenAPI 语法与语义校验。错误 response MUST 使用稳定的 `application/problem+json` Problem Details 结构，401/403/4xx/5xx 不得被业务包装为 200 成功响应。检查失败信息 SHALL 指向契约文件和修复动作。

#### Scenario: 非法 OpenAPI 在 CI 中失败

- **WHEN** OpenAPI 文档包含无效引用、非法 schema 或不符合校验规则的响应定义
- **THEN** 契约 job SHALL 失败，并输出可定位的文件、路径或 schema 错误

#### Scenario: Problem Details response 保持可消费

- **WHEN** 检查错误响应定义
- **THEN** 401、403、400、404、500/503 等 response SHALL 声明 `application/problem+json` 和可生成的 Problem Details schema

### Requirement: 生成客户端必须达到零 diff

CI SHALL 从锁定的 OpenAPI 输入重新运行 `pnpm generate:api`，然后检查 `src/api/generated` 相对于提交内容没有未提交差异。生成目录 SHALL 视为只读产物，任何手工修改或未提交生成结果 SHALL 使 job 失败，并明确提示先修改 OpenAPI 再重新生成。

#### Scenario: OpenAPI 修改但未生成客户端

- **WHEN**提交只修改 `openapi/admin-api.yaml` 或生成配置，重新生成会改变 `src/api/generated`
- **THEN** 零 diff 检查 SHALL 失败并报告生成目录差异

#### Scenario: 生成结果已同步

- **WHEN** OpenAPI、Orval 配置和提交的生成目录完全一致
- **THEN** 契约检查 SHALL 通过，并在生成后继续执行 typecheck

### Requirement: 契约变化必须有兼容性判定边界

项目 SHALL 对是否执行 breaking-change 检查做出固定选择并固定工具版本；若启用该检查，删除/收紧必需字段、状态码或参数等破坏性变化 SHALL 在 CI 中失败。若后端基线不在本仓库，CI SHALL 明确将本次检查限定为当前 OpenAPI 与生成一致性，而不声称覆盖 Java 服务端安全契约。

#### Scenario: 破坏性契约变化被阻止

- **WHEN**相对配置的基线删除必需响应字段或收紧有效请求范围
- **THEN**兼容性 job SHALL 失败并标明破坏性变更及其路径

#### Scenario: 前后端职责边界清晰

- **WHEN**前端仓库运行契约 job
- **THEN** job SHALL 验证 schema/生成一致性，并将 Spring Security 401/403 和数据范围验证留给 Java 仓库的服务端测试

### Requirement: 关键 Playwright 流程必须在独立 CI job 运行

CI SHALL 在独立于快速质量检查的 job 中安装锁定版本的 Chromium 及必要依赖，运行 `pnpm e2e`，并使用固定 base URL、timeout、重试和并发策略避免多次启动冲突。失败时 SHALL 上传 Playwright trace、截图和报告 artifact；pnpm store 与浏览器缓存 SHALL 可复用但不得依赖未声明的全局状态。

#### Scenario: E2E job 覆盖关键管理流程

- **WHEN** CI 执行 E2E job
- **THEN** 登录、导航、用户和角色关键流程 SHALL 实际运行，而不是只执行类型检查或单元测试

#### Scenario: E2E 失败保留诊断

- **WHEN**任一 Playwright 测试失败
- **THEN** job SHALL 保留 trace、失败截图或 HTML 报告，并在 CI 摘要中提供 artifact 名称

#### Scenario: 快速质量与 E2E 可独立反馈

- **WHEN** typecheck/lint/test/build 或 E2E 任一 job 失败
- **THEN** 失败 job SHALL 能单独定位，不要求串行等待另一类 job 才能产生结果
