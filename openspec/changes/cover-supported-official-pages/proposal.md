# Proposal

## Why

多项 `src/pages/official` 页面仍通过正式路由提供，但除 `SearchTablePage` 外几乎没有行为测试，导致权限、状态反馈和关键表单交互的回归风险无法从当前覆盖率判断。需要先明确正式支持页面范围，再按用户可见行为补足测试，避免对纯展示示例盲目追求行覆盖。

## What Changes

- 盘点 official 页面与 route manifest，记录正式支持页面和展示示例的验收方式。
- 为正式支持页面补充适用的加载、成功、空、错误、权限和主要交互测试。
- 将纯展示细节留给既有视觉回归，避免重复测试实现细节。
- 更新页面开发指南和质量基线说明，记录覆盖范围及剩余风险。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `core-admin-workflow-test-coverage`: 明确 official 正式支持页面和示例页面的行为测试边界。

## Impact

涉及 `src/pages/official` 页面测试、路由清单、页面开发指南和覆盖率质量说明；不修改业务 API 或页面业务语义。
