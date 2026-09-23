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

`dataScope` 的可选值：

- `all`：全部数据
- `department`：当前部门及下属部门
- `self`：仅本人创建或负责的数据

Java 后端应在 Service/Repository 查询层应用数据范围，不能只在 Controller 层隐藏按钮。

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
- `all`、`department`、`self` 的数据范围必须在 Service/Repository 查询层执行，不能只在 Controller、菜单或前端筛选层判断。
- Java 安全测试必须覆盖用户/角色/目录接口的 401、读写 403、非法角色代码 400，以及 `department`/`self` 的越界数据过滤。

## 前端行为

- 无权限菜单不会渲染。
- 直接访问无权限路由显示 403 页面。
- 无操作权限的按钮通过 `<Permission>` 隐藏或显示只读状态。
- 403 API 响应仍然由后端决定，前端不把权限判断当作安全边界。
