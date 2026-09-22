# Change 02：normalize-rbac-contracts 落地清单

> 建议 OpenSpec change ID：`normalize-rbac-contracts`  
> 优先级：P0  
> 建议依赖：`unify-route-manifest`  
> 目标：统一角色代码、权限目录、用户角色分配和数据范围契约

## 1. 问题定义

当前 RBAC 已具备权限点、角色编辑和数据范围，但数据模型存在多份事实源：

- 会话中的角色使用代码：`admin`、`operator`。
- 用户管理页面提交中文显示名称：`管理员`、`运营` 等。
- 用户页硬编码了“财务”等服务端角色目录中不存在的选项。
- 权限目录由 `PERMISSION_OPTIONS` 在前端硬编码。
- 默认角色同时存在于权限常量和 MSW handler 中。

本 change 的重点不是增加更多权限功能，而是先把现有闭环建立在稳定、可生成、可测试的契约上。

## 2. 范围

### 包含

- 明确角色代码与显示名称的职责。
- 修改 OpenAPI，使用户 DTO 和写请求使用稳定角色代码。
- 为用户分配角色提供后端角色选项目录。
- 为角色编辑提供权限点目录，或建立等价的单一来源机制。
- 让 Mock、用户页、角色页和会话数据使用同一套代码语义。
- 建立 RBAC 前端契约测试清单。
- 给 Java 后端列出同步实现和安全测试要求。

### 不包含

- 不在前端实现真正的安全边界。
- 不实现组织树、部门管理或复杂 ABAC。
- 不扩展数据范围枚举，继续使用 `all/department/self`。
- 不实现服务端动态菜单。
- 不设计完整 IAM 产品。
- 不在当前前端仓库伪造 Java MockMvc 测试结果。

## 3. 推荐契约

### 3.1 角色字段

推荐统一为：

```yaml
User:
  roleCodes: string[]

CreateUserRequest:
  roleCodes: string[]

UpdateUserRequest:
  roleCodes: string[]

CurrentUser:
  roleCodes: string[]
```

如果为了兼容已有 Java DTO 必须暂时保留字段名 `roles`，其元素也必须明确为角色代码，并在描述和测试中固定该语义。更推荐一次性改为 `roleCodes`，消除歧义。

### 3.2 角色选项目录

用户编辑页面不应依赖完整的角色管理权限才能获得下拉选项。推荐增加轻量目录接口，例如：

```text
GET /api/role-options
```

响应：

```json
[
  { "code": "admin", "name": "系统管理员" },
  { "code": "operator", "name": "运营人员" }
]
```

服务端应只返回当前操作者允许分配的角色。接口权限建议与 `users:write` 或专门的 `users:assign-role` 对齐，而不是无条件复用 `roles:read`。

### 3.3 权限目录

角色编辑页面目前硬编码权限选项。推荐增加：

```text
GET /api/permissions
```

响应至少包含：

```json
[
  {
    "code": "users:read",
    "name": "查看用户",
    "group": "用户管理"
  }
]
```

需要明确：

- `*` 是否作为真实可分配权限返回，还是仅由系统管理员角色隐式拥有。
- 未知权限代码如何展示，推荐保留并以代码兜底，避免编辑后误删除新权限。
- 权限目录接口至少需要 `roles:read`，修改仍需 `roles:write`。

### 3.4 数据范围

继续使用：

- `all`
- `department`
- `self`

前端只负责提交和显示。Java 后端必须在 Service/Repository 查询层应用数据范围，不能仅在 Controller 或菜单层判断。

## 4. 实施任务

### 4.1 契约决策

- [ ] 确认将 `roles` 重命名为 `roleCodes`，或书面确认保留字段名但元素恒为角色代码。
- [ ] 确认角色选项目录接口路径和所需权限。
- [ ] 确认权限目录接口路径、分组字段和 `*` 的处理方式。
- [ ] 确认角色代码大小写、格式和不可变性规则。
- [ ] 确认删除/停用角色后用户记录的返回和编辑行为。

### 4.2 OpenAPI 与生成客户端

- [ ] 先修改 `openapi/admin-api.yaml`。
- [ ] 增加 `RoleOption`、`PermissionOption` 等必要 schema。
- [ ] 更新 `User`、`CreateUserRequest`、`UpdateUserRequest` 和 `CurrentUser`。
- [ ] 增加角色选项和权限目录 operation。
- [ ] 为 400、401、403 响应补齐引用。
- [ ] 执行 `pnpm generate:api`，不手改生成文件。
- [ ] 检查生成的 query key、请求 DTO 和响应 DTO 是否符合预期。

### 4.3 前端页面迁移

- [ ] 用户列表将角色代码映射为显示名称。
- [ ] 新增/编辑用户的角色下拉改为读取角色选项目录。
- [ ] 提交创建/更新请求时只发送角色代码。
- [ ] 处理角色目录加载中、失败、空列表和已停用角色。
- [ ] 角色页面改为读取权限目录，不再以 `PERMISSION_OPTIONS` 作为业务事实源。
- [ ] 对未知但已授予的权限代码提供安全兜底展示。
- [ ] 保持现有 `Permission` 组件和 route manifest 的权限代码语义不变。

### 4.4 Mock 单一来源

- [ ] MSW 数据全部改为角色代码。
- [ ] 用户数据和角色数据引用同一角色目录。
- [ ] 删除 `roleOptions` 页面硬编码。
- [ ] 删除或缩减重复的 `DEFAULT_ROLES/defaultRoles` 定义。
- [ ] 为角色选项、权限目录、未知角色和权限不足补充 handler。

### 4.5 Java 后端同步任务

- [ ] Java DTO 使用角色代码字段。
- [ ] 创建/更新用户时校验角色代码存在且允许被当前操作者分配。
- [ ] 暴露角色选项目录和权限目录。
- [ ] `GET /api/auth/session` 返回角色代码、权限代码和数据范围。
- [ ] Spring Security 对用户、角色和目录接口设置明确 authority。
- [ ] Service/Repository 应用 `all/department/self` 数据过滤。
- [ ] Java `/v3/api-docs` 与前端快照同步。

## 5. 预计涉及文件

前端/OpenAPI：

- `openapi/admin-api.yaml`
- `src/api/generated/**`（仅生成）
- `src/pages/UsersPage.tsx`
- `src/pages/RolesPage.tsx`
- `src/app/permissions.constants.ts`
- `src/app/permissions.types.ts`
- `src/mocks/handlers.ts`
- `src/app/permissions.test.ts`
- `e2e/admin.spec.ts`
- `docs/authorization.md`

如果 change 01 已完成，还需确认 route manifest 引用的权限代码不受 DTO 重命名影响。

## 6. 契约测试矩阵

### 前端 OpenAPI/类型

- [ ] `User.roleCodes` 与创建、更新请求一致。
- [ ] 会话用户的角色字段使用同一语义。
- [ ] 角色选项的 code/name 能生成稳定类型。
- [ ] 权限目录能表达 code/name/group。

### 前端 MSW/组件

- [ ] 用户编辑表单显示角色名称，提交角色代码。
- [ ] 服务端新增角色后无需修改用户页面硬编码即可出现。
- [ ] 当前用户无权分配某角色时，该角色不出现在可选目录中。
- [ ] 未知已分配角色不会导致页面崩溃或被静默删除。
- [ ] 角色页能展示并保存权限目录中的权限代码。
- [ ] 只有 `roles:read` 的用户只能查看，不能保存。

### Java 必须覆盖

- [ ] 无会话访问受保护接口返回 401。
- [ ] 缺少读/写 authority 分别返回 403。
- [ ] 提交不存在或不可分配角色代码返回 400 Problem Details。
- [ ] `department` 用户无法读取其他部门数据。
- [ ] `self` 用户只能读取本人创建或负责的数据。
- [ ] Controller 权限和 Service 数据范围均有测试，不能只测 UI。

## 7. 必跑命令

```bash
pnpm generate:api
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm e2e
```

Java 仓库应运行其对应的单元测试和集成测试命令。

## 8. 完成标准

- [ ] API 不再混用角色代码和显示名称。
- [ ] 用户页面没有硬编码角色列表。
- [ ] 角色页面的权限目录不再由页面内常量单独决定。
- [ ] Mock、OpenAPI、生成客户端和页面使用相同的 RBAC 语义。
- [ ] 数据范围的服务端职责在文档和测试中明确。
- [ ] 前端测试与 Java 安全测试的边界清晰，不用 MSW 冒充安全证明。

## 9. 交接提示

```text
$openspec-propose 
读取以下文件：
  - AGENTS.md
  - docs/capability-roadmap/analysis-report.md
为 docs/capability-roadmap/change-02-normalize-rbac-contracts.md
描述的范围创建 change，change id 使用 normalize-rbac-contracts。
先确认 roleCodes、角色选项目录和权限目录三个契约决策；OpenAPI 先行，
生成目录只能通过 pnpm generate:api 更新。不要包含统一错误框架或通用 CRUD 组件。
```

