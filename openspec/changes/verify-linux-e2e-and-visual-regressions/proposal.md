# Proposal

## Why

功能 E2E 与 Linux Chromium 视觉回归已有独立配置，但最近的质量提升没有重新完成两类端到端验证。需要在固定 Linux 基线上确认核心管理流程和关键视口渲染稳定，并保证失败时保留足够诊断材料。

## What Changes

- 复核功能 E2E 的登录、路由、权限、用户和角色主流程及失败恢复。
- 在声明的 Linux Chromium 环境执行视觉回归，按审查结果受控更新快照。
- 让 CI 报告明确区分功能失败、视觉差异和环境问题，并保留 trace、截图、actual/expected/diff。
- 验证本地非 Linux 运行时对基线不匹配的提示和更新边界。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `e2e-and-visual-stability`: 强化 Linux 基线验证、失败诊断和报告可审查性。

## Impact

涉及 `e2e/`、Playwright 配置、CI 工作流和视觉快照；不改变业务页面和 API 行为。
