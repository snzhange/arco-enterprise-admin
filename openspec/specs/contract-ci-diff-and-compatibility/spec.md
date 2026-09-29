# Contract CI Diff and Compatibility

## Purpose

使 OpenAPI 校验和生成客户端检查在不同 Git 工作区状态下保持一致，并明确前端契约门禁与 Java 服务端安全、数据范围验证的职责边界。

## Requirements

### Requirement: 生成客户端一致性检查必须独立于 Git 暂存状态

契约检查 SHALL 从当前 OpenAPI 和 Orval 配置生成到临时或受控目录，并将生成结果与仓库声明的 `src/api/generated` 进行确定性比较；检查结果不得因文件已暂存、未跟踪或仅存在工作树而改变语义。

#### Scenario: 生成文件未同步

- **WHEN** OpenAPI 或生成配置变化导致生成结果与提交目录不同
- **THEN** 契约检查 SHALL 失败并指出生成目录差异及修复命令

#### Scenario: 生成文件已同步

- **WHEN** 临时生成结果与仓库生成目录内容一致
- **THEN** 契约检查 SHALL 通过并继续执行类型检查

### Requirement: 契约职责边界必须明确

前端 CI SHALL 校验 OpenAPI 语法、Problem Details 结构、生成客户端一致性和声明的兼容性基线；不得把前端 job 的通过描述为 Java 服务端已经验证 Spring Security 401/403、角色权限或数据范围。

#### Scenario: 前端契约 job 通过

- **WHEN** schema 和生成结果通过检查
- **THEN** job 输出 SHALL 明确仅代表前端契约一致性，不代表后端鉴权和数据范围验证完成

#### Scenario: 服务端契约由后端负责

- **WHEN** 需要验证服务端 401/403 或数据范围
- **THEN** 项目文档和 CI SHALL 指向 Java 仓库的服务端测试，而不是伪造前端验证结果

### Requirement: 契约检查失败必须提供可诊断反馈

失败 SHALL 区分 schema 错误、Problem Details 约束错误、生成差异和兼容性失败，并包含涉及的文件、路径或 schema 名称。

#### Scenario: Problem Details 约束缺失

- **WHEN** 4xx/5xx response 缺少 `application/problem+json` 或 `ProblemDetail` 引用
- **THEN** 检查 SHALL 失败并指出具体 HTTP method、path 和 status
