# Proposal

## Why

当前用户页已有部分组件和 E2E 覆盖，但角色管理、应用设置、登录编排和 Dashboard 的关键分支仍大面积落在覆盖率盲区。C1 固定请求/会话边界后，需要把高风险的后台业务工作流补到组件/集成测试层，减少只在完整浏览器流程中发现问题的成本。

## What Changes

- 为角色权限页覆盖目录加载、只读权限、草稿变更、取消、未知权限保留、通配权限保护、保存成功与失败。
- 为用户管理页补齐详情、创建、编辑、字段错误、403、重试、选择清理和分页状态边界的组件测试。
- 为登录页、应用设置、Dashboard 错误状态和关键官方页面状态增加高价值测试，不追求对纯展示组件逐行测试。
- 将测试按业务风险分层：服务端业务页面优先组件/集成测试，官方展示页面保留路由 E2E 冒烟和必要的交互测试。
- 不改变角色、用户、设置或 Dashboard 的运行时契约，不新增 API，不引入完整 schema-driven CRUD 测试框架。

## Capabilities

### New Capabilities

- `core-admin-workflow-test-coverage`：定义角色、用户、设置和工作台关键业务工作流的可验证测试边界。

### Modified Capabilities

无；现有 `rbac-contracts` 和 `enterprise-page-patterns` 的运行时要求保持不变，本 change 只补齐实现验证。

## Impact

涉及 `src/pages/RolesPage.test.tsx`、`src/pages/UsersPage.test.tsx`、登录/设置/Dashboard 测试、测试 helper 和必要的 MSW 场景。预计只增加测试代码与测试夹具，不修改生产 API 或生成客户端。
