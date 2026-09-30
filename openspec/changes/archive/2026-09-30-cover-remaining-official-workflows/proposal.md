# Proposal

## Why

官方页面首批只覆盖了卡片列表、表单和异常页，Monitor、用户中心和结果/详情页面仍缺少行为测试，导致正式支持页面的错误恢复、用户操作和空状态无法从覆盖率或回归结果确认。

## What Changes

- 为 Monitor、UserInfo、UserSetting 和结果/详情页面补充主要用户操作测试。
- 覆盖成功、校验失败、空状态、浏览器能力失败和恢复路径。
- 保持展示型分析页面以隔离渲染和视觉回归为主，不强行引入业务 API。
- 更新覆盖矩阵、覆盖率基线和路线图。

## Capabilities

### Modified Capabilities

- `core-admin-workflow-test-coverage`: 完成剩余正式官方页面的行为测试边界。

## Impact

涉及 `src/pages/official` 测试、页面覆盖矩阵、质量基线和路线图，不改变现有业务 API 语义。
