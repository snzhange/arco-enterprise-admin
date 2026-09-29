# Proposal

## Why

当前 E2E 与视觉回归混用同一运行路径，Mock、并行执行和不同操作系统的渲染差异会造成非业务性失败，降低失败信号的可信度。现在需要把功能验证与视觉基线分层，并固定可复现的执行环境。

## What Changes

- 将功能 E2E 与视觉回归拆分为独立命令、项目和 CI job。
- 为视觉快照固定 Linux Chromium 基线；本地 macOS 缺少对应快照时提供明确的生成/更新流程，不将平台差异误报为功能失败。
- 统一稳定的 Mock 数据、时钟、动画和网络等待策略，避免并行测试互相污染。
- 为失败结果保留可诊断的 trace、截图和快照差异，并定义更新基线的审查门槛。

## Capabilities

### New Capabilities

- `e2e-and-visual-stability`：定义功能 E2E 与视觉回归的隔离、确定性和跨平台基线行为。

### Modified Capabilities

无。

## Impact

涉及 Playwright 配置、E2E fixtures/spec、视觉快照目录、package scripts、CI workflow 和测试文档；不改变业务 API 与运行时页面行为。
