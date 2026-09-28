# Proposal

## Why

现有 Vitest 覆盖率只在本地按需查看，CI 运行普通单测但不留覆盖率记录，也无法阻止覆盖率明显回退。MSW handler 的用户、角色与登录身份使用模块级可变状态，而测试只重置 handler 和 `sessionStorage`，后续增加集成用例时容易出现顺序依赖。

## What Changes

- 在现有 `pnpm test:coverage` 基础上记录覆盖率统计口径与基线，为 CI 添加保守的全局行、分支覆盖率下限和可下载的覆盖率报告。
- 统一本地与 CI 的测试命令；通过真实的低于门槛测试验证质量 job 会失败，且报告在失败时仍可获取。
- 为共用 QueryClient 的组件/集成测试提供每例创建和清理的约定，避免测试间共享缓存和进行中的请求。
- 为 MSW Mock 的内存用户、角色与身份状态建立可复位的测试入口；重置测试数据与会话存储时不改变浏览器 Mock 在单个用例内的正常持久化行为。
- 为 Mock 状态重置和测试顺序隔离增加回归测试，并在页面开发指南中记录职责边界与后续提高门槛的方法。
- 不在本 change 内提升 `http.ts`、`routes.tsx`、`RolesPage` 等模块的业务测试覆盖率；Error Boundary、视觉基线、API 契约及 Java 服务端测试分别留给后续 change。

## Capabilities

### New Capabilities

- `quality-baseline-and-test-isolation`：定义可复现的单测覆盖率门禁、失败时的报告留存，以及 QueryClient/MSW 状态隔离要求。

### Modified Capabilities

无；`contract-ci` 已约束 OpenAPI 和独立 E2E job，本 change 增加普通单测的独立质量门禁，不改变其既有需求。

## Impact

主要涉及 `vitest.config.ts`、`package.json` 的测试命令、`.github/workflows/ci.yml`、`src/test/`、`src/mocks/handlers.ts` 和相关测试/页面开发指南。不引入新业务接口，不修改 `openapi/admin-api.yaml` 或 `src/api/generated`；浏览器 Mock 的登录和单次测试内角色编辑行为保持不变。
