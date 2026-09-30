# Proposal

## Why

当前单测 107 项通过，Lines 覆盖率为 72.46%、Branches 为 72.03%，但质量门槛仍停留在 33%/42%，无法有效阻止回退。部分正式 UI 页面和基础组件缺少行为测试，且 OpenAPI 生成校验存在 `import.meta` target 警告，降低了质量信号的可读性。

## What Changes

- 将覆盖率门槛从历史保守值提升到接近当前基线的可审查水平，并为核心代码目录建立独立门槛。
- 补充正式支持范围内的页面、布局、设置、权限状态和剪贴板工具行为测试；纯视觉细节继续由 E2E/视觉回归负责。
- 明确官方示例页面的测试范围，避免未支持页面既拉低质量指标又没有验收边界。
- 调整 OpenAPI 契约校验的生成/编译上下文，消除无关的 `import.meta` target 警告，同时保留生成目录零 diff 检查。
- 在 CI 中保留可审计的覆盖率摘要、目录指标和失败原因。

## Capabilities

### New Capabilities

- `coverage-and-quality-gates`: 定义覆盖率门槛、目录质量边界和可审计的 CI 结果。

### Modified Capabilities

- `core-admin-workflow-test-coverage`: 扩展正式页面和基础组件的行为覆盖范围。
- `contract-ci`: 调整契约生成校验的工具链输出要求，降低无关警告并保持零 diff 门禁。

## Impact

涉及 `vitest.config.ts`、测试夹具和页面测试、正式页面范围说明、OpenAPI 校验脚本/配置及 GitHub Actions。不会改变业务 API、认证语义或用户可见业务流程。
