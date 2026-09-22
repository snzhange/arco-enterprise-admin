# 提案

## 背景与动机

当前应用把同一条页面路由的路径、菜单元数据和权限分别维护在 `routes.tsx`、`navigation.tsx` 与 `route-permissions.ts` 中。已有配置漂移：`/list/search-table` 的菜单使用 `dashboard:read` 而守卫使用 `list:read`，`/user/info` 也存在同类不一致，导致用户看到的菜单与直接访问结果可能不同。

现在先统一路由元数据，可以修复这类正确性问题，并为后续错误边界和页面模式 change 提供稳定的路由入口，同时不改变当前页面和 URL 行为。

## 变更内容

- 新增类型安全的静态 route manifest，集中声明公开页面、重定向、受保护页面、分组、隐藏路由、菜单标题、图标、权限和面包屑规则。
- 从同一份 manifest 派生 React Router 路由、可见侧边菜单、当前菜单组、当前菜单项和面包屑。
- 让路由守卫直接消费匹配到的 route entry 权限；分组权限与叶子权限按既定的同时满足语义计算。
- 保留登录页、ProtectedLayout、AppLayout、兜底 404、现有 URL、重定向、懒加载 fallback、菜单顺序、折叠菜单和视觉表现。
- 将 `/list/search-table` 与 `/user/info` 的菜单权限校正为现有路由权限基准，并为该行为增加回归覆盖。
- 表达 `/welcome` 这类受保护但不显示在菜单中的路由，以及结果页的 `breadcrumb: false` 行为。
- 增加 manifest 结构、路径唯一性、菜单与路由对应关系、权限一致性、隐藏路由和面包屑行为测试，并补充必要的导航 E2E 覆盖。
- 删除或完全收拢不再需要的 pathname 到权限独立映射和重复导航类型；不改变页面组件内容。

明确不包含：服务端动态路由、Umi 或文件系统路由、RBAC DTO/角色数据模型、统一 API 错误处理、菜单编辑后台、企业页面组件或页面内容重构。

## 能力

### 新增能力

- `route-manifest`：以一份静态、类型安全的 manifest 同时驱动路由匹配、菜单可见性、当前导航上下文、面包屑和前端权限守卫，并提供结构与权限一致性保证。

### 修改能力

无既有 OpenSpec capability；当前 `openspec/specs/` 仅有占位文件。

## 影响

- 主要涉及 `src/app/routes.tsx`、`src/app/navigation.tsx`、导航类型和权限映射，以及 `src/components/AppLayout.tsx`。
- 可能新增 route manifest 类型、数据和单元测试，更新相关 E2E 与 README；`src/api/generated`、OpenAPI 和后端契约不变。
- React Router、React.lazy、Suspense、现有权限 helper 和 Java 服务端最终鉴权边界保持不变；本 change 只统一前端路由元数据来源。
