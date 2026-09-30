# Arco 企业后台能力补齐分析报告

> 分析日期：2026-09-22（实施前基线）；状态更新：2026-09-24（见第十节）
> 文档性质：第 3～9 节保留实施前分析，不能作为当前代码完成状态；第十节记录最新进度
> 对照项目：`../ant-design-pro`（Ant Design Pro 6.0.3）

## 1. 背景与目标

本文基于以下材料整理：

- `docs/ant-design-pro-vs-arco.md` 第 9 节列出的七项待补齐能力。
- 当前 Arco 项目的路由、权限、请求层、OpenAPI、CI、用户和角色页面实现。
- 同级目录 `ant-design-pro` 中的路由配置、请求错误处理、`PageContainer`、`ProTable`、`ModalForm` 和详情抽屉实践。
- 项目内归档的 Arco Design Pro 官方页面与现有视觉实现。

目标不是把当前项目改造成 Ant Design Pro，也不是在 Arco 上复制一套完整 ProComponents，而是在保留以下项目优势的前提下减少企业后台页面的重复劳动：

- React Router、TanStack Query 和页面逻辑保持显式。
- OpenAPI 是 Java 后端契约的唯一事实源。
- Orval 生成的客户端保持只读，禁止手工修改。
- 权限仍由 Java Spring Security 最终强制执行。
- Arco Pro 视觉风格和现有页面结构保持稳定。

## 2. 核心结论

原第 9 节的七项方向基本正确，但落地顺序需要调整：

1. 先解决路由、权限和 RBAC 契约的正确性问题。
2. 再统一请求错误语义和 OpenAPI 生成门禁。
3. 在稳定契约之上抽取列表、查询、抽屉和页面状态模式。
4. 最后把已经验证过的模式固化为页面开发规范。

不建议先创建一套“大而全”的 `DataTable` 或 schema-driven CRUD 框架。当前真实业务样本仍然较少，过早把请求、字段、权限和交互全部元数据化，会重新引入本项目刻意避开的隐式行为和框架耦合。

推荐的目标形态是“薄组件 + 显式页面控制器”：

```text
+----------------------------+
| Route Manifest             |
| path/menu/permission/title |
+-------------+--------------+
              |
              v
+-------------+--------------+
| Router / Menu / Breadcrumb |
| / Route Guard              |
+----------------------------+

+----------------------------+
| OpenAPI + Orval            |
+-------------+--------------+
              |
              v
+-------------+--------------+
| TanStack Query page logic  |
| query state / mutations    |
+-------------+--------------+
              |
              v
+-------------+--------------+
| Thin Arco page primitives  |
| DataTable / QueryForm /     |
| CrudDrawer / DetailPanel   |
+----------------------------+
```

## 3. 当前现状与证据

### 3.1 路由、菜单和权限已发生配置漂移

目前同一路由的信息分别维护在：

- `src/app/routes.tsx`
- `src/app/navigation.tsx`
- `src/app/route-permissions.ts`

已经存在可复现的不一致：

- `/list/search-table` 的菜单项要求 `dashboard:read`，路由守卫要求 `list:read`。
- `/user/info` 的菜单项要求 `dashboard:read`，路由守卫要求 `user:read`。

因此 route manifest 不是单纯的代码整洁问题，而是当前权限行为的正确性问题。

### 3.2 RBAC 标识存在“代码”和“显示名称”混用

当前会话与角色接口使用 `admin`、`operator` 等角色代码，但用户编辑表单提交“管理员”“运营”“财务”“审计员”等显示名称。用户页的角色选项还包含角色接口中不存在的“财务”。

如果继续保留这种模型，真实 Java 后端接入时容易出现：

- 用户保存成功但服务端无法识别角色。
- 角色改名导致用户契约变化。
- 页面硬编码的选项和服务端角色目录漂移。

建议所有 API 只交换稳定代码，例如 `roleCodes: string[]`；显示名称由角色目录映射。

### 3.3 会话错误和普通请求错误没有统一语义

当前 `ProtectedLayout` 将会话接口的所有错误都当成未登录：网络中断、超时和服务端 5xx 也会跳到登录页。反向问题也存在：登录后的其他 API 返回 401 时，没有统一的会话过期处理。

请求层目前只能提取 `detail/title/message`，没有消费 OpenAPI 已定义的：

- `code`
- `traceId`
- `fieldErrors`

页面之间也分别实现 Skeleton、错误块、Message 和空状态，缺少一致的重试与诊断体验。

### 3.4 OpenAPI 已生成客户端，但 CI 没有生成一致性门禁

当前 CI 会运行类型检查、lint、单元测试和构建，但不会：

- 校验 OpenAPI 文档是否合法。
- 重新执行 `pnpm generate:api`。
- 检查生成目录是否出现未提交差异。
- 检查相对基线是否存在破坏性契约变更。
- 执行已有的 Playwright E2E。

这意味着 OpenAPI、生成客户端和提交代码可能在 CI 中悄悄失配。

### 3.5 测试尚未形成真正的“契约测试”闭环

现有单元测试主要覆盖权限 helper 和基础错误文案；E2E 覆盖登录、导航、角色保存等正向流程，但尚未系统覆盖：

- OpenAPI 到生成客户端的一致性。
- 用户分页参数和创建/更新请求体。
- 菜单可见性与直接访问权限的一致性。
- 登录过期、403、网络异常、5xx 和字段校验错误。
- Java 服务端的数据范围和接口级鉴权。

必须区分三类测试：

1. 前端仓库的 schema/生成一致性检查。
2. 前端使用 MSW 的交互和请求契约测试。
3. Java 仓库使用 MockMvc/Service 测试的真实安全契约。

MSW 可以验证前端行为，但不能证明 Spring Security 已正确鉴权。

### 3.6 页面模式已经重复，但还不适合做重型元数据框架

`UsersPage.tsx` 已将以下职责集中在一个页面中：

- 查询表单。
- 页码和 pageSize。
- 选择行。
- 加载和提交状态。
- 新增/编辑弹层。
- mutation 和缓存失效。
- 错误提示。

官方查询表格页又实现了一套类似的查询、重置、工具栏、表格和新建弹层。因此可以抽取通用模式，但建议保持以下边界：

- `DataTable` 不直接调用 API。
- `QueryForm` 不通过 schema 自动生成字段。
- `CrudDrawer` 不理解具体 DTO。
- 页面继续显式持有 Orval hook、query key 和权限判断。

### 3.7 页面视觉已有基线，但没有可执行规范

当前已经具备：

- Arco Pro 主题包和官方页面归档。
- 统一布局、导航、面包屑和部分页面容器样式。
- 桌面和断点截图。

但仍缺少：

- 新页面目录和职责约定。
- 查询、表格、表单、权限和状态的统一写法。
- CSS Token 使用约定。
- 视觉回归的稳定断言。
- 文档与 `AGENTS.md` 的入口链接。

README 声称覆盖 `1440px`、`900px` 和 `390px`，实际现有截图为 `1280px` 和 `900px`，且使用普通截图而非 `toHaveScreenshot` 视觉断言，需要在后续规范 change 中校正。

## 4. 从 Ant Design Pro 借鉴什么

值得借鉴：

- 一份声明式路由配置驱动路由、菜单、标题和权限。
- `PageContainer` 统一页面级标题、描述、操作区和内容边距。
- 列表请求具有稳定的分页、筛选和排序协议。
- 新增/编辑表单自行封装，页面只负责打开、提交成功后刷新。
- 详情抽屉与列表页面保持同一上下文。
- 页面级模式有可复制的测试样例。

不建议照搬：

- 不引入 Umi 路由和运行时插件体系。
- 不把 Arco Table、Form、Descriptions 强行合并成一份万能 columns schema。
- 不让通用组件直接绑定 Orval 生成 hook。
- 不用前端权限判断替代 Java 服务端鉴权。
- 不为追求 API 相似度而实现 ProTable 全部高级功能。

## 5. 五个 change 的拆解

| 顺序 | Change ID | 主要目标 | 前置关系 | 清单 |
| --- | --- | --- | --- | --- |
| 1 | `unify-route-manifest` | 单一来源生成路由、菜单、面包屑和守卫 | 无 | [查看](./change-01-unify-route-manifest.md) |
| 2 | `normalize-rbac-contracts` | 统一角色代码、权限目录和数据范围契约 | 建议在 1 之后 | [查看](./change-02-normalize-rbac-contracts.md) |
| 3 | `standardize-api-errors-and-contract-ci` | 统一错误语义，建立 OpenAPI 与 E2E 门禁 | 建议在 2 之后 | [查看](./change-03-standardize-api-errors-and-contract-ci.md) |
| 4 | `build-enterprise-page-patterns` | 建立列表、查询、抽屉、详情和页面状态薄组件 | 依赖 2、3 | [查看](./change-04-build-enterprise-page-patterns.md) |
| 5 | `codify-page-development-standards` | 固化已验证模式、视觉规范和页面验收清单 | 依赖 4 | [查看](./change-05-codify-page-development-standards.md) |

推荐依赖关系：

```text
unify-route-manifest -----------------------------+
                                                  |
normalize-rbac-contracts                          |
             |                                    |
             v                                    v
standardize-api-errors-and-contract-ci --> build-enterprise-page-patterns
                                                  |
                                                  v
                               codify-page-development-standards
```

`unify-route-manifest` 与 `normalize-rbac-contracts` 技术上可以并行，但按顺序执行更便于先消除权限入口漂移，再修改权限数据模型。

## 6. 全局设计决策

以下决策应贯穿五个 change：

1. OpenAPI 是 API DTO 和响应模型的唯一事实源。
2. `src/api/generated` 只允许通过 `pnpm generate:api` 更新。
3. 前端权限只控制菜单、路由体验和操作可见性。
4. Java Spring Security 必须重新校验接口权限和数据范围。
5. 路由保持前端静态 manifest，不引入服务端动态路由。
6. 角色和权限使用稳定代码，中文名称仅用于展示。
7. 通用页面组件只负责 UI 和交互协议，不直接发请求。
8. TanStack Query 继续负责缓存、请求状态和失效刷新。
9. 新抽象必须至少被两个实际场景验证，或保持足够薄以避免领域耦合。
10. 不为重构而整体改写现有官方示例页；每个 change 只迁移验证所需页面。

## 7. 风险与待确认事项

### 7.1 Java 后端仓库尚未纳入当前工作区

以下任务需要在 Java 仓库同步实施，前端仓库只能定义和验证期望契约：

- `roleCodes` 字段与角色目录接口。
- 权限目录接口。
- Spring Security 的 401/403 行为。
- 数据范围在 Service/Repository 层的过滤。
- `/v3/api-docs` 的稳定导出。

### 7.2 角色目录和权限目录是否允许运行时变化

推荐默认：

- 角色目录来自后端，可新增或改名。
- 权限代码由服务端发布，前端读取目录用于角色编辑。
- route manifest 仍引用编译期已知权限代码，未知权限不自动生成页面。

如果权限集合永远由代码发布，也可以保留前端常量，但必须建立服务端与前端的自动一致性测试。

### 7.3 是否把筛选状态写入 URL

推荐将标准列表页的页码、pageSize、排序和可分享筛选项写入 URL，以支持刷新恢复和链接分享。包含敏感内容或体积较大的筛选条件可以保留在本地状态。

### 7.4 OpenAPI breaking-change 工具选择

最小门禁是“lint + 重新生成 + 零 diff”。如果团队需要在 PR 上自动判定破坏性变化，可在第三个 change 中选择 `oasdiff` 或等价工具，但不应同时引入多套重叠校验器。

## 8. 整体完成标准

五个 change 全部完成后，应满足：

- 新增一条受权限保护的菜单路由时只修改一份 manifest。
- 菜单可见性与直接访问守卫不可能配置为不同权限。
- 用户和会话 API 只传稳定角色代码，显示名称来自角色目录。
- 401、403、网络异常、超时、5xx 和字段错误具有明确且可测试的不同体验。
- OpenAPI 修改后未重新生成客户端会被 CI 阻止。
- 用户管理页不再手工拼装通用分页、查询、错误和抽屉生命周期。
- 新页面可以按一份中文指南完成，并通过明确的单测、E2E、响应式和视觉检查。
- Java 服务端拥有独立的权限、数据范围和 Problem Details 契约测试。

## 9. 新会话执行建议

每次只处理一个 change。建议在新会话中先运行对应清单末尾提供的 `$openspec-propose` 提示，将清单转换为正式的 proposal、design、spec 和 tasks；审核范围后再进入 `$openspec-apply-change`。

不要在一个 change 中顺手实现后续清单内容。前置 change 出现新的契约决策时，应先更新后续清单或对应 OpenSpec 设计，再开始实现。

## 10. 2026-09-24 实施进度与后续路线

### 10.1 五个 change 的实际状态

| Change | 前端代码与 OpenSpec | 尚需验证或补齐 |
| --- | --- | --- |
| 01 `unify-route-manifest` | 已归档；路由、菜单、面包屑和权限守卫使用统一 manifest | 新路由继续按页面开发指南登记并测试 |
| 02 `normalize-rbac-contracts` | 已归档；前端和 Mock 使用 `roleCodes`、权限目录和数据范围字段 | Java Spring Security 与 Service/Repository 层鉴权、数据范围测试 |
| 03 `standardize-api-errors-and-contract-ci` | 已归档；`ApiError`、会话过期协调器、`check:api` 与 CI E2E 已接入 | `check:api` 对 staged/untracked 生成文件的本地检查及破坏性契约基线 |
| 04 `build-enterprise-page-patterns` | 已归档；用户页、本地查询表格和薄页面原语已落地 | [归档任务](../../openspec/changes/archive/2026-09-23-build-enterprise-page-patterns/tasks.md)中的 Java 排序和稳定分页尚未完成；归档时的最终验证项仍未勾选 |
| 05 `codify-page-development-standards` | 已归档；中文页面指南、Playwright 视觉断言和 Linux CI 基线已接入 | 扩大真实业务页面验证范围，并完善本地非 Linux 视觉测试体验 |

历史清单和本报告第 3～9 节描述的是当时尚未实现的情况。例如 route manifest 和 `DataTable` 现已存在，不应再照搬这些段落作为新的开发任务。已归档表示前端工作已交付，不代表 Java 后端契约自动完成。

### 10.2 会话切换与缓存隔离：已补修

审查发现，退出后立刻在同一标签页登录另一账号时，旧会话查询中的 401 会使新登录再次跳回登录页；仅失效当前用户 query key 也无法隔离用户列表等业务数据。现在登录成功、退出成功以及业务请求触发会话过期时，统一取消进行中的查询并清理全部旧账号缓存，再进入下一会话。Mock 退出成功时同步清除模拟会话；失败时继续保留登录状态。单测覆盖旧查询数据及进行中请求的清理，E2E 覆盖同标签页管理员切换运营账号、重新获取会话和用户列表。普通业务 mutation 仍只失效相关资源的 query key，参见[页面开发指南](../page-development-guide.md#3-openapi请求与缓存)。

### 10.3 下一阶段建议顺序

1. 在 Java 仓库落实用户列表排序白名单、稳定 `id` 并列次序、401/403、角色权限和数据范围契约测试，并与真实 `/v3/api-docs` 联调；这是生产闭环的首要缺口。
2. 为应用和懒加载页面增加 Error Boundary，覆盖渲染异常、动态 chunk 加载失败及恢复操作。
3. 增强 `check:api` 对暂存/未跟踪生成文件的检测，按需要引入契约破坏性变更基线；分别保留清晰的前端生成一致性和后端真实契约验证边界。
4. 以角色管理页和仪表盘继续检验页面原语，补齐业务页国际化、关键操作的键盘/无障碍自动化检查。
5. 改善 macOS 等本地环境与 Linux 视觉基线的测试分工，再按构建产物优化首屏资源和图像体积。

### 10.4 2026-09-30 质量提升 change 执行状态

质量提升拆为 `cover-supported-official-pages`、`verify-linux-e2e-and-visual-regressions`、`enforce-directory-coverage-trends` 三项，后续扩展为官方剩余页面和 E2E 稳定性 change。首批覆盖已将全局 Lines 覆盖率由 72.46% 提升到 79.09%，`src/pages/official` Lines 从 26.87% 提升至当前基线 48.45%；Monitor、UserInfo、UserSetting、BasicProfile 和结果页行为测试已补齐，DataAnalysis/MultiDimension 明确保持展示示例分类。Playwright fixture 现在统一收集未预期 page/console 错误和 React key 警告，功能与视觉报告按目录隔离；本机功能 E2E 26/26 通过，Linux 视觉快照仍只在固定 CI 环境更新，本机 `e2e:check-env` 因 macOS/Node 24 不匹配 Linux/Node 22 基线而按预期失败。页面暂无真实 API 的失败恢复不在单测中虚构，交由 E2E/契约层验证。精确任务进度以 OpenSpec change 状态为准。
