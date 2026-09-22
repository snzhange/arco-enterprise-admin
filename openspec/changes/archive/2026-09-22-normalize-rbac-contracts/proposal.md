# Proposal

## Why

当前用户、会话和角色接口混用角色显示名称与角色代码，导致前端可以提交后端无法识别的值，且用户页和角色页分别维护了不一致的目录。OpenAPI、Mock 与页面需要先收敛到稳定的 RBAC 契约，才能在后续 change 中安全复用权限数据和数据范围语义。

## What Changes

- **BREAKING** 将 `CurrentUser`、`User`、`CreateUserRequest`、`UpdateUserRequest` 中的 `roles` 统一改为 `roleCodes`，所有 API 只交换稳定的角色代码，不再交换中文显示名称。
- 规定角色代码使用小写 kebab-case、长度 1-64、创建后不可变；显示名称只由角色目录提供。
- 新增 `GET /api/role-options` 角色选项目录，返回 `code`、`name`、`active`，使用 `users:write` 授权；停用角色可以用于展示已有分配，但不得被新分配。
- 新增 `GET /api/permissions` 权限目录，返回 `code`、`name`、`group`、`assignable`，使用 `roles:read` 授权；`*` 作为不可分配的系统权限保留，未知已授予权限必须能够安全展示并在保存时保留。
- 保持 `dataScope` 的 `all`、`department`、`self` 枚举不变，并记录 Java Service/Repository 层实施数据过滤的边界。
- 让用户页、角色页、会话数据和 MSW handler 使用同一套角色代码与目录语义，移除页面内硬编码角色/权限选项。
- 增加前端契约与交互测试清单，并明确 Java Spring Security、DTO、数据范围和 `/v3/api-docs` 的同步验收要求。

## Capabilities

### New Capabilities

- `rbac-contracts`: 统一角色代码、角色选项目录、权限目录、用户角色分配和数据范围契约。

### Modified Capabilities

- 无。现有 `route-manifest` 的权限代码语义保持不变，本 change 不修改路由行为。

## Impact

- OpenAPI：`openapi/admin-api.yaml` 增加目录 schemas/operations，并更新用户与会话 DTO；随后只能通过 `pnpm generate:api` 更新 `src/api/generated/**`。
- 前端：`UsersPage`、`RolesPage`、权限类型/常量、认证数据和相关测试将改用 `roleCodes` 与运行时目录。
- Mock：MSW 需要提供两个目录接口、角色代码数据、停用/未知项场景及权限校验。
- Java 后端：需要同步 DTO、目录接口授权、角色代码校验、数据范围过滤和安全契约测试；本仓库不伪造 Java 测试结果。
- 不包含统一错误框架、通用 CRUD 组件、动态菜单、组织树或新的数据范围枚举。
