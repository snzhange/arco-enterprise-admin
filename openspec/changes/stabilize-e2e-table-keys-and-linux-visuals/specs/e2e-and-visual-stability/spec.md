# Spec Delta

## MODIFIED Requirements

### Requirement: 失败结果必须可诊断且基线更新受控

测试失败 SHALL 保留 trace、截图、视频或快照差异等必要产物；功能 E2E SHALL 将未预期的 page error、console error 和 React key 警告视为可诊断失败或明确白名单项。视觉基线只能通过显式更新命令和审查流程变更。

#### Scenario: 功能 E2E 失败
- **WHEN** 行为断言失败或页面出现未预期运行时错误
- **THEN** CI 保存对应测试的 trace 和截图，并在报告中链接到失败步骤和错误来源

#### Scenario: 视觉差异出现
- **WHEN** 当前渲染与基线不一致
- **THEN** CI 保存 actual、expected 和 diff，且普通测试命令不覆盖原有基线

#### Scenario: React key 警告出现
- **WHEN** 官方页面渲染表格或列表产生重复 key 警告
- **THEN** E2E SHALL 报告该警告并阻止回归通过，除非它被记录为有明确原因的白名单项

### Requirement: 视觉基线必须使用固定环境

视觉回归 SHALL 在 CI 使用固定的 Linux Chromium 环境、视口、字体和设备缩放配置；本地其他操作系统 SHALL 能明确识别基线不匹配并提供受控更新方式。CI 视觉 job SHALL 上传报告和差异产物作为审查证据。

#### Scenario: CI 运行视觉回归
- **WHEN** CI 执行视觉项目
- **THEN** 使用仓库声明的固定浏览器和 Linux 基线，结果具有可重复的像素环境并上传诊断产物

#### Scenario: macOS 本地运行视觉回归
- **WHEN** 本地缺少对应平台快照或运行环境与基线不同
- **THEN** 测试输出清晰提示，默认失败但不修改基线，且提供显式更新命令
