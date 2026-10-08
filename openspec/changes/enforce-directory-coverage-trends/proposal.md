# Proposal

## Why

当前全局覆盖率门槛已提升，但总体指标仍可能被高覆盖模块抵消，且 Functions 覆盖率低于 Lines/Branches，难以发现局部质量回退。需要在可信基线基础上加入目录级门槛与可比较的趋势摘要，并按阶段收紧要求。

## What Changes

- 为 `app`、`components`、`pages` 及正式支持页面范围定义可审查的 Lines、Branches、Functions 下限。
- 输出机器可读的目录级覆盖率摘要和未覆盖文件清单，并保留为 CI artifact。
- 记录阈值提升与基线变化，验证单一目录低于下限时即使全局达标也会失败。
- 保持受支持业务代码纳入统计，不通过扩大排除清单制造达标。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `coverage-and-quality-gates`: 增加目录级门槛、趋势报告和局部回退失败语义。

## Impact

涉及 Vitest 覆盖率配置、报告脚本、CI artifacts 和质量基线文档；不影响运行时业务功能。
