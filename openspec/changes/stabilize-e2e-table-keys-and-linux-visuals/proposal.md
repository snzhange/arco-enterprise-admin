# Proposal

## Why

功能 E2E 虽然通过，但 Monitor 页面仍输出表格重复 key 警告；本地无法充当 Linux 视觉基线环境，CI 也需要把 Linux 视觉结果与诊断产物作为明确的回归证据。

## What Changes

- 修复官方表格列和动态列表中的重复 React key。
- 增强 E2E 对浏览器控制台错误和 React 警告的检测。
- 在 Linux Chromium CI 中执行视觉回归并保留 actual、expected、diff 和 trace 诊断。
- 明确 macOS 本地只允许验证功能 E2E，不允许更新 Linux 快照。

## Capabilities

### Modified Capabilities

- `e2e-and-visual-stability`: 将渲染警告和 Linux 视觉回归结果纳入稳定性门禁。

## Impact

涉及官方页面列定义、Playwright fixture、CI 视觉 job 和诊断文档。
