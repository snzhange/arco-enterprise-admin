# Design

## Context

现有 Playwright fixture 已收集 page error，但没有统一拦截 console warning；Monitor 的表格列定义会产生重复 `name` key 警告。Linux 环境检查、视觉 artifact 上传和快照更新脚本已经存在，本 change 聚焦把运行时警告纳入回归证据并修复已知来源。

## Goals / Non-Goals

**Goals:**
- 修复官方表格列和动态列表的重复 key。
- 在 fixture 中收集未预期 page/console 错误，并对 React key 警告失败。
- 让 Linux 视觉 CI 结果可审查。

**Non-Goals:**
- 不把所有浏览器 warning 都无差别当失败。
- 不在 macOS 上更新 Linux 快照。

## Decisions

1. 优先修复列 `key` 缺失或重复导致的 React warning；对第三方库已知且无业务影响的 warning 建立最小白名单并记录原因。
2. fixture 监听 `pageerror` 和 `console`，测试结束统一断言未出现未预期错误；功能和视觉项目共享诊断规则但保持结果目录隔离。
3. CI 继续使用 `ubuntu-24.04`、固定 Chromium 项目和 `e2e:check-env`，将 report/test-results 作为 artifact。

## Risks / Trade-offs

- [第三方 Arco 内部 warning 误报] -> 只白名单明确来源和消息，业务页面 warning 不得屏蔽。
- [CI 视觉产物体积增加] -> 仅失败时保留 trace/video，视觉 diff 全量保留。

## Migration Plan

先修复 key 并运行功能 E2E，再在 Linux CI 执行视觉回归；若存在真实快照差异，单独审查并使用显式更新脚本。
