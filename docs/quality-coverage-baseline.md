# 质量与覆盖率基线

## 当前实测

以下是 `pnpm test:coverage:directories` 在 2026-10-08 生成的当前工作区快照，包含本轮官方页面行为测试。提交后的实际门禁结果以 CI 重新生成的报告为准：

| 范围 | Lines | Statements | Branches | Functions |
| --- | ---: | ---: | ---: | ---: |
| 全部纳入源码 | 85.72% | 83.97% | 77.90% | 78.75% |
| `src/app` | 90.40% | 82.82% | 81.73% | 71.91% |
| `src/components` | 79.76% | 77.91% | 70.69% | 61.11% |
| `src/pages`（不含子目录） | 85.62% | 86.15% | 76.04% | 88.79% |
| `src/pages/official` | 80.18% | 79.75% | 69.91% | 72.48% |

统计范围是 `src/**/*.{ts,tsx}`，排除生成 API、应用入口、mock 和测试基础设施。全局门槛为 Lines 70%、Branches 68%、Statements 68%、Functions 60%。目录门槛和允许回退幅度由 `config/coverage-directories.json` 管理。

`config/coverage-baseline.json` 中的 2026-09-30 数值是目录趋势比较基线，用于检测回退，不等同于上表的当前实测值；官方页面补测后，`src/pages/official` 的实测覆盖率已明显高于该历史基线。

目录门槛配置见 `config/coverage-directories.json`，基线见 `config/coverage-baseline.json`。`pnpm test:coverage:directories` 会生成 `coverage/coverage-directories.json`，报告各目录四项指标、基线差异、目标值和门禁状态。

## 页面范围分类

- 正式后台页面：`DashboardPage`、`LoginPage`、`RolesPage`、`UsersPage`、`WelcomePage`，以及正式路由中提供业务操作的页面。此类页面必须有行为测试，关键异常路径由 E2E 补充。
- 官方展示页面：`src/pages/official` 下用于展示 Arco Pro 页面模式的页面。页面行为按实际路由风险补充测试，纯视觉内容由视觉回归验证；未纳入正式业务支持的页面不得被当作业务 API 模板。
- 公共基础能力：`AppLayout`、`SettingsDrawer`、`AccessDenied`、`NotFoundPage` 和剪贴板工具。涉及导航、权限、设置持久化或浏览器能力失败的路径必须有测试。

逐路由分类、权限前置和验收方式见[官方页面覆盖矩阵](official-page-coverage-matrix.md)。该矩阵区分业务支持承诺与官方展示示例，新增路由需同步维护。

## 剩余风险

`src/pages/official` 的正式支持页面已补齐大部分共置行为测试，但 DataAnalysis/MultiDimension 仍是展示示例，StepForm 和 `SettingsDrawer` 仍有较低的函数覆盖率；这些页面应按实际风险继续补充测试。Monitor、UserInfo、UserSetting、BasicProfile、结果页、CardList、GroupForm 和异常页已有共置行为测试。页面没有真实 API 的失败恢复由 E2E/契约层负责，不能用单元测试虚构后端错误。后续应优先补齐高风险交互，再根据目录趋势逐步提升门槛。测试不得通过扩大排除范围来掩盖正式业务代码缺口。
