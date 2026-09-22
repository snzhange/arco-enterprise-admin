# 任务

## 1. 建立 manifest 基础

- [x] 1.1 盘点现有公开入口、重定向、受保护页面、隐藏页面和 404 行为，并形成 manifest 覆盖清单；通过路径清单测试确认没有遗漏或新增未授权入口
- [x] 1.2 定义页面、分组、重定向和公开入口的可区分 TypeScript 类型，以及绝对路径和菜单/面包屑元数据约束；运行 `pnpm typecheck` 确认类型边界成立
- [x] 1.3 增加命名导出到懒加载组件的适配 helper，并将现有页面加载入口登记到唯一 manifest；运行懒加载路由测试确认按需加载和加载反馈仍可用
- [x] 1.4 将现有菜单顺序、图标、i18n key、分组权限和叶子权限迁移到 manifest，按 `route-permissions.ts` 的模块权限校正 `/list/search-table` 与 `/user/info`；通过 manifest 数据断言确认两条记录分别使用 `list:read` 与 `user:read`
- [x] 1.5 实现路径索引、分组/叶子权限联合评估和可见导航派生 helper；运行权限矩阵单元测试确认分组与叶子权限按 AND 语义计算

## 2. 接入路由与守卫

- [x] 2.1 用 manifest 页面记录生成现有受保护页面路由，并保留公开登录页、根路径和仪表盘重定向、ProtectedLayout 及 catch-all 404；通过路由渲染测试验证所有既有 URL 和重定向目标
- [x] 2.2 让权限守卫接收匹配的 route entry 和其权限要求，移除运行时对独立 pathname 权限表的依赖；通过未授权 `/roles` 和最小权限页面测试确认直接访问结果与菜单一致
- [x] 2.3 统一包裹现有 `LazyPage` fallback，保持会话查询、未登录跳转、页面懒加载和错误页边界不变；运行路由加载测试确认首次访问仍显示加载反馈且未知路径仍进入 404

## 3. 接入菜单与布局

- [x] 3.1 从 manifest 派生可见分组和子项，保留声明顺序、分组权限、至少一个可见子项才显示的规则；通过 admin、operator 和最小权限用户矩阵测试确认菜单结果
- [x] 3.2 从同一条匹配记录派生当前分组、当前项和面包屑，并更新 `AppLayout` 的选中态、展开态和 `breadcrumb: false` 判断；通过结果页、普通页面和折叠菜单测试确认现有布局行为
- [x] 3.3 将 `/welcome` 标记为会话保护范围内的隐藏路由，保留用户菜单入口且不加入侧边菜单；通过直接访问和菜单可见性测试确认隐藏页面仍可用
- [x] 3.4 保留现有用户菜单、移动断点和视觉选择器，删除已无调用者的重复导航类型或适配代码；运行 `pnpm lint` 并搜索旧导出引用确认清理完整

## 4. 建立一致性回归

- [x] 4.1 增加 manifest 结构单元测试，覆盖叶子路径唯一、每个菜单项对应真实路由、公开/隐藏分类和无独立 pathname 权限映射；运行 `pnpm test` 确认结构断言通过
- [x] 4.2 增加分组/叶子权限矩阵测试，覆盖管理员、operator、仅 `list:read`、仅 `user:read` 及无 `roles:read` 用户；确认菜单可见性和直接访问结果逐项一致
- [x] 4.3 增加路由行为测试，覆盖登录重定向、根路径/仪表盘重定向、404、懒加载 fallback、`/welcome` 和结果页面包屑开关；运行目标测试文件确认现有兼容行为
- [x] 4.4 更新管理员和 operator E2E，继续覆盖全量菜单导航、受限 `/roles` 和折叠菜单；运行 `pnpm e2e` 确认 URL、页面内容和无权限提示保持稳定
- [x] 4.5 在 Mock 会话场景中加入仅有 `list:read` 或仅有 `user:read` 的测试用户，并补充从菜单和直接 URL 进入两个页面的 E2E；运行对应 Playwright 用例确认两处权限漂移不会回归

## 5. 清理与交付验证

- [x] 5.1 删除或完全收拢 `src/app/route-permissions.ts`，更新 README 中与路由目录或维护入口相关的描述；通过 `rg` 确认不存在独立 pathname 到 permission 的生产调用
- [x] 5.2 检查变更只涉及 manifest、路由、导航、布局、测试和必要文档，不修改 `src/api/generated`、OpenAPI、RBAC DTO 或错误处理；通过 `git diff --name-only` 与人工范围审查确认边界
- [x] 5.3 执行 `pnpm typecheck`、`pnpm lint`、`pnpm test`、`pnpm build` 和 `pnpm e2e`，并用 `git diff --check` 检查格式；记录全部命令通过后再提交 change
