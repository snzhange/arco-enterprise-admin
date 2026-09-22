# Change 05：codify-page-development-standards 落地清单

> 建议 OpenSpec change ID：`codify-page-development-standards`  
> 优先级：P1  
> 依赖：`build-enterprise-page-patterns`  
> 目标：把已验证的路由、权限、请求、页面组件、视觉和测试模式固化为可执行的中文开发规范

## 1. 为什么最后做

规范应描述已经验证可用的项目模式，而不是提前冻结未经实践的设计。因此该 change 应在前四个 change 完成后执行，基于真实组件 API、目录结构和测试经验编写。

当前项目虽然有 README、权限说明、官方页面归档和大量视觉样式，但缺少一份回答以下问题的统一指南：

- 新页面应该放在哪里？
- 如何登记路由、菜单、权限和面包屑？
- 如何使用 Orval 和 TanStack Query？
- 列表、表单、详情和状态应该使用哪些组件？
- 如何保持 Arco Pro 的间距、颜色和响应式表现？
- 新页面至少需要哪些测试？

## 2. 范围

### 包含

- 新增中文页面开发指南。
- 记录 route manifest 使用方式。
- 记录 OpenAPI/Orval 请求开发流程。
- 记录权限、列表、查询、CRUD、详情和错误状态模式。
- 记录 Arco Pro 视觉和 CSS Token 约定。
- 提供页面模板或最小示例，但不自动生成业务代码。
- 明确单测、E2E、响应式、可访问性和视觉验收清单。
- 校正 README 中与实际测试不一致的描述。
- 为关键页面建立稳定的视觉回归基线。
- 在 `AGENTS.md`/README 中增加规范入口和必要约束。

### 不包含

- 不在文档 change 中大规模重构页面。
- 不新增另一套 UI 组件库或 CSS 框架。
- 不为每个页面生成模板副本。
- 不要求所有历史官方展示页立刻达到新规范。
- 不把 vendor 目录作为运行时依赖。

## 3. 文档结构建议

建议新增：

```text
docs/page-development-guide.md
```

主体至少包含以下章节。

### 3.1 页面类型与目录

说明：

- 领域业务页与官方展示页的区别。
- 页面私有组件、hook、schema 和测试的共置规则。
- 什么内容应该进入全局 `components`，什么内容应该留在页面目录。
- 生成 API 目录禁止手改。

推荐规则：

- 单页面专用组件与页面共置。
- 被至少两个领域复用且无领域依赖的组件才能进入公共目录。
- API DTO 不重新复制成手写接口；表单值可以定义明确的 UI 类型。

### 3.2 新增路由页面

说明：

- 如何在 route manifest 中登记页面。
- 菜单、隐藏路由、重定向、面包屑和权限字段。
- i18n message key 要求。
- 403 和 404 的行为边界。

提供一个最小、可复制的 manifest 示例。

### 3.3 OpenAPI 与请求

规定：

1. 先修改 Java `/v3/api-docs` 或 `openapi/admin-api.yaml`。
2. 执行 `pnpm generate:api`。
3. 页面使用生成 hook/query key。
4. mutation 成功后精确失效相关 query。
5. 不在页面直接使用 Axios。
6. 不手改生成文件。

说明查询 key、分页 DTO、AbortSignal 和错误模型的使用方式。

### 3.4 权限

规定：

- route manifest 决定页面级权限。
- `<Permission>` 决定操作级显示或只读状态。
- 页面按钮隐藏不是安全措施。
- Java 必须使用 Spring Security 和 Service 数据范围再次校验。
- 角色和权限始终使用稳定代码。

### 3.5 页面骨架

为以下页面给出标准结构：

- 普通内容页。
- 服务端分页列表页。
- 新增/编辑表单页。
- 抽屉式 CRUD 页。
- 详情页。
- 仪表盘/数据可视化页。

示例应使用 change 04 已落地的公共组件，不复制大段业务代码。

### 3.6 页面状态

规定每个数据页必须考虑：

- 首次加载。
- 后台刷新。
- 空数据。
- 查询失败和重试。
- 401 会话过期。
- 403 无权限。
- 400 字段错误。
- 5xx 与 traceId。

### 3.7 Arco Pro 视觉规则

建议记录：

- 页面容器最大宽度、边距和断点由公共组件控制。
- 优先使用 Arco Token 和现有 CSS 变量。
- 禁止为常见文字、边框和背景继续新增硬编码颜色。
- 卡片、标题、工具栏、表格密度、分页和抽屉宽度的默认值。
- 图标按钮必须有 `aria-label` 或 Tooltip。
- 小屏表格的横向滚动和操作区换行规则。
- 官方归档只用于结构和视觉对照，不得运行时引用。

### 3.8 测试和验收

定义新增页面最低测试要求：

- 纯逻辑和 hook 单测。
- 查询参数、请求体、缓存失效的集成测试。
- 权限矩阵。
- 至少一个关键 E2E 正向路径。
- 失败、空数据或无权限中的至少一个异常路径。
- 桌面、900px 和 390px 响应式检查。
- 关键页面视觉回归。

## 4. 页面模板建议

可以提供一个不参与构建的文档示例，例如：

```tsx
export function ExampleListPage() {
  const listState = useListQueryState(...)
  const query = useListExamples(...)

  return (
    <PageContainer title="示例管理" actions={...}>
      <QueryForm ...>
        {/* 显式业务字段 */}
      </QueryForm>
      <DataTable
        columns={columns}
        data={query.data?.content ?? []}
        loading={query.isPending}
        error={query.error}
        pagination={...}
      />
    </PageContainer>
  )
}
```

示例必须强调这是结构参考，不应把所有页面强制成完全相同的 UI。

## 5. 视觉回归策略

### 5.1 修正文档与实际不一致

当前 README 声称覆盖 1440px、900px 和 390px，但现有截图主要为 1280px 和 900px，也没有视觉断言。需要选择并落实一种真实策略。

推荐固定视口：

- 桌面：`1440 x 900`
- 中间断点：`900 x 700`
- 移动端：`390 x 844`

### 5.2 使用稳定断言

- [ ] 使用 Playwright `toHaveScreenshot` 而不是只保存普通截图。
- [ ] 只选择少量高价值页面作为基线：布局/工作台、标准列表页、表单抽屉。
- [ ] 屏蔽时间、随机数、动画和不稳定网络内容。
- [ ] 在 CI 固定浏览器和字体环境。
- [ ] 视觉差异作为 artifact 保留。
- [ ] 不把所有官方展示页都纳入像素级快照，避免维护成本失控。

## 6. 实施任务

### 6.1 编写开发指南

- [ ] 以当前已经落地的组件和 API 为准编写中文指南。
- [ ] 加入目录和共置规则。
- [ ] 加入 route manifest 示例。
- [ ] 加入 OpenAPI/Orval 流程。
- [ ] 加入权限和数据范围边界。
- [ ] 加入列表、查询、CRUD、详情和 PageState 示例。
- [ ] 加入 CSS Token、响应式和可访问性规则。
- [ ] 加入测试与 Definition of Done。

### 6.2 建立可复制示例

- [ ] 选择 UsersPage 作为服务端分页 CRUD 参考。
- [ ] 选择 SearchTablePage 或一个官方页作为本地数据参考。
- [ ] 在指南中链接真实文件，不复制容易过期的完整实现。
- [ ] 如增加模板文件，确保不参与运行时构建并明确更新责任。

### 6.3 更新仓库入口文档

- [ ] README 增加“新增页面”入口。
- [ ] `AGENTS.md` 增加必须遵循页面指南的简短约束。
- [ ] README 的截图覆盖描述与实际测试保持一致。
- [ ] `docs/ant-design-pro-vs-arco.md` 第 9 节标记已落地能力或链接路线图。
- [ ] `docs/authorization.md` 链接角色、权限和数据范围的最新契约。

### 6.4 CSS 与视觉基线

- [ ] 盘点新组件使用的硬编码颜色和间距。
- [ ] 将通用颜色迁移到 Arco Token/项目变量，保留确有语义的图表色。
- [ ] 建立三种视口的响应式测试。
- [ ] 为关键页面创建视觉基线。
- [ ] CI 运行视觉断言并上传差异。

### 6.5 规范自检

- [ ] 按指南从零演练增加一个最小测试页面或在临时分支做 dry run。
- [ ] 确认步骤不会要求手改生成代码。
- [ ] 确认指南不会鼓励页面直接使用 Axios。
- [ ] 确认公共组件边界与真实代码一致。
- [ ] 删除文档中已经失效的旧路径和 API 示例。

## 7. 建议 Definition of Done 模板

每个新增业务页面至少确认：

- [ ] route manifest、标题、菜单和权限正确。
- [ ] OpenAPI 已更新并重新生成客户端。
- [ ] 没有直接使用 Axios或手改生成代码。
- [ ] loading、empty、error、403 和 retry 已考虑。
- [ ] mutation 有 loading、防重复提交、成功提示和精确缓存失效。
- [ ] 表单字段错误可定位到具体字段。
- [ ] 桌面、900px 和 390px 可用。
- [ ] 键盘操作、label、aria-label 和焦点行为可接受。
- [ ] 单测、E2E 和必要视觉断言通过。
- [ ] Java 后端已重新鉴权并应用数据范围。

## 8. 预计涉及文件

可能新增：

- `docs/page-development-guide.md`
- 少量文档示例或模板文件
- 视觉回归快照

可能修改：

- `README.md`
- `AGENTS.md`
- `docs/ant-design-pro-vs-arco.md`
- `docs/authorization.md`
- `e2e/admin.spec.ts` 或拆分后的 Playwright spec
- `playwright.config.ts`
- `.github/workflows/ci.yml`
- `src/index.css`
- `src/official-pages.css`

## 9. 验证命令

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm e2e
```

还要人工验证：

- 所有文档链接可用。
- 指南中的命令与 package scripts 一致。
- 示例路径和组件 API 与当前代码一致。
- 三种视口的视觉基线确实在 CI 执行。

## 10. 完成标准

- [ ] 新成员可以只阅读一份指南完成标准业务页面。
- [ ] 指南描述的是现有已验证 API，不是未来设想。
- [ ] README、AGENTS、授权文档和页面指南互相链接且不矛盾。
- [ ] 新页面的权限、请求、状态、视觉和测试都有可执行清单。
- [ ] README 的视觉测试声明与实际代码一致。
- [ ] 关键页面拥有稳定且可维护的视觉回归测试。
- [ ] 没有借文档 change 大规模重构无关页面。

## 11. 交接提示

```text
$openspec-propose 
读取以下文件：
  - AGENTS.md
  - docs/capability-roadmap/analysis-report.md
为 docs/capability-roadmap/change-05-codify-page-development-standards.md
描述的范围创建 change，change id 使用 codify-page-development-standards。
以已经落地的 route manifest、ApiError 和企业页面组件为事实基础，
主要产出中文页面开发指南、仓库入口更新和少量关键视觉回归；不要重新设计组件 API。
```

