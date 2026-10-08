# Spec Delta

## MODIFIED Requirements

### Requirement: 视觉基线必须使用固定环境

视觉回归 SHALL 在 CI 使用固定的 Linux Chromium 环境、视口、字体和设备缩放配置；CI SHALL 在运行前校验浏览器版本、操作系统标识和快照目录，发现环境漂移时必须失败并输出诊断信息。本地其他操作系统 SHALL 能明确识别基线不匹配并提供受控更新方式。

#### Scenario: CI 运行视觉回归
- **WHEN** CI 执行视觉项目
- **THEN** 使用仓库声明的固定浏览器和 Linux 基线，结果具有可重复的像素环境

#### Scenario: CI 环境发生漂移
- **WHEN** 浏览器版本、字体或运行平台与声明基线不一致
- **THEN** 视觉任务 SHALL 在执行断言前失败，并报告预期与实际环境信息

#### Scenario: macOS 本地运行视觉回归
- **WHEN** 本地缺少对应平台快照或运行环境与基线不同
- **THEN** 测试输出清晰提示，默认失败但不修改基线，且提供显式更新命令

### Requirement: 失败结果必须可诊断且基线更新受控

测试失败 SHALL 保留 trace、截图、视频或快照差异等必要产物；CI SHALL 将功能和视觉结果按项目分目录上传，并在报告中包含环境摘要、失败测试和 artifact 路径。视觉基线只能通过显式更新命令和审查流程变更。

#### Scenario: 功能 E2E 失败
- **WHEN** 行为断言失败
- **THEN** CI 保存对应测试的 trace 和截图，并在报告中链接到失败步骤

#### Scenario: 视觉差异出现
- **WHEN** 当前渲染与基线不一致
- **THEN** CI 保存 actual、expected 和 diff，且普通测试命令不覆盖原有基线

#### Scenario: 诊断产物缺失
- **WHEN** 测试失败但未生成要求的 trace、截图或 diff
- **THEN** CI SHALL 将产物缺失报告为测试基础设施失败，而不是仅报告业务断言失败
