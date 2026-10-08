# Spec Delta

## MODIFIED Requirements

### Requirement: 后端必须重新执行权限和数据范围校验

Java 服务端 SHALL 对每个受保护接口重新校验认证状态、权限代码、角色和数据范围；前端菜单或 Mock 通过不得视为服务端授权证据。用户列表等资源 SHALL 对排序字段、分页参数和数据范围执行服务端约束。

#### Scenario: 未认证请求
- **WHEN** 请求缺少有效会话
- **THEN** 服务端 SHALL 返回符合 Problem Details 的 401，且不泄露业务数据

#### Scenario: 无权限请求
- **WHEN** 已认证用户缺少接口所需权限
- **THEN** 服务端 SHALL 返回 403，且不执行越权写入或跨范围查询

#### Scenario: 数据范围过滤
- **WHEN** 用户拥有 department 或 self 数据范围
- **THEN** 服务端返回结果 SHALL 只包含允许范围内的数据

#### Scenario: 用户列表排序和分页
- **WHEN** 请求包含排序字段、方向、页码或页大小
- **THEN** 服务端 SHALL 只接受白名单字段，使用稳定 ID 作为并列次序，并正确处理第一页、空页和超界页
