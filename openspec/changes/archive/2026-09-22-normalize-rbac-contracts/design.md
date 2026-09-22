# 设计

## 背景

当前 OpenAPI 和生成客户端把角色字段命名为 `roles`，但用户页面提交中文名称，Mock 又维护了另一份角色数据。角色页面直接依赖 `PERMISSION_OPTIONS`，因此目录变化无法通过服务端契约传递到页面。现有路由权限代码已经由 route manifest 统一，本设计只处理 RBAC 数据契约，不改路由权限行为，也不引入统一错误框架或通用 CRUD 组件。

## 目标与非目标

**目标：**

- 以 OpenAPI 先行的方式建立 `roleCodes`、角色选项和权限选项的可生成契约。
- 让用户页和角色页通过 TanStack Query 读取运行时目录，并保留停用角色和未知权限。
- 让 Mock 数据、会话数据和页面展示使用同一份代码语义，并覆盖目录权限边界。
- 在前端文档中明确 Java Spring Security authority 和 Service/Repository 数据范围责任。

**非目标：**

- 不做 `roles` 到 `roleCodes` 的长期双字段兼容层；这是一次协调发布的破坏性契约变更。
- 不新增组织树、ABAC、动态菜单或数据范围枚举。
- 不在本仓库实现 Java Controller、Service 或 MockMvc；只提交同步契约与验收清单。
- 不抽取 DataTable、查询表单或 CRUD 抽屉等通用组件。

## 决策

### 1. 角色代码和显示名称分离

OpenAPI 增加可复用的 `RoleCode` 约束，并将 `CurrentUser`、`User`、`CreateUserRequest`、`UpdateUserRequest` 的 `roles` 全部替换为 `roleCodes`。代码使用小写 kebab-case（`admin`、`list-reader`），服务端创建后不可变；显示名称只来自 `RoleOption`。选择保留兼容别名或继续使用 `roles` 会让 Java DTO 和前端生成类型继续产生歧义，因此不采用双写方案。

### 2. 角色选项目录的接口和权限

新增 `GET /api/role-options`，响应为 `RoleOption[]`：

```yaml
RoleOption:
  code: string
  name: string
  active: boolean
```

接口使用 `users:write` authority。角色分配是用户写操作的一部分，沿用该 authority 可以避免为同一业务动作引入无法独立管理的新权限；只有 `users:read` 的用户不会收到目录。服务端可返回操作者分配范围内的停用角色，前端将其标记为只读保留项；创建新分配时服务端仍拒绝停用代码。

### 3. 权限目录和通配权限

新增 `GET /api/permissions`，响应为 `PermissionOption[]`：

```yaml
PermissionOption:
  code: string
  name: string
  group: string
  assignable: boolean
```

接口使用 `roles:read` authority，角色更新仍使用 `roles:write`。`*` 作为目录中的系统项返回但 `assignable: false`，只由服务端为系统管理员角色保留；这样既能让管理员看到已有状态，也不会把全量权限误授予普通角色。角色页会把响应中不在目录的已授予代码追加为 `assignable: false` 的兜底项，并在提交时合并回原数组。

### 4. OpenAPI、生成客户端与页面边界

先编辑 `openapi/admin-api.yaml`，补充 schemas、operations 和 401/403/400 引用，再执行 `pnpm generate:api`。`src/api/generated/**` 只接受该命令产生的差异，不手工修补生成文件。生成的 `useListRoleOptions`、`useListPermissions` 和对应 query key 由页面直接使用；页面只负责查询状态、目录映射和请求参数，不让目录组件直接发请求。

用户页在 `users:write` 可用时查询角色目录。编辑已有用户时，将响应中对应的 `RoleOption` 映射成显示名称；若角色已停用或目录暂时没有该代码，则追加不可选的代码兜底项。目录加载失败或为空时禁用保存，避免回退到旧硬编码数组。

角色页同时查询角色列表和权限目录。权限选项按 `group` 分组，未知权限和 `*` 以只读项保留；保存请求只发送权限代码和 `dataScope`。`roles:read` 用户可查看，`roles:write` 决定编辑和保存控件，服务端仍是最终边界。

### 5. Mock 的单一数据来源

新增 Mock 专用的 RBAC 数据模块（例如 `src/mocks/rbac.ts`），集中定义角色目录、权限目录、角色摘要和测试用户使用的角色代码。`src/mocks/handlers.ts` 只引用该模块并实现 HTTP 行为，不再维护 `defaultRoles` 与页面显示名称数组的第二份副本。用户初始数据全部使用 `roleCodes`；handler 对目录接口按与生产约定相同的 authority 返回 401/403，并保留 sessionStorage 的角色权限编辑持久化。

### 6. 服务端数据范围责任

文档和契约测试明确：`all`、`department`、`self` 只是 API 值，Java 必须在 Service/Repository 查询层应用过滤，不能仅在 Controller 或前端做判断。前端测试只证明请求字段、目录映射和交互边界，不把 MSW 结果当作 Spring Security 或数据范围安全证明。

## 风险与取舍

- **[破坏性字段变更]** 旧 Java 服务仍返回 `roles` 时页面无法工作 → 在同一发布窗口先同步 Java DTO 和 `/v3/api-docs`，生成客户端后再部署前端；不保留隐式双字段。
- **[目录请求被拒绝]** 只有 `users:read` 的用户可能打开用户页但不能加载角色选项 → 角色目录查询按 `canEdit` 条件启用，并显示只读/无权限状态。
- **[未知权限丢失]** 服务端新增权限早于前端目录发布可能导致保存覆盖 → 未知代码作为不可编辑项合并进提交 payload，并增加回归测试。
- **[通配权限误授予]** `*` 被当作普通 checkbox 处理会扩大权限 → `assignable` 是契约字段，UI 禁用，Mock 和 Java 校验同时拒绝普通角色。
- **[生成文件漂移]** 手工编辑生成目录会造成不可复现差异 → 任务顺序固定为 OpenAPI、`pnpm generate:api`、类型检查，并在提交前检查生成目录 diff。

## 迁移计划

1. 修改 `openapi/admin-api.yaml`，确认 schema、operation、authority 描述和错误响应；运行 `pnpm generate:api`。
2. 更新页面、权限类型、Mock、文档和前端契约测试；删除旧 `roles`/显示名称数据源。
3. 在 Java 仓库同步 DTO、目录接口、authority、角色代码校验、数据范围过滤及安全测试，并以 `/v3/api-docs` 校验字段一致性。
4. 运行 `pnpm typecheck`、`pnpm lint`、`pnpm test`、`pnpm build` 和 `pnpm e2e`；确认生成目录没有手工差异。

回滚必须与 Java 服务端协调：若后端尚未支持 `roleCodes`，回滚前端与后端版本到同一旧契约；不在运行时同时猜测两个字段的含义。

## 可延期问题

无。角色代码格式、两个目录路径及其 authority、通配权限处理均已在本 change 中确定；后续只需按该设计实现 Java 侧细节。
