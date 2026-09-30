# Tasks

- [x] 为 MonitorPage 补充消息发送、空输入、tab/操作反馈和本地操作反馈测试；页面没有真实 API，失败恢复留给 E2E/契约层。
- [x] 为 UserSettingPage 补充表单保存、重置、tab 和认证记录行为测试；当前保存按钮不触发表单校验，因此不虚构校验断言。
- [x] 为 UserInfoPage、BasicProfilePage 和 ResultPages 补充展示空态及导航操作测试。
- [x] 对 DataAnalysisPage、MultiDimensionPage 作为展示示例登记为视觉回归/隔离渲染验收，不扩展静态图表行为测试。
- [x] 更新官方页面覆盖矩阵、质量基线和路线图缺口。
- [x] 运行定向测试、`pnpm test:coverage:check`、`pnpm lint` 和 `pnpm typecheck`。
