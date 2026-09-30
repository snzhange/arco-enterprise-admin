# Spec Delta

## MODIFIED Requirements

### Requirement: OpenAPI 必须通过可重复的契约校验

项目 SHALL 提供一个固定版本和可本地运行的契约检查命令，对 `openapi/admin-api.yaml` 执行 OpenAPI 语法与语义校验。错误 response MUST 使用稳定的 `application/problem+json` Problem Details 结构，401/403/4xx/5xx 不得被业务包装为 200 成功响应。检查失败信息 SHALL 指向契约文件和修复动作；校验输出 SHALL 不包含由错误的编译目标或模块上下文造成的无关警告。

#### Scenario: 非法 OpenAPI 在 CI 中失败
- **WHEN** OpenAPI 文档包含无效引用、非法 schema 或不符合校验规则的响应定义
- **THEN** 契约 job SHALL 失败，并输出可定位的文件、路径或 schema 错误

#### Scenario: Problem Details response 保持可消费
- **WHEN** 检查错误响应定义
- **THEN** 401、403、400、404、500/503 等 response SHALL 声明 `application/problem+json` 和可生成的 Problem Details schema

#### Scenario: 契约校验环境与应用模块语义一致
- **WHEN** CI 重新生成客户端并执行契约与类型校验
- **THEN** 检查 SHALL 保留当前零 diff 和类型保证，且不得因错误的目标环境将 `import.meta` 等合法应用语法报告为无关警告
