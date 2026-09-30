# Design

## Context

官方页面覆盖矩阵已区分正式支持页面与展示示例，但 Monitor、UserInfo、UserSetting、Result 和 BasicProfile 仍缺少共置行为测试。实现需沿用现有 Testing Library、Arco 控件和 MemoryRouter 测试模式。

## Goals / Non-Goals

**Goals:**
- 为剩余正式页面补齐可观察行为和恢复路径。
- 保持示例分析页以视觉/隔离渲染验收为主。
- 更新覆盖矩阵和覆盖率趋势记录。

**Non-Goals:**
- 不把展示页改造成真实后端业务。
- 不为静态图表增加脆弱的逐元素断言。

## Decisions

1. Monitor 重点验证聊天输入、空输入保护和更新反馈；UserSetting 重点验证表单保存/重置和 tab；UserInfo/详情/结果页重点验证展示、空态和导航。
2. 使用用户可见文本、按钮、DOM 状态和导航结果断言，避免绑定内部实现。
3. 每个新增测试文件与页面共置，和现有测试一起参与 Vitest 覆盖率。

## Risks / Trade-offs

- [官方展示内容变化导致断言不稳定] -> 只断言业务标题、操作和状态，不锁定全部文案结构。
- [页面没有真实错误 API] -> 对本地交互和浏览器能力失败进行可观察行为测试，并将后端错误留给 E2E/契约层。

## Migration Plan

按 Monitor、用户设置、用户信息、结果/详情顺序补测；每批运行定向测试和全量覆盖率，随后更新页面矩阵中的验收状态。
