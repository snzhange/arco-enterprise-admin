# Arco Enterprise Admin

基于最新 Arco Design React 组件库搭建的现代企业管理后台脚手架。项目刻意跳过旧版 Arco Design Pro，采用可独立升级的 Vite + React 18.3 工程，并保留清晰的应用层约定。

## 特性

- Arco Design React `2.66.16`，对应官方发布提交 `fbf2ec0a8cc28a5d20f1f82de6c2c4196ef66950`
- Arco Pro 官方主题包 `@arco-themes/react-arco-pro@0.0.7`
- 官方仓库最新 `main` 源码快照位于 `vendor/arco-design`，当前提交 `c2b050d9c7ce94bebba94f616a0721344231caac`
- React 18.3、Vite 8、TypeScript strict、React Router 7（Arco 2.66.16 的稳定运行路径）
- TanStack Query 统一服务端状态和缓存
- Orval 从 OpenAPI 生成类型安全的 Axios + React Query 客户端
- MSW 开发模拟，默认覆盖登录、会话、仪表盘和用户 CRUD
- Vitest 单元测试、Playwright 浏览器测试、ESLint + antfu 代码规范
- HttpOnly Cookie、XSRF 约定、RFC 9457 Problem Details 错误模型
- 响应式官方布局：`60px` 顶栏、`220px / 48px` 侧栏、面包屑、白色业务 Card、居中页脚
- 官方登录页结构：`550px` 深蓝轮播区、官方插画、`320px` 紧凑表单
- 官方全局能力：通知面板、设置抽屉、主题色、明暗主题、语言切换、色弱模式、菜单宽度和区域开关
- 权限基础设施：路由/菜单权限元数据、`<Permission>` 操作组件、角色与数据范围页面、403 路由守卫
- 官方页面矩阵：工作台、实时监控、数据分析、多维数据分析、查询表格、卡片列表、分组表单、分步表单、基础详情、成功/失败结果、403/404/500 异常、用户信息、用户设置；另有隐藏 `/welcome` 物料说明页

工作台视觉按 Arco Design Pro 的 `workplace` 模板组织：白色页面基底、`Overview` 统计卡、热门内容表格、内容占比、快捷操作、公告和文档区；侧栏遵循官方 `220px / 48px` 宽度和 `60px` 顶部导航布局。

## 启动

要求 Node `>=22.12.0`、pnpm `>=8.15.0`：

```bash
pnpm install
pnpm dev
```

默认开启 MSW，打开 `http://localhost:5173/login`，示例账号为：

```text
邮箱：admin@arco.dev
密码：admin1234
```

权限演示账号：

```text
邮箱：operator@arco.dev
密码：operator1234
```

运营账号拥有只读用户权限，没有角色管理权限，可用于验证菜单过滤、路由 403 和按钮级权限。

最小路由权限演示账号：

```text
列表账号：list-reader@arco.dev / listreader1234（仅 list:read）
个人中心账号：user-reader@arco.dev / userreader1234（仅 user:read）
```

路由、菜单、面包屑和页面权限统一登记在 `src/app/route-manifest.tsx`；新增受保护页面时无需再维护 pathname 权限映射。

## 接入 Spring Boot

1. 使用 Spring Boot 3、Spring Security 和 `springdoc-openapi`，让 Java DTO/Controller 生成 `/v3/api-docs`。
2. 将 `orval.config.ts` 的 `input.target` 改为后端地址，例如 `http://localhost:8080/v3/api-docs`。
3. 执行 `pnpm generate:api`，生成结果写入 `src/api/generated`。
4. 执行 `pnpm check:api`，校验 OpenAPI、重新生成客户端、检查 `src/api/generated` 零 diff 并运行类型检查。
   当前前端仓库没有 Java 服务端基线，因此该命令不做跨仓库 breaking-change 比较；Spring Security 的 401/403 和数据范围契约由 Java 仓库测试负责。
5. 生产环境使用同源网关，让前端请求保持 `/api/...`；本地通过 `VITE_API_PROXY_TARGET` 代理。
6. 登录接口写入 HttpOnly、Secure、SameSite 会话 Cookie；不要在响应体或 localStorage 返回长期 Token。
7. Java 的 `Page<T>` 建议映射到契约中的 `content/page/size/totalElements/totalPages`。

当前 `openapi/admin-api.yaml` 是可运行示例契约，接入真实后端时应由 Java 的 `/v3/api-docs` 替换，而不是长期维护两份模型。

权限模型和 Spring Security 对接说明见 [docs/authorization.md](docs/authorization.md)。

## 目录

```text
src/
  api/              HTTP 客户端、OpenAPI 生成代码
  components/       应用布局
  app/              route manifest、认证、权限派生 helper 和全局设置
  mocks/            MSW handlers
  pages/            仪表盘、用户、角色、登录页
  test/             测试初始化
openapi/            Java 对接用示例契约
vendor/arco-design/ 最新 Arco Design 源码快照
```

## 官方对照基线

官方 Arco Design Pro 完整源码归档位于 `vendor/arco-design-pro-official`，提交为 `bb6aebcceca6b294b438be4c13dc7328ee80d70b`。该目录用于页面结构、布局尺寸、主题变量和交互行为对照；业务运行时使用现代化的 Vite + React 实现，不依赖旧版 Next.js 工程。

页面对应关系：

| 官方页面族 | 当前路由 |
| --- | --- |
| Dashboard | `/dashboard/workplace`、`/dashboard/monitor` |
| Data Visualization | `/visualization/data-analysis`、`/visualization/multi-dimension-data-analysis` |
| List | `/list/search-table`、`/list/card` |
| Form | `/form/group`、`/form/step` |
| Profile / Result / Exception | `/profile/basic`、`/result/*`、`/exception/*` |
| User Center | `/user/info`、`/user/setting` |
| System Access | `/roles`、`/users` |
| Welcome (ignore route) | `/welcome` |
| Login | `/login` |

截图校验覆盖桌面 `1440px`、断点 `900px` 和移动端 `390px`；页面级 E2E 会逐一打开官方路由并检查运行时错误。

## 验证

```bash
pnpm check:api
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm e2e
```

`vendor/arco-design` 是源码参考和升级对照，不参与业务构建。运行时依赖通过 `pnpm-lock.yaml` 固定，便于 CI 和生产复现。
