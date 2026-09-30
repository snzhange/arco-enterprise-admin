# 质量与覆盖率基线

## 当前基线

基于 `pnpm test:coverage:check` 的 V8 报告（2026-09-30）：

| 范围 | Lines | Branches | Functions |
| --- | ---: | ---: | ---: |
| 全部纳入源码 | 72.46% | 72.03% | 62.35% |
| `src/app` | 84.34% | 79.80% | 70.78% |
| `src/components` | 67.85% | 70.68% | 38.88% |
| `src/pages` | 85.29% | 76.03% | 87.85% |
| `src/pages/official` | 26.87% | 30.08% | 16.51% |

统计范围是 `src/**/*.{ts,tsx}`，排除生成 API、应用入口、mock 和测试基础设施。当前门槛为 Lines 70%、Branches 68%、Statements 68%、Functions 60%。

## 页面范围分类

- 正式后台页面：`DashboardPage`、`LoginPage`、`RolesPage`、`UsersPage`、`WelcomePage`，以及正式路由中提供业务操作的页面。此类页面必须有行为测试，关键异常路径由 E2E 补充。
- 官方展示页面：`src/pages/official` 下用于展示 Arco Pro 页面模式的页面。页面行为按实际路由风险补充测试，纯视觉内容由视觉回归验证；未纳入正式业务支持的页面不得被当作业务 API 模板。
- 公共基础能力：`AppLayout`、`SettingsDrawer`、`AccessDenied`、`NotFoundPage` 和剪贴板工具。涉及导航、权限、设置持久化或浏览器能力失败的路径必须有测试。

## 剩余风险

`src/pages/official` 和 `SettingsDrawer` 仍是主要覆盖率缺口；后续应优先补齐高风险交互，再根据报告提升目录门槛。测试不得通过扩大排除范围来掩盖正式业务代码缺口。
