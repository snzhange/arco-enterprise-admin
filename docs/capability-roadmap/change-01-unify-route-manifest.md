# Change 01：unify-route-manifest 落地清单

> 建议 OpenSpec change ID：`unify-route-manifest`  
> 优先级：P0  
> 依赖：无  
> 目标：用一份 route manifest 驱动路由、菜单、面包屑和路由权限守卫

## 1. 为什么先做

当前路由信息分散在 `routes.tsx`、`navigation.tsx` 和 `route-permissions.ts`，并已发生权限配置漂移：

- `/list/search-table` 的菜单权限与路由权限不一致。
- `/user/info` 的菜单权限与路由权限不一致。
- 页面组件、路径、菜单标题、面包屑和权限需要多处同步维护。

该 change 首先修复正确性问题，同时为后续统一错误边界和页面容器提供稳定的路由元数据入口。

## 2. 范围

### 包含

- 定义类型安全的 route manifest。
- 在 manifest 中声明受保护页面的路径、页面加载器、菜单元数据、权限和面包屑行为。
- 从 manifest 派生 React Router 路由。
- 从 manifest 派生侧边菜单、当前菜单组和面包屑。
- 让路由守卫直接读取同一条路由记录的权限。
- 表达公开路由、重定向路由、隐藏路由和无菜单的受保护路由。
- 增加 manifest 结构和权限一致性测试。
- 保持现有 URL、页面懒加载、菜单顺序和视觉行为不变。

### 不包含

- 不引入服务端动态路由。
- 不修改权限代码和角色数据模型。
- 不重构页面内容。
- 不实现新的菜单编辑后台。
- 不引入 Umi 或文件系统约定式路由。
- 不顺手统一 API 错误处理。

## 3. 推荐设计

### 3.1 单一事实源

建议建立类似以下结构，具体命名在 proposal/design 阶段确认：

```ts
interface RouteGroupManifest {
  key: string
  messageKey: MessageKey
  icon: ReactNode
  permission?: PermissionRequirement
  children: RouteManifestEntry[]
}

interface RouteManifestEntry {
  path: string
  load: () => Promise<{ default: ComponentType }>
  messageKey?: MessageKey
  permission?: PermissionRequirement
  menu?: boolean
  breadcrumb?: boolean
}
```

需要额外支持：

- `redirectTo`：`/`、`/dashboard` 等重定向。
- `public`：登录页等不进入会话守卫的页面。
- `menu: false`：`/welcome` 等隐藏页面。
- `breadcrumb: false`：结果页等不显示面包屑的页面。
- 兜底 404：不作为普通菜单项进入 manifest。

不要让每个页面自己再声明第二份权限元数据。

### 3.2 分组权限语义

推荐规则：

- 叶子路由的 `permission` 决定菜单项可见性和直接访问权限。
- 分组 `permission` 只作为额外约束，不代替叶子权限。
- 一个分组至少有一个可见子项时才显示。
- 如果分组和叶子都声明权限，则用户必须同时满足两者。

这样可以表达“整个模块受限”和“模块内页面分别受限”，同时避免当前菜单与守卫使用不同权限。

### 3.3 页面组件加载

继续使用 `React.lazy` 和 `Suspense`。manifest 可以保存：

- 已经包装成默认导出的 lazy factory；或
- 页面模块加载函数和导出名称。

推荐在 manifest 外提供小型 `lazyNamed` helper，避免每条记录重复编写 `.then(module => ({ default: module.X }))`，但不要扫描目录或引入代码生成。

## 4. 实施任务

### 4.1 建立 manifest 类型和数据

- [ ] 盘点当前全部公开路由、受保护路由、重定向和 404 行为。
- [ ] 定义 group、leaf、redirect、public/hidden 等必要类型。
- [ ] 新建唯一的应用 route manifest。
- [ ] 将现有菜单顺序、图标、i18n key、权限和面包屑配置迁移到 manifest。
- [ ] 修复 `/list/search-table` 和 `/user/info` 的权限漂移，以现有 `route-permissions.ts` 的模块权限为基准。
- [ ] 明确 `/welcome` 为受保护但不显示在菜单中的隐藏路由。

### 4.2 从 manifest 派生路由

- [ ] 用 manifest 渲染受保护页面的 `<Route>`。
- [ ] 让守卫接收当前 route entry，而不是再次按 pathname 查表。
- [ ] 保留登录页、ProtectedLayout、AppLayout、重定向和兜底 404 的现有语义。
- [ ] 保留 lazy fallback，避免所有页面一次性进入首包。
- [ ] 验证直接访问每条受保护 URL 都使用 manifest 中的权限。

### 4.3 从 manifest 派生导航和面包屑

- [ ] 重写可见菜单计算逻辑，使其读取 manifest。
- [ ] 从 manifest 获取当前分组和当前页面标题。
- [ ] 从 manifest 获取面包屑开关。
- [ ] 确认移动端、折叠菜单、展开组和当前选中项行为不变。
- [ ] 删除已经没有调用者的重复导航类型或权限映射。

### 4.4 自动一致性检查

- [ ] 测试所有叶子路由 path 唯一。
- [ ] 测试所有菜单项都对应一个真实路由。
- [ ] 测试受保护菜单项和路由守卫引用同一权限对象/值。
- [ ] 测试隐藏路由不会出现在菜单中但仍可被路由匹配。
- [ ] 测试未授权用户看不到菜单且直接访问得到 403。
- [ ] 测试具备权限的用户可以从菜单进入同一路由。

### 4.5 清理旧实现

- [ ] 删除 `src/app/route-permissions.ts`，或将其职责完全并入 manifest。
- [ ] 将 `navigation.tsx` 缩减为 manifest 派生 helper，或用新的 manifest 模块替代。
- [ ] 简化 `routes.tsx` 中逐条手工声明的页面路由。
- [ ] 更新与目录结构相关的 README 描述。

## 5. 预计涉及文件

可能新增：

- `src/app/route-manifest.tsx`
- `src/app/route-manifest.types.ts`
- `src/app/route-manifest.test.tsx`

可能修改：

- `src/app/routes.tsx`
- `src/app/navigation.tsx`
- `src/app/navigation.types.ts`
- `src/components/AppLayout.tsx`
- `src/app/i18n/messages.ts`（仅在发现缺失 key 时）
- `e2e/admin.spec.ts`
- `README.md`

可能删除：

- `src/app/route-permissions.ts`

实际文件名以项目既有命名习惯为准，不要求照搬以上名称。

## 6. 测试与验证

### 单元测试

- manifest path 唯一性。
- 菜单项与路由记录一一对应。
- admin、operator 和自定义最小权限用户的可见菜单矩阵。
- group/leaf 权限组合语义。
- `breadcrumb: false` 和 `menu: false` 行为。

### E2E

- 管理员逐一打开全部菜单路由。
- operator 只能看到允许的系统管理菜单。
- operator 直接访问 `/roles` 得到 403。
- 构造仅有 `list:read`、没有 `dashboard:read` 的用户，仍能看到并访问查询表格。
- 构造仅有 `user:read` 的用户，仍能看到并访问用户信息。

### 必跑命令

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm e2e
```

## 7. 完成标准

- [ ] 新增受保护菜单页面只需在一份 manifest 中登记。
- [ ] 菜单权限和路由权限无法再分别配置。
- [ ] 当前所有 URL、重定向、菜单顺序和面包屑表现保持兼容。
- [ ] 已知两处权限漂移得到回归测试覆盖。
- [ ] 不再存在独立的 pathname -> permission 手工映射。
- [ ] 没有引入服务端动态路由或 Umi 依赖。

## 8. 交接提示

新会话建议输入：

```text
$openspec-propose   
读取以下文件：
  - AGENTS.md
  - docs/capability-roadmap/analysis-report.md
  - docs/capability-roadmap/change-01-unify-route-manifest.md
为 `change-01-unify-route-manifest.md` 描述的范围创建 change，change id 使用 unify-route-manifest。
先核对当前路由、菜单和权限实现，以清单为范围上限，不包含 RBAC DTO、
统一错误处理或企业页面组件。
```

