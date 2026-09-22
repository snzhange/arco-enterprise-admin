# Spec Delta

## Purpose

为用户分配、角色编辑和会话权限提供稳定且可生成的 RBAC 契约，使角色代码、角色显示目录、权限目录和数据范围在前端、Mock 与 Java 服务端之间保持同一语义。

## ADDED Requirements

### Requirement: 使用稳定角色代码字段

系统 SHALL 在会话、用户资源和用户创建/更新请求中使用 `roleCodes` 表示角色分配。`roleCodes` 的元素 MUST 是服务端拥有的稳定代码，而不是显示名称；代码 MUST 使用小写 kebab-case，长度为 1 到 64 个字符，创建后不可变，并在同一数组内唯一。`dataScope` SHALL 继续只允许 `all`、`department`、`self`。

#### Scenario: 会话和用户响应返回角色代码

- **WHEN** 客户端读取 `GET /api/auth/session` 或 `GET /api/users`
- **THEN** 响应 SHALL 包含 `roleCodes` 数组，且不得包含以中文显示名称代替代码的角色字段

#### Scenario: 创建或更新用户提交角色代码

- **WHEN** 客户端调用用户创建或更新接口
- **THEN** 请求体 SHALL 使用 `roleCodes`，服务端 SHALL 校验每个代码存在且调用者有权分配，并 SHALL 拒绝角色显示名称或格式不合法的代码

#### Scenario: 不合法角色代码被拒绝

- **WHEN** 请求包含未知、重复、大小写不符合规则或已停用且不可保留的角色代码
- **THEN** 服务端 SHALL 返回 400，并提供可定位到 `roleCodes` 的验证信息

### Requirement: 提供受权限保护的角色选项目录

系统 SHALL 提供 `GET /api/role-options`。成功响应中的每个 `RoleOption` SHALL 至少包含 `code`、`name` 和 `active`；目录 SHALL 按当前操作者的角色分配范围返回。该接口需要 `users:write` authority，未登录返回 401，缺少该 authority 返回 403。`active: false` 的角色不得被用于新的分配，但可以用于展示已有用户分配。

#### Scenario: 有用户写权限的操作者读取目录

- **WHEN** 已登录操作者拥有 `users:write` 并请求 `/api/role-options`
- **THEN** 服务端 SHALL 返回可分配角色的代码和显示名称，并明确每个角色的 `active` 状态

#### Scenario: 只有用户读权限的操作者读取目录

- **WHEN** 已登录操作者只有 `users:read` 而没有 `users:write`
- **THEN** `/api/role-options` SHALL 返回 403，客户端不得用页面常量伪造可分配角色

#### Scenario: 已停用角色仍在现有用户上

- **WHEN** 用户已分配一个 `active: false` 的角色并打开编辑表单
- **THEN** 客户端 SHALL 显示该代码和名称作为已保留分配，禁止将其作为新的可选角色，并在未主动移除时保留该代码

### Requirement: 提供权限目录并保护通配权限

系统 SHALL 提供 `GET /api/permissions`。成功响应中的每个 `PermissionOption` SHALL 包含 `code`、`name`、`group` 和 `assignable`。该接口需要 `roles:read` authority；修改角色仍需要 `roles:write`。权限代码 SHALL 使用已有 `resource:action` 语义，通配代码 `*` SHALL 作为 `assignable: false` 的系统权限返回，不能因为前端编辑而被授予普通角色。

#### Scenario: 角色读权限读取权限目录

- **WHEN** 已登录操作者拥有 `roles:read`
- **THEN** `/api/permissions` SHALL 返回可用于角色编辑的代码、显示名称和分组信息

#### Scenario: 通配权限不可被普通角色新授予

- **WHEN** 客户端读取权限目录或编辑非系统管理员角色
- **THEN** `*` SHALL 显示为不可分配项，服务端 SHALL 拒绝向普通角色新增 `*`

#### Scenario: 已授予但目录未知的权限被保留

- **WHEN** 角色响应包含当前目录没有的权限代码，且操作者打开编辑页面并保存其他变更
- **THEN** 客户端 SHALL 以代码本身作为兜底展示，并 SHALL 在保存请求中保留该未知代码，不能静默删除

### Requirement: 页面使用运行时目录映射角色和权限

用户管理页面 SHALL 从角色选项目录读取选项，列表和表单展示 `name`、提交 `code`；角色管理页面 SHALL 从权限目录读取选项，保存稳定权限代码。页面 MUST 显式处理目录加载中、加载失败和空列表状态。只有 `roles:read` 的操作者可以查看角色数据但不能保存，只有 `users:write` 的操作者可以加载并使用角色分配目录。

#### Scenario: 服务端新增角色后用户页面自动出现

- **WHEN** `/api/role-options` 返回一个前端未预置的新角色
- **THEN** 用户编辑表单 SHALL 显示该角色名称，提交时 SHALL 只发送其代码，无需修改页面源码

#### Scenario: 用户编辑提交代码而非显示名称

- **WHEN** 操作者选择“运营人员”并保存用户
- **THEN** 请求体 SHALL 包含例如 `roleCodes: ["operator"]`，不得包含“运营人员”等显示文本

#### Scenario: 目录不可用时不产生错误分配

- **WHEN** 角色目录请求失败、返回空数组或当前操作者没有所需 authority
- **THEN** 页面 SHALL 显示明确状态并禁用角色分配提交，不得回退到硬编码角色列表

#### Scenario: 角色页面只读保存边界

- **WHEN** 操作者拥有 `roles:read` 但没有 `roles:write`
- **THEN** 页面 SHALL 展示权限目录和当前权限，但保存控件 SHALL 不可用，服务端更新接口 SHALL 仍返回 403

### Requirement: Mock 和契约测试使用同一角色代码语义

在 `VITE_ENABLE_MOCK=true` 时，MSW 的会话、用户、角色、角色选项和权限目录响应 SHALL 使用与 OpenAPI 相同的代码字段和目录数据；Mock 不得用显示名称填充 `roleCodes`。前端测试 SHALL 覆盖代码/名称映射、目录权限、停用角色、未知权限保留和数据范围枚举。

#### Scenario: Mock 会话和用户数据保持代码一致

- **WHEN** 测试以 Mock 登录并读取会话或用户列表
- **THEN** 角色字段 SHALL 为相同目录中的代码，用户角色标签 SHALL 由目录映射生成

#### Scenario: Mock 拒绝越权目录访问

- **WHEN** 没有 `users:write` 或 `roles:read` 的 Mock 用户请求相应目录
- **THEN** handler SHALL 返回 403，并 SHALL 不暴露目录内容

### Requirement: 服务端强制执行 authority 和数据范围

Java 服务端 SHALL 对用户、角色和目录接口分别执行 401/403 authority 校验，并在 Service/Repository 查询层应用 `all`、`department`、`self` 数据范围。前端权限判断只负责菜单、路由和控件体验，不能替代服务端鉴权。

#### Scenario: 未登录访问受保护 RBAC 接口

- **WHEN** 请求不带有效会话访问用户、角色或目录接口
- **THEN** 服务端 SHALL 返回 401

#### Scenario: 缺少读写 authority

- **WHEN** 已登录用户缺少目标接口要求的读或写 authority
- **THEN** 服务端 SHALL 返回 403，且不得仅依赖前端隐藏控件

#### Scenario: 数据范围限制查询结果

- **WHEN** `department` 或 `self` 用户查询用户及其他受数据范围约束的资源
- **THEN** Service/Repository SHALL 过滤越界数据；Controller、菜单或前端筛选不得作为唯一限制
