# E2E and Visual Stability

## Purpose

为管理后台提供可重复、可诊断的端到端验证和视觉回归基线，使功能失败、渲染差异与测试环境问题能够被清晰区分并独立处理。

## Requirements

### Requirement: 功能与视觉测试必须隔离

测试系统 SHALL 提供独立的功能 E2E 与视觉回归执行入口、项目配置和结果目录；运行其中一类测试不得隐式执行另一类测试。

#### Scenario: 仅运行功能 E2E

- **WHEN** 执行功能 E2E 命令
- **THEN** 只执行行为断言，不读取或更新视觉快照，并生成独立的测试结果

#### Scenario: 仅运行视觉回归

- **WHEN** 执行视觉回归命令
- **THEN** 只执行标记为视觉基线的用例，并将差异输出到视觉结果目录

### Requirement: 视觉基线必须使用固定环境

视觉回归 SHALL 在 CI 使用固定的 Linux Chromium 环境、视口、字体和设备缩放配置；本地其他操作系统 SHALL 能明确识别基线不匹配并提供受控更新方式。

#### Scenario: CI 运行视觉回归

- **WHEN** CI 执行视觉项目
- **THEN** 使用仓库声明的固定浏览器和 Linux 基线，结果具有可重复的像素环境

#### Scenario: macOS 本地运行视觉回归

- **WHEN** 本地缺少对应平台快照或运行环境与基线不同
- **THEN** 测试输出清晰提示，默认失败但不修改基线，且提供显式更新命令

### Requirement: E2E 测试数据与时序必须确定

E2E fixtures SHALL 为每个测试提供隔离的 Mock 数据、受控时间和网络等待；测试 SHALL 禁止依赖任意 sleep、真实外部服务或共享可变状态。

#### Scenario: 并行执行同一测试集

- **WHEN** Playwright 以多个 worker 并行运行
- **THEN** 每个测试使用独立数据和页面状态，结果不因执行顺序改变

#### Scenario: 网络响应延迟

- **WHEN** Mock 响应在允许范围内延迟返回
- **THEN** 测试等待可观测的请求或页面状态完成后再断言，不因固定短暂等待产生间歇性失败

### Requirement: 失败结果必须可诊断且基线更新受控

测试失败 SHALL 保留 trace、截图、视频或快照差异等必要产物；视觉基线只能通过显式更新命令和审查流程变更。

#### Scenario: 功能 E2E 失败

- **WHEN** 行为断言失败
- **THEN** CI 保存对应测试的 trace 和截图，并在报告中链接到失败步骤

#### Scenario: 视觉差异出现

- **WHEN** 当前渲染与基线不一致
- **THEN** CI 保存 actual、expected 和 diff，且普通测试命令不覆盖原有基线
