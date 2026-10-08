# 基于 Arco Enterprise Admin 搭建新后台系统

本文说明如何把当前仓库作为前端基线，复制到一个新的代码仓库，并从示例后台逐步替换成真实业务系统。

适用技术栈：React 18.3、Vite 8、TypeScript strict、Arco Design React、React Router 7、TanStack Query、Orval、Axios 和 Playwright。示例默认按 Java Spring Boot + Spring Security + springdoc-openapi 后端设计，也可以替换成其他能够提供 OpenAPI 契约和 Cookie 会话的后端。

## 先确定复制边界

这个仓库包含三类代码，复制时要区别处理：

| 类型 | 目录或文件 | 新项目处理方式 |
| --- | --- | --- |
| 平台基础设施 | `src/app`、`src/components`、`src/hooks`、`src/test`、`src/api/http.ts`、`src/api/errors.ts` | 可以作为基线复制，再按业务调整 |
| 示例业务 | `src/pages`、`src/mocks`、`openapi/admin-api.yaml`、官方展示页和示例图片 | 只复制结构，替换 DTO、路由、文案和数据 |
| 生成或构建产物 | `src/api/generated`、`dist`、`coverage`、`test-results`、`playwright-report`、`node_modules` | 不手工复制；按命令重新生成 |

`vendor/arco-design` 只用于源码和视觉对照，不参与运行时构建。新项目通常不需要复制它；只有在需要离线查阅 Arco 源码时才保留。

不要把 `src/api/generated` 当成业务代码改。它必须由 OpenAPI 生成。不要把 `src/mocks` 当成生产数据层；Mock 只在 `VITE_ENABLE_MOCK=true` 时启用。

## 推荐的复制方式

最理想的方式是把当前仓库维护成一个内部模板仓库，新的业务项目从模板创建分支。若暂时只能复制目录，可以使用下面的方式，避免带入依赖和历史产物：

```bash
export TEMPLATE_DIR="$HOME/Documents/IdeaProjects/fe/arco-enterprise-admin"
export TARGET_DIR="$HOME/Documents/IdeaProjects/fe/my-admin"

mkdir -p "$TARGET_DIR"
rsync -a \
  --exclude .git \
  --exclude node_modules \
  --exclude dist \
  --exclude coverage \
  --exclude test-results \
  --exclude playwright-report \
  --exclude .worktrees \
  "$TEMPLATE_DIR"/ "$TARGET_DIR"/

cd "$TARGET_DIR"
rm -rf .git
git init
```

复制完成后，先修改项目身份信息，再安装依赖：

```bash
pnpm install
cp .env.example .env.development
```

建议第一笔提交只包含“模板复制和项目重命名”，不要在同一个提交里混入业务页面。这样后续可以清楚区分平台基线和业务代码。

## 第一步：修改项目身份

至少修改以下内容：

1. `package.json` 的 `name`、`version` 和 `description`。
2. `README.md`，说明新系统的业务范围、启动方式和测试账号。
3. `index.html` 的 `<title>` 和 favicon。
4. `src/assets` 中的 Logo、登录插画和轮播图。
5. `src/index.css` 中的品牌色、字体和产品名称。
6. `src/app/i18n/messages.ts` 中的菜单、标题和全局文案。
7. `.env.example` 中的 Mock 开关、API 代理地址和 API 基地址。
8. GitHub Actions、发布脚本和制品名称中的项目名。

如果新项目不需要官方 Arco Pro 展示页，可以删除 `src/pages/official`、`src/official-pages.css` 和对应的视觉快照，再从业务页面开始搭建。若保留展示页，必须在路由矩阵中明确它们是示例页面，不能把示例 API 当作真实业务契约。

## 第二步：先确定后端契约

新项目应该先确定 OpenAPI，再编写页面。后端可以直接提供 Springdoc 的 `/v3/api-docs`，也可以在前端仓库暂时维护一份经过评审的 YAML 文件。

### 最小契约

至少需要明确以下接口和响应：

| 能力 | 推荐接口 | 前端用途 |
| --- | --- | --- |
| 当前会话 | `GET /api/auth/session` | 启动时判断登录状态和当前用户权限 |
| 登录 | `POST /api/auth/login` | 写入 HttpOnly 会话 Cookie |
| 登出 | `POST /api/auth/logout` | 清理服务端会话 |
| 业务查询 | `GET /api/...` | 通过 TanStack Query 获取数据 |
| 业务写入 | `POST`、`PATCH`、`DELETE` | 通过生成的 mutation hook 提交 |

建议所有错误使用 RFC 9457 Problem Details，并至少包含：

```json
{
  "type": "https://example.com/problems/validation",
  "title": "请求参数有误",
  "status": 400,
  "detail": "请检查表单字段",
  "code": "VALIDATION_ERROR",
  "traceId": "trace-20260930-001",
  "fieldErrors": [
    { "field": "email", "message": "邮箱已经存在" }
  ]
}
```

服务端分页建议固定为：

```json
{
  "content": [],
  "page": 0,
  "size": 20,
  "totalElements": 0,
  "totalPages": 0
}
```

页面显示的页码从 1 开始，接口的 `page` 从 0 开始。这个转换要在页面测试和 E2E 中验证。

### 配置 Orval

把 `orval.config.ts` 中的 `adminApi.input.target` 改为 `'http://localhost:8080/v3/api-docs'`，保留现有 `output` 配置。

生产项目更推荐把后端导出的契约下载到仓库，例如 `openapi/admin-api.yaml`，再在 CI 中检查它和 Java 服务导出的版本是否一致。生成代码只通过命令更新：

```bash
pnpm generate:api
pnpm check:api
```

页面只使用 `src/api/generated` 中的类型、查询 hook、mutation hook 和 query key。页面组件不要直接导入 Axios；Axios 只应位于请求适配层和生成代码中。

### 请求层的职责

复制 `src/api/http.ts` 和 `src/api/errors.ts` 后，按新后端确认：

- `baseURL` 是否保持同源，生产是否由网关转发 `/api`。
- `withCredentials`、XSRF Cookie 名称和 Header 名称是否与后端一致。
- 401 是否表示会话失效，403 是否表示权限不足。
- 400/422 是否包含字段错误。
- 5xx、超时、网络错误和取消请求是否显示不同反馈。
- 是否需要为登录、登出、会话探测和普通业务请求区分错误策略。

不要在响应体、`localStorage` 或 `sessionStorage` 中保存长期 Token。生产认证使用 `HttpOnly`、`Secure`、`SameSite` Cookie；前端权限只负责菜单和交互体验，Spring Security 必须在服务端再次鉴权。

## 第三步：替换认证和会话

当前基线的认证入口主要由以下文件组成：

| 文件 | 职责 |
| --- | --- |
| `src/pages/LoginPage.tsx` | 登录表单、校验和回跳 |
| `src/app/routes.tsx` | 当前会话探测、公开路由和受保护路由 |
| `src/app/auth.tsx` | 向页面提供当前用户 |
| `src/app/session-expired.ts` | 协调业务请求中的 401 |
| `src/app/session-cache.ts` | 清理账号切换后的旧查询缓存 |
| `src/api/generated/admin-api.ts` | 当前用户、登录、登出等生成请求 |

接入新后端时按下面顺序替换：

1. 用真实后端返回的 `CurrentUser` 替换示例用户模型。
2. 确认 `GET /api/auth/session` 在未登录时返回 401，而不是把网络异常和 5xx 也当成未登录。
3. 登录成功后让后端写入会话 Cookie，前端只跳转到安全的内部回跳地址。
4. 登出成功后调用 `clearSessionCache`，取消旧请求并清理旧账号缓存。
5. 业务请求收到 401 时统一跳转登录页；页面不要各自实现跳转。
6. 业务请求收到 403 时保留当前页面上下文并显示无权限状态。
7. 为会话网络失败、会话 5xx、业务 401、业务 403 各增加至少一个测试。

Mock 登录可以继续使用 Cookie 模拟，但 Mock Cookie 只能出现在开发和测试环境，不能作为生产认证方案。

## 第四步：重新设计路由、菜单和权限

路由、菜单、面包屑和页面权限统一登记在 `src/app/route-manifest.tsx`。新项目不要同时维护一份 pathname 权限表和一份菜单权限表，否则很容易出现“菜单隐藏但直接访问可用”的漂移。

一个业务页面的最小登记形式如下。先通过 `lazyNamed` 声明 `OrdersPage`，再把 `ordersRoute` 加入业务分组的 `children` 数组：

```tsx
export const ordersRoute = {
  kind: 'page' as const,
  path: '/orders',
  component: OrdersPage,
  messageKey: 'menu.business.orders',
  permission: { all: [PERMISSIONS.ordersRead] },
}
```

新增页面时同步修改：

1. `src/app/route-manifest.tsx`：路由、分组、图标、面包屑、权限。
2. `src/app/i18n/messages.ts`：中文和英文菜单、标题、面包屑文案。
3. `src/app/permissions.constants.ts`：稳定的权限代码。
4. `src/app/route-manifest.test.tsx`：路径唯一、菜单可达、权限前置和隐藏路由测试。
5. `docs/official-page-coverage-matrix.md` 或新项目对应的页面矩阵：页面分类和验收方式。

权限有三层：

- **菜单权限**：决定用户是否看见菜单。
- **路由权限**：决定用户直接访问 URL 时是否进入 403。
- **操作权限**：决定新增、编辑、删除、导出等按钮是否展示或可用。

前端权限不能代替服务端权限。后端应按接口、角色和数据范围再次判断，例如 `all`、`department`、`self`。

## 第五步：选择页面实现模式

不要从零复制一整套页面。先按数据来源选择模式。

### 服务端分页列表

以 `src/pages/UsersPage.tsx` 为结构参考，通常组合：

- `PageContainer`：页面标题、说明和操作区。
- `QueryForm`：查询字段、重置和高级筛选。
- `DataTable`：加载、错误、空状态、分页和刷新。
- `DetailPanel`：详情抽屉中的只读字段。
- `CrudDrawer`：新增和编辑表单。
- `useListQueryState`：URL 中可分享的分页、排序和非敏感筛选。

页面需要明确处理：

```text
首次加载 → 背景刷新 → 成功有数据 → 成功无数据 → 失败可重试
提交中 → 成功精确失效缓存 → 字段错误保留表单 → 403 保留上下文
```

姓名、邮箱、手机号等敏感关键词不要放进 URL。筛选、排序和页大小变化时清空旧的行选择。mutation 成功后只失效相关 query key，不要无差别清空整个 QueryClient。

### 本地数据列表

没有后端接口的展示页面可以参考 `src/pages/official/SearchTablePage.tsx`，但要明确它是本地数据模式。不要让展示示例看起来像真实 API 页面，也不要把本地假数据复制进生产业务模块。

### 仪表盘和只读页面

仪表盘可参考 `src/pages/DashboardPage.tsx`。页面不必强行套用表格抽象，但仍要有加载、错误和无数据状态。纯展示图表可用视觉回归和隔离渲染测试验收；有业务操作的页面必须补行为测试。

## 复制文件清单

下面的清单适合新项目逐项处理：

| 当前文件 | 建议操作 |
| --- | --- |
| `src/app/routes.tsx` | 保留受保护路由结构，替换业务页面和公开路由 |
| `src/app/route-manifest.tsx` | 删除示例路由，重新登记业务路由 |
| `src/app/route-manifest.types.ts` | 通常直接复用 |
| `src/app/auth.tsx` | 复用上下文；按真实用户 DTO 调整类型 |
| `src/app/session-expired.ts`、`session-cache.ts` | 复用，会话接口改变时补测试 |
| `src/app/settings` | 复用主题、语言、菜单宽度和持久化设置 |
| `src/components/AppLayout.tsx` | 复用布局，替换 Logo、菜单和全局操作 |
| `src/components/data`、`src/components/form`、`src/components/page` | 复用基础组件，保持组件不直接发请求 |
| `src/pages/UsersPage.tsx` | 作为服务端分页 CRUD 样例，替换成业务实体 |
| `src/pages/RolesPage.tsx` | 只有需要 RBAC 管理时才保留 |
| `src/pages/LoginPage.tsx` | 复用页面骨架，替换品牌和登录字段 |
| `src/api/http.ts`、`src/api/errors.ts` | 复用请求和错误边界，按后端约定调整 |
| `src/api/generated` | 删除后运行 `pnpm generate:api`，禁止手改 |
| `src/mocks` | 开发期可改造；没有 Mock 需求时删除并关闭开关 |
| `openapi/admin-api.yaml` | 只作为临时示例，替换为真实契约 |
| `src/pages/official`、`src/official-pages.css` | 按需保留，不要当作真实业务模板批量复制 |
| `e2e/admin.spec.ts` | 保留测试结构，替换登录账号、路由和关键业务流程 |
| `e2e/visual.spec.ts` | 只保留需要视觉回归的页面，并重新生成 Linux 基线 |
| `coverage`、`dist`、`test-results`、`playwright-report` | 不复制，不提交 |

## Mock 的使用规则

开发期可以先让页面在没有 Java 后端时运行，但 Mock 必须明确隔离：

```dotenv
VITE_ENABLE_MOCK=true
```

接入真实后端时：

```dotenv
VITE_ENABLE_MOCK=false
VITE_API_PROXY_TARGET=http://localhost:8080
VITE_API_BASE_URL=
```

建议每个 Mock handler 至少覆盖：

- 正常返回。
- 未登录 401。
- 无权限 403。
- 字段校验 400/422。
- 服务异常 500。
- 空列表和分页边界。

测试之间要调用 `resetMockStateForTests` 重置可变 Mock 数据。`server.resetHandlers()` 只适合临时覆盖 handler，不应代替业务状态复位。

## 测试和质量门禁

新项目至少保留以下验证层：

| 层级 | 验证内容 |
| --- | --- |
| TypeScript | DTO、组件参数、路由和表单类型 |
| ESLint | 代码风格、React 规则和未使用代码 |
| Vitest | helper、hook、请求层和页面行为 |
| 页面集成测试 | 请求参数、请求体、缓存失效、权限和字段错误 |
| 功能 E2E | 登录、导航、核心业务正向流程和关键失败路径 |
| 视觉 E2E | 工作台、列表、抽屉等稳定的关键页面 |
| API 检查 | OpenAPI 有效、生成代码零 diff、类型检查通过 |
| 构建检查 | 产物可构建，入口和资源不超过预算 |

本地建议按顺序执行：

```bash
pnpm check:api
pnpm typecheck
pnpm lint
pnpm test
pnpm test:coverage:directories
pnpm build
pnpm e2e:functional
```

视觉回归固定在 Linux Chromium、Node 22 环境运行：

```bash
pnpm e2e:check-env
pnpm e2e:visual
```

macOS 只能运行功能 E2E，不能用本地截图更新 Linux 基线。更新快照必须使用专用命令，并审查 actual、expected、diff 和 trace。

覆盖率统计应排除生成 API、应用入口、Mock 和测试基础设施，但不能通过扩大排除范围掩盖业务代码缺口。目录级门槛和基线配置也必须纳入 Git；否则本机通过不代表干净 CI 能通过。

## 推荐的 CI 结构

新仓库可以拆成四类 job：

1. **quality**：安装依赖、类型检查、lint、单测、覆盖率、构建和资源预算。
2. **contract**：校验 OpenAPI、重新生成客户端并检查生成目录零 diff。
3. **e2e-functional**：在 Linux Chromium 中执行功能 E2E。
4. **e2e-visual**：在固定 Linux Chromium 环境中执行视觉回归，并上传失败诊断。

CI 必须使用锁文件安装：

```bash
pnpm install --frozen-lockfile
```

合并前确认以下文件都已被 Git 跟踪：

```bash
git status --short
git ls-files scripts config .github
```

特别检查覆盖率脚本、构建预算脚本、Playwright 环境检查脚本和 CI 引用的配置文件。模板仓库不能依赖本地未提交文件才能通过质量门禁。

## 从零搭建一个业务模块的最短路径

以“订单管理”为例，可以按以下顺序实施：

1. 在 OpenAPI 中定义 `Order`、分页响应、查询参数、创建/更新请求和 400/401/403/404/500 响应。
2. 运行 `pnpm generate:api`，确认生成了 `useListOrders`、`useCreateOrder` 等 hook。
3. 在 `permissions.constants.ts` 中增加 `orders:read`、`orders:write`。
4. 在 `route-manifest.tsx` 中注册 `/orders`，同时声明菜单和路由权限。
5. 复制 `UsersPage.tsx` 的状态结构，替换为订单字段和订单 query key。
6. 将查询字段、分页、排序和敏感筛选分开处理。
7. 为成功、空列表、401、403、字段错误和网络失败补页面测试。
8. 在 `e2e/admin.spec.ts` 中增加登录后进入订单页、查询和创建订单的关键流程。
9. 检查 1440px、900px 和 390px 视口；需要稳定视觉输出时再增加快照。
10. 运行完整质量命令，并确认干净 checkout 后 CI 仍然可以运行。

## 常见错误

- 直接修改 `src/api/generated`，导致下一次生成覆盖手工改动。
- 在页面组件中直接使用 Axios，绕过统一错误处理和会话过期协调。
- 把 Token 放进 `localStorage`，或把 Mock 会话当作生产认证。
- 只隐藏菜单，不保护直接 URL 和后端接口。
- 把角色名称作为接口提交字段，而不是提交稳定的角色代码。
- 查询或 mutation 成功后无差别清空所有 Query 缓存，导致页面闪烁和无意义请求。
- 把姓名、邮箱等敏感查询条件写入 URL。
- 只测试成功路径，不测试空结果、字段错误、403 和可重试的 5xx。
- 在 macOS 上生成并提交 Linux 视觉快照。
- 忘记把 CI 依赖的脚本、配置和测试文件加入 Git。
- 直接复制所有官方展示页，让示例页面被误认为正式业务能力。

## 发布模板前的检查清单

- [ ] 已修改项目名称、标题、Logo、favicon、品牌色和 README。
- [ ] 已删除或明确标记所有示例业务页面和示例数据。
- [ ] 已替换 OpenAPI 输入，并通过 `pnpm check:api`。
- [ ] 已确认登录、当前会话、登出、401、403 和 Problem Details 契约。
- [ ] 已重新登记路由、菜单、面包屑、权限和国际化文案。
- [ ] 已确认生产环境不启用 Mock，不在浏览器存储长期 Token。
- [ ] 已为第一个真实业务模块补齐请求、权限、成功、空、错误和恢复测试。
- [ ] 已运行 `pnpm typecheck`、`pnpm lint`、`pnpm test`、`pnpm build` 和功能 E2E。
- [ ] 已在 Linux CI 执行视觉回归，并审查快照差异。
- [ ] `git status --short` 没有遗漏的质量脚本、配置或测试文件。
- [ ] 生产后端仍在 Spring Security 和 Service/Repository 层执行最终鉴权与数据范围过滤。

## 当前仓库中的参考实现

- [页面开发指南](./page-development-guide.md)：页面状态、分页、权限、响应式和验收约定。
- [权限说明](./authorization.md)：前端权限与 Spring Security 的边界。
- [官方页面覆盖矩阵](./official-page-coverage-matrix.md)：展示页和正式支持页面的测试分类。
- [质量与覆盖率基线](./quality-coverage-baseline.md)：覆盖率范围、目录门槛和剩余风险。
- [请求层](../src/api/http.ts)：Cookie、XSRF、错误策略和统一请求入口。
- [用户管理页](../src/pages/UsersPage.tsx)：服务端分页、查询、详情、创建和编辑的完整样例。
- [路由清单](../src/app/route-manifest.tsx)：路由、菜单、权限和面包屑的单一来源。
- [OpenAPI 生成配置](../orval.config.ts)：生成 React Query 客户端的配置。
