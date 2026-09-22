# 权限模型与 Spring Security 对接

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

建议登录成功后的 `GET /api/auth/session` 返回当前用户的 `permissions`、`roles` 和 `dataScope`，与 `openapi/admin-api.yaml` 保持一致。

## 前端行为

- 无权限菜单不会渲染。
- 直接访问无权限路由显示 403 页面。
- 无操作权限的按钮通过 `<Permission>` 隐藏或显示只读状态。
- 403 API 响应仍然由后端决定，前端不把权限判断当作安全边界。
