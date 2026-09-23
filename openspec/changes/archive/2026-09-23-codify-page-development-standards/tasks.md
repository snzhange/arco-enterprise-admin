# Tasks

## 1. 页面指南和仓库入口

- [x] 1.1 编写 `docs/page-development-guide.md`，以实际 route manifest、`ApiError`、生成 hook 和页面组件签名说明目录、路由、请求、权限、列表/表单/详情/状态、视觉、可访问性与 Definition of Done；核对链接均指向存在的实现文件。
- [x] 1.2 更新 README、`AGENTS.md`、`docs/authorization.md` 与 `docs/ant-design-pro-vs-arco.md`，加入规范入口并标注已落地能力；按 Playwright 用例区分调试截图和视觉断言，检查 Markdown 链接。

## 2. 视觉回归

- [x] 2.1 按页面原语核对通用颜色，使用现有 Arco Token 替代所选公共页面样式中的通用硬编码色，并保留语义图表色；`pnpm lint` 和 `pnpm build` 通过。
- [x] 2.2 添加固定浏览器上下文和 `1440 x 900`、`900 x 700`、`390 x 844` 的关键页面 `toHaveScreenshot` 覆盖，至少包含工作台、用户列表与表单抽屉；检查无动画噪声并生成经检查的基线。
- [x] 2.3 确保 CI 的 E2E job 在与本地基线一致的浏览器和字体环境运行视觉断言，失败时上传 screenshot diff 与 Playwright 诊断 artifact；用 `pnpm e2e` 验证。

## 3. 集成验收

- [x] 3.1 运行 `pnpm typecheck`、`pnpm lint`、`pnpm test`、`pnpm build`、`pnpm e2e`，并修复本 change 引入的问题。
- [x] 3.2 检查指南、仓库入口和视觉策略与真实脚本/组件一致；确认未改组件 API、OpenAPI、生成客户端或批量迁移官方展示页。
