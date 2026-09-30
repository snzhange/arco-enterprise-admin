# Tasks

## 1. 覆盖率门槛和报告

- [x] 1.1 记录当前可信覆盖率基线，按 `app`、`components`、`pages` 统计 Lines/Branches/Functions，并确认覆盖率排除项没有包含受支持业务代码
- [x] 1.2 将全局 Lines/Branches 门槛提升到首期目标（建议 70%/68%），增加核心目录门槛配置，并用人为低覆盖率临时验证门槛失败后恢复工作树
- [x] 1.3 在 CI 上传覆盖率摘要和 HTML 报告，确保测试失败或门槛失败时仍保留 artifact，并记录目录级指标

## 2. 正式页面与基础组件测试

- [x] 2.1 盘点 `src/pages/official` 路由，记录正式支持页面与展示示例的分类及验收方式
- [ ] 2.2 为正式支持页面补充加载、空、错误、权限和主要交互测试，优先覆盖当前 0% 的高风险页面
- [x] 2.3 为 `SettingsDrawer`、`AppLayout`、`AccessDenied`、`NotFoundPage` 和 `clipboard.ts` 补充成功/失败及窄屏或恢复行为测试（已覆盖 SettingsDrawer、AccessDenied、NotFoundPage、clipboard；AppLayout 既有测试覆盖）
- [x] 2.4 检查测试断言只依赖用户可观察状态、请求契约和持久化结果，不复制内部实现分支

## 3. 契约检查输出治理

- [x] 3.1 定位 Orval/契约检查中 `import.meta` target 警告的实际编译上下文，选择与 Vite 应用一致的校验配置
- [x] 3.2 在不修改生成客户端源码的前提下消除无关警告，保留 OpenAPI 校验、生成目录零 diff 和 typecheck 失败语义
- [x] 3.3 增加契约检查回归验证，确认非法 schema、生成 diff 和合法 `import.meta` 分别产生预期结果（现有 check-api-lib/contract 测试覆盖零 diff 与生成失败；合法 import.meta 在契约检查中不再影响退出状态）

## 4. 集成验证

- [x] 4.1 运行 `pnpm typecheck`、`pnpm lint`、`pnpm test`、`pnpm test:coverage:check` 和 `pnpm check:api`
- [ ] 4.2 运行 `pnpm build`、`pnpm check:budgets`、功能 E2E 和 Linux CI 视觉回归，确认质量门槛升级不改变业务行为（build 和预算已通过；功能/视觉 E2E 待本次变更后续验证）
- [x] 4.3 更新页面开发指南和质量报告说明，记录最终门槛、目录基线、页面分类和剩余未覆盖风险
