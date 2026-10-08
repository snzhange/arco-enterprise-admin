# Spec Delta

## MODIFIED Requirements

### Requirement: 契约职责边界必须明确

前端 CI SHALL 校验 OpenAPI 语法、Problem Details 结构、生成客户端一致性和声明的兼容性基线；当项目提供可访问的 Java `/v3/api-docs` 时，联调检查 SHALL 对比真实导出与仓库契约。前端 job 不得把自身通过描述为 Java 服务端已经验证 Spring Security 401/403、角色权限或数据范围。

#### Scenario: 前端契约 job 通过
- **WHEN** schema 和生成结果通过检查
- **THEN** job 输出 SHALL 明确仅代表前端契约一致性，不代表后端鉴权和数据范围验证完成

#### Scenario: 真实后端 OpenAPI 导出可用
- **WHEN** 联调环境提供 `/v3/api-docs`
- **THEN** 检查 SHALL 对导出 schema 执行结构和兼容性比较，并报告 path、method 和 schema 差异

#### Scenario: 服务端契约由后端负责
- **WHEN** 需要验证服务端 401/403 或数据范围
- **THEN** 项目文档和 CI SHALL 指向 Java 仓库的服务端测试，而不是伪造前端验证结果
