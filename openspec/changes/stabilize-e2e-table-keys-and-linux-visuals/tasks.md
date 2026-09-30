# Tasks

- [x] 修复 Monitor 和其他官方表格中的重复列 key 及动态列表 key。
- [x] 扩展 Playwright fixture，收集并断言未预期 page error、console error 和 React key 警告；HTTP 失败响应和测试主动模拟的网络错误保留为已知业务诊断噪声。
- [x] 保持功能/视觉报告和 test-results 目录隔离，验证 CI artifact 内容。
- [ ] 在 Linux Chromium CI 执行功能和视觉回归，审查 actual/expected/diff/trace；本机 macOS 无法替代该环境。
- [x] 更新页面开发指南和路线图中的 E2E 稳定性状态。
- [x] 运行 `pnpm lint`、`pnpm typecheck` 和功能 E2E（26/26）；`pnpm e2e:check-env` 按预期因本机 macOS/Node 24 与 Linux/Node 22 基线不匹配而失败，Linux 视觉快照待 CI。
