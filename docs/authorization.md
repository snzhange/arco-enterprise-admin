# 权限模型与 Spring Security 对接

新增页面的 route manifest、`<Permission>` 和页面错误状态接入步骤见 [页面开发指南](page-development-guide.md)；角色代码、权限目录及数据范围的行为契约见 [RBAC 规范](../openspec/specs/rbac-contracts/spec.md)。

当前前端权限分为三层：

1. `PermissionRequirement`：路由和菜单的 `all / any` 权限元数据。
2. `<Permission>`：按钮、操作和局部组件的显示控制。
3. Java 服务端鉴权：接口必须通过 Spring Security 强制校验，前端判断只负责体验。

## 权限格式

权限使用 `resource:action` 格式：

```text
dashboard:read
users:read
users:write
roles:read
roles:write
audit:read
```

`*` 表示管理员拥有全部权限，仅用于服务端明确授予管理员的场景。

## 角色和数据范围

当前 OpenAPI 契约中的角色结构为：

```json
{
  "code": "operator",
  "name": "运营人员",
  "dataScope": "department",
  "permissions": ["dashboard:read", "users:read"]
}
```

用户和会话只传稳定角色代码，不传显示名称：

```json
{
  "roleCodes": ["operator"],
  "dataScope": "department"
}
```

`roleCodes` 使用小写 kebab-case，长度为 1-64，创建后不可变且同一请求内不可重复。用户接口收到的角色代码必须来自服务端目录，并由服务端校验当前操作者是否可以分配。

用户页面通过 `GET /api/role-options` 读取角色目录。该接口需要 `users:write`；响应包含 `code`、`name` 和 `active`。停用角色可以作为已有用户的保留分配展示，但不能用于新的分配。没有写权限的用户不会通过页面常量获得角色选项。

角色页面通过 `GET /api/permissions` 读取权限目录。该接口需要 `roles:read`，响应包含 `code`、`name`、`group` 和 `assignable`；更新角色仍需要 `roles:write`。`*` 是仅供系统管理员使用的不可分配通配项，目录中会返回它以便展示当前状态。服务端新增但前端暂未认识的已授予权限，页面必须以代码兜底展示并在保存时保留。

## 用户编辑边界

操作者能否分配某个角色，按以下规则判断：持有 `*` 的操作者可以分配任意有效角色；其他操作者只能分配权限是自身权限子集、`dataScope` 不比自身宽的角色。业务项目如有内置角色，应额外限定只有持有 `*` 的操作者能分配。

`PATCH /api/users/{userId}` 只允许编辑同时满足以下条件的用户，否则返回 403：

1. 目标用户在操作者的数据范围内。
2. 目标用户不是内置用户（业务项目有内置超级管理员时适用）。
3. 目标用户不是操作者本人：不能修改自己的角色、状态、部门或姓名，避免自我提权或把自己锁在系统外。
4. 目标用户当前持有的每个有效角色，操作者都能分配：不能降级、停用或调整比自己权限更高的用户。已停用或不存在的角色不参与比较。

该规则与请求体包含哪些字段无关，只传 `status` 也会校验。新提交的 `roleCodes` 仍需逐个满足可分配规则。

用户列表和创建/更新响应中的 `manageable` 字段由服务端按同一规则计算，表示当前操作者能否编辑该用户。前端只在 `users:write` 且 `manageable` 为 `true` 时显示“编辑”，该字段只影响界面展示，不能代替服务端校验。Mock 按当前 Mock 角色计算 `manageable` 并拦截 PATCH，只覆盖本人和角色可分配两条，不模拟数据范围和内置用户。

`dataScope` 的可选值（基线语义）：

- `all`：不按范围过滤。
- `department`：按用户的 `department` 字段做完全相等匹配，不包含下属部门。业务项目需要部门层级时，应在服务端实现并更新本节。
- `self`：只覆盖操作者本人，例如只能看到自己的用户记录和自己产生的审计记录。业务数据要支持“本人创建或负责”，需要先在数据模型中增加创建人或负责人字段。

用户持有多个有效角色时，取范围最宽的一个（`all` > `department` > `self`）。

Java 后端应在 Service/Repository 查询层应用数据范围，不能只在 Controller 层隐藏按钮。业务项目应在本节列出实际接入数据范围的模块；未列出的模块视为只校验权限点、不按范围过滤数据。

## Spring Security 示例

```java
@PreAuthorize("hasAuthority('users:read')")
@GetMapping("/api/users")
Page<UserResponse> listUsers(UserQuery query, Authentication authentication) {
    return userService.list(query, dataScopeResolver.resolve(authentication));
}

@PreAuthorize("hasAuthority('users:write')")
@PostMapping("/api/users")
UserResponse createUser(@Valid @RequestBody CreateUserRequest request) {
    return userService.create(request);
}
```

登录成功后的 `GET /api/auth/session` 返回当前用户的 `permissions`、`roleCodes` 和 `dataScope`，与 `openapi/admin-api.yaml` 保持一致。

Java 侧同步要求：

- DTO、Controller 和 `/v3/api-docs` 使用 `roleCodes`，不保留含义不明的 `roles` 别名。
- `GET /api/role-options` 使用 `users:write`，`GET /api/permissions` 使用 `roles:read`；未登录和缺少 authority 分别返回 401/403。
- 创建/更新用户时校验角色代码存在、未重复且当前操作者可分配；停用角色只能按既有分配保留。
- 更新用户时拒绝编辑本人以及持有操作者无法分配角色的用户（见“用户编辑边界”），`UserDto.manageable` 与该校验共用同一判断。
- `all`、`department`、`self` 的数据范围必须在 Service/Repository 查询层执行，不能只在 Controller、菜单或前端筛选层判断。
- Java 安全测试必须覆盖用户/角色/目录接口的 401、读写 403、非法角色代码 400，以及 `department`/`self` 的越界数据过滤。

## 前端行为

- 无权限菜单不会渲染。
- 直接访问无权限路由显示 403 页面。
- 无操作权限的按钮通过 `<Permission>` 隐藏或显示只读状态。
- 用户列表按行读取 `manageable`，本人和权限更高的用户不显示“编辑”。
- 403 API 响应仍然由后端决定，前端不把权限判断当作安全边界。
