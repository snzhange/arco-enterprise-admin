# Change 04：build-enterprise-page-patterns 落地清单

> 建议 OpenSpec change ID：`build-enterprise-page-patterns`  
> 优先级：P1  
> 依赖：`normalize-rbac-contracts`、`standardize-api-errors-and-contract-ci`  
> 目标：建立适配 Arco + Orval + TanStack Query 的企业列表页和 CRUD 薄组件模式

## 1. 设计原则

该 change 吸收 Ant Design Pro 的页面开发效率，但不复制 ProComponents 的大一统 API。

必须遵循：

- API 请求仍由页面显式调用 Orval hook。
- 缓存失效仍由页面或领域 hook 显式处理。
- 通用组件不导入具体生成 DTO 或 query key。
- 查询字段继续使用普通 JSX，不做 schema-driven 表单生成器。
- 表格列是 Arco `ColumnProps<T>[]` 的薄扩展，不同时承担表单和详情 schema。
- 先迁移用户管理页作为真实样本，再用官方查询表格页验证纯前端数据场景。
- 如果某抽象只能服务一个页面，优先保持局部组件。

## 2. 目标结构

推荐按职责拆成三层：

```text
+-------------------------------------------+
| Page                                      |
| Orval hooks / permissions / query keys    |
+--------------------+----------------------+
                     |
                     v
+--------------------+----------------------+
| Page controller hooks                     |
| list URL state / pagination / mutation    |
+--------------------+----------------------+
                     |
                     v
+--------------------+----------------------+
| Arco UI primitives                        |
| PageContainer / QueryForm / DataTable      |
| CrudDrawer / DetailPanel / PageState       |
+-------------------------------------------+
```

## 3. 范围

### 包含

- 页面容器和标题操作区。
- 查询表单布局、提交和重置约定。
- 服务端分页表格适配。
- URL 列表状态和 Spring 0 基页码转换。
- 受控行选择和批量操作区。
- 新增/编辑抽屉生命周期。
- 详情展示面板。
- 加载、空、错误和无权限状态。
- 用户管理页迁移。
- 官方查询表格页的部分迁移或第二样本验证。
- 组件、hook 和页面级测试。

### 不包含

- 不实现完整 ProTable clone。
- 不自动从 OpenAPI schema 生成 UI。
- 不实现服务端动态列配置平台。
- 不实现导入、导出、批量删除等尚无真实契约的功能。
- 不全量改写所有官方展示页。
- 不在这个 change 中制定最终文档规范，最终规范属于 change 05。

## 4. 推荐组件与职责

### 4.1 PageContainer

负责：

- 页面标题、说明、可选 eyebrow。
- 页面级操作区。
- 内容宽度和垂直间距。
- 可选面包屑下方的额外区域。

不负责：

- 路由面包屑事实源。
- 数据请求。
- 权限判断。

### 4.2 QueryForm

负责：

- 一致的 Arco Form 布局。
- 查询、重置按钮和 loading。
- 响应式列布局或折叠扩展区。
- reset 后触发统一回调。

不负责：

- 根据字段 schema 自动生成控件。
- 自动拼 API 参数。
- 持有业务筛选状态。

### 4.3 DataTable

负责：

- Arco Table 与 Pagination 的稳定组合。
- loading、empty、error、retry。
- 统一的服务端分页 props。
- 表格工具栏、总数、刷新入口。
- 受控 rowSelection 和批量操作槽位。
- 将 Arco sorter/filter 事件传给上层。

不负责：

- 直接接收 `request` 函数并自行管理 TanStack Query。
- 自动缓存或 invalidate。
- 猜测 Java 分页结构。

### 4.4 useListQueryState

负责：

- `page/pageSize/sort/filters` 的受控状态。
- 可分享字段与 URLSearchParams 的转换。
- 筛选变化后回第一页。
- pageSize 变化后的页码修正。
- UI 1 基页码到 Spring 0 基页码转换。
- 可选的选中行清理策略。

建议默认 URL 参数：

```text
page=1
pageSize=20
sort=name,asc
status=active
keyword=alice
```

敏感筛选项不得写入 URL。

### 4.5 CrudDrawer

负责：

- 新增/编辑标题和宽度。
- Arco Drawer 的 footer、确认 loading 和关闭行为。
- 成功后关闭，失败时保持内容。
- 未保存关闭确认的可选能力。
- 打开时初始化值、关闭时清理表单的明确时机。

不负责：

- 理解具体 DTO。
- 直接执行 mutation。
- 自动选择新增或更新 API。

### 4.6 DetailPanel

负责：

- Drawer 或 Card 内的详情布局。
- 基于显式 descriptor 渲染 label/value。
- loading、error 和 empty。

详情 descriptor 应与 Table column 分离，避免为了复用而强制类型转换。

### 4.7 PageState

建议提供：

- `PageLoadingState`
- `PageErrorState`
- `PageEmptyState`
- `PageForbiddenState`

应支持标题、说明、retry 和主要操作；具体错误分类复用 change 03 的 `ApiError`。

## 5. 分页与排序契约

当前用户接口只有 page、size、keyword、status，没有服务端排序。开始 DataTable 服务端排序前，应先在 OpenAPI/Java 中定义标准排序方式。

推荐优先采用 Spring 兼容格式：

```text
sort=name,asc
sort=createdAt,desc
```

如果只支持单字段，可先定义单个 `sort`；不要同时设计 `sortBy/sortOrder/sort[]` 多种格式。

分页适配应明确：

- UI `current` 从 1 开始。
- Java `page` 从 0 开始。
- `UserPage.page` 返回服务端实际页码。
- 数据删除后当前页为空时是否回退一页。
- filter/sort 变化时是否清空选中行，推荐清空。

## 6. 实施任务

### 6.1 先补契约能力

- [ ] 确认标准排序 query 参数。
- [ ] 更新 OpenAPI 与 Java mock/实现。
- [ ] 重新生成 Orval 客户端。
- [ ] 为分页、筛选和排序请求形状增加测试。

### 6.2 页面基础组件

- [ ] 实现 `PageContainer`。
- [ ] 实现 `QueryForm`。
- [ ] 实现 `DataTable`。
- [ ] 实现 `CrudDrawer`。
- [ ] 实现 `DetailPanel`。
- [ ] 实现统一 PageState 组件。
- [ ] 组件 props 优先复用 Arco 原生类型并保持窄接口。

### 6.3 列表状态 hook

- [ ] 实现 URL 与类型化筛选状态转换。
- [ ] 实现 page 1/0 基转换。
- [ ] 实现查询、重置、排序和 pageSize 行为。
- [ ] 明确默认值不必冗余写入 URL，或统一保留；只能选择一种策略。
- [ ] 处理浏览器前进/后退恢复状态。
- [ ] 为无效 URL 参数提供安全回退。

### 6.4 迁移用户管理页

- [ ] 用 `PageContainer` 替换手写 page-heading。
- [ ] 用 `QueryForm` 替换查询工具栏。
- [ ] 用 `useListQueryState` 管理分页与筛选。
- [ ] 用 `DataTable` 组合表格、总数、分页、错误、空状态和重试。
- [ ] 用 `CrudDrawer` 承载新增/编辑用户；如果保留 Modal，必须记录为何不采用抽屉。
- [ ] 增加用户详情 `DetailPanel`，或明确详情不在当前产品范围并不创建空壳。
- [ ] 保持 users:read/users:write 权限行为。
- [ ] 保持角色目录和字段错误处理来自前置 change。

### 6.5 第二样本验证

- [ ] 选择 `SearchTablePage` 验证本地数据列表，或选择另一个真实服务端分页页。
- [ ] 验证组件不强依赖 TanStack Query。
- [ ] 验证 QueryForm 支持多行和响应式收起。
- [ ] 验证 DataTable 支持 Arco 本地 sorter 和服务端 sorter 两种模式。
- [ ] 删除只为单个页面加入的过度 props。

### 6.6 测试

- [ ] 每个基础组件有行为测试，而非大面积快照。
- [ ] `useListQueryState` 覆盖 URL、重置、翻页和排序。
- [ ] UsersPage 测试查询参数、创建/更新请求体和缓存失效。
- [ ] E2E 覆盖筛选、翻页、刷新恢复、新增、编辑和错误重试。
- [ ] 响应式验证桌面、900px 和 390px。

## 7. 建议目录

可考虑：

```text
src/components/page/
  PageContainer.tsx
  PageState.tsx

src/components/data/
  DataTable.tsx
  QueryForm.tsx
  DetailPanel.tsx

src/components/form/
  CrudDrawer.tsx

src/hooks/
  useListQueryState.ts
```

目录不是强制要求。应避免创建层级很深、只有一个文件的抽象目录，也不要使用容易与 Arco 官方组件混淆的命名导出。

## 8. 预计涉及文件

- `openapi/admin-api.yaml`
- `src/api/generated/**`（仅生成）
- `src/components/**`（新增薄组件）
- `src/hooks/**`（如采用 hook 目录）
- `src/pages/UsersPage.tsx`
- `src/pages/official/SearchTablePage.tsx` 或选定的第二样本
- `src/index.css`
- `src/official-pages.css`（只做迁移必需调整）
- `src/mocks/handlers.ts`
- 相关单元测试和 `e2e/admin.spec.ts`

## 9. 验证命令

```bash
pnpm generate:api
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm e2e
```

## 10. 完成标准

- [ ] UsersPage 不再自行拼装通用查询、分页、错误和弹层生命周期。
- [ ] 通用组件没有导入任何用户/角色生成 DTO。
- [ ] DataTable 不直接发请求，也不持有 QueryClient。
- [ ] QueryForm 使用显式 JSX 字段，而非 schema 生成器。
- [ ] URL 可恢复列表分页和非敏感筛选状态。
- [ ] Spring page 0 基与 Arco current 1 基转换有测试。
- [ ] 至少两个不同数据来源的页面验证了抽象边界。
- [ ] 页面视觉与 Arco Pro 基线保持一致。

## 11. 交接提示

```text
$openspec-propose 
读取以下文件：
  - AGENTS.md
  - docs/capability-roadmap/analysis-report.md
为 docs/capability-roadmap/change-04-build-enterprise-page-patterns.md
描述的范围创建 change，change id 使用 build-enterprise-page-patterns。
前置假设是 RBAC 契约和 ApiError 已经稳定。设计采用薄组件与显式页面控制器，
禁止实现完整 ProTable clone、OpenAPI 自动 UI 或直接绑定 Orval hook 的 DataTable。

不用向我确认分支名，落change之后直接apply，apply完成之后直接archive，archive完成之后提交并合并回main分支
```

