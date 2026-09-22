# Tasks

## 1. OpenAPI 契约

- [x] 1.1 在 `openapi/admin-api.yaml` 定义 `RoleCode`、`RoleOption`、`PermissionOption` 和 `PermissionCode` 约束，并将 `CurrentUser`、`User`、`CreateUserRequest`、`UpdateUserRequest` 的角色字段统一为 `roleCodes`；用 OpenAPI 解析/生成前检查确认字段、正则、枚举和必填项一致
- [x] 1.2 增加 `GET /api/role-options` 与 `GET /api/permissions` operation，写明 `users:write`、`roles:read` authority 及 200/401/403 响应，并补齐用户写接口的 401/400 引用；通过 `pnpm generate:api` 前的 OpenAPI 校验确认文档可解析
- [x] 1.3 执行 `pnpm generate:api`，检查生成的模型、目录 query hook、query key 和请求 DTO 使用 `roleCodes`，并确认 `src/api/generated/**` 只包含生成命令产生的差异

## 2. RBAC 数据与 Mock

- [x] 2.1 建立单一 Mock RBAC 数据源，集中维护角色目录、权限目录、角色摘要和测试用户的角色代码；删除页面显示名称数组及重复 `DEFAULT_ROLES/defaultRoles`，验证所有 Mock 数据只使用稳定代码
- [x] 2.2 更新 MSW 会话、用户和角色 handler 使用 `roleCodes`，新增两个目录 handler、权限检查、停用角色和未知权限保留行为；为无会话/缺 authority 场景验证 401/403
- [x] 2.3 更新权限类型与测试夹具，使 `Permission`、`RoleSummary`、`CurrentUser` 的角色语义与生成模型一致，同时保留 route manifest 使用的权限代码常量；运行权限相关单测确认无回归

## 3. 用户管理页面

- [x] 3.1 将 `UsersPage` 的角色选项改为查询 `GET /api/role-options`，列表和表单用 `name` 展示、用 `code` 绑定，并在新增/编辑请求中只发送 `roleCodes`；用请求断言验证不再发送中文显示名称
- [x] 3.2 实现角色目录加载中、失败、空列表、停用角色和未知已分配代码的状态处理，目录不可用时禁用保存且不回退到硬编码数组；增加组件或交互测试覆盖这些状态

## 4. 角色与权限页面

- [x] 4.1 将 `RolesPage` 改为查询权限目录并按 `group` 渲染，移除 `PERMISSION_OPTIONS` 业务事实源；保留 `*` 和未知已授予权限为不可分配项，并验证保存 payload 不丢失这些代码
- [x] 4.2 根据 `roles:read`/`roles:write` 分离查看与编辑状态，处理目录加载失败和空列表，补充只读用户无法保存及越权 handler 返回 403 的测试

## 5. 文档与同步验收

- [x] 5.1 更新 `docs/authorization.md`，记录 `roleCodes`、两个目录接口、代码格式、`*` 处理、停用角色保留和 `all/department/self` 的 Java Service/Repository 数据范围职责
- [x] 5.2 增加前端契约/E2E 覆盖角色名称映射、动态角色、代码提交、未知权限保留、目录 authority 和只读角色编辑；在文档中明确 Java DTO、Spring Security、数据范围和 `/v3/api-docs` 需要在后端仓库同步验证

## 6. 完整验证

- [x] 6.1 运行 `pnpm typecheck`、`pnpm lint`、`pnpm test` 和 `pnpm build`，修复本 change 引入的类型、静态检查和单测问题
- [x] 6.2 在启用 Mock 的配置下运行 `pnpm e2e`，确认用户保存提交角色代码、角色目录/权限目录权限边界和既有路由权限回归通过，并检查生成目录无未预期手工差异
