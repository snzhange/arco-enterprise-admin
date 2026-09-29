# Tasks

## 1. 测试入口与配置隔离

- [x] 1.1 盘点现有 Playwright spec 并添加功能/视觉分类标记，验证两个分类覆盖范围无遗漏
- [x] 1.2 配置独立的功能和视觉 Playwright projects、package scripts 与结果目录，分别运行命令并确认不会交叉执行
- [x] 1.3 固定 CI Linux Chromium、视口、字体和设备缩放配置，验证 CI 使用声明的浏览器版本

## 2. 确定性 fixtures

- [x] 2.1 建立每测试隔离的 Mock 数据和路由 fixtures，验证并行 worker 间无共享可变状态
- [x] 2.2 使用受控时钟、动画禁用和请求/页面状态等待替换固定 sleep，验证延迟响应场景稳定通过
- [x] 2.3 增加失败重试边界和随机顺序运行检查，连续运行多次确认结果一致

## 3. 视觉基线与诊断产物

- [x] 3.1 在固定 Linux Chromium 环境生成视觉快照并提交基线，验证 actual/expected/diff 可比较
- [x] 3.2 配置功能失败 trace/截图/视频和视觉 diff 的 CI 上传，验证报告能定位到具体测试步骤
- [x] 3.3 增加显式视觉基线更新命令和审查说明，验证普通测试不会覆盖快照且 macOS 缺失基线时提示清晰

## 4. 集成验证

- [ ] 4.1 运行功能 E2E、视觉回归、`pnpm typecheck` 和 `pnpm lint`，确认分层测试全部通过
- [ ] 4.2 在至少两个 worker 下重复运行两类测试并检查无时序抖动，保存 CI 结果和失败产物样例

> 验证备注：功能 E2E 已在 4 个 worker 下 26/26 通过；当前开发机为 macOS，视觉命令按设计因缺少 Linux Chromium 基线失败并保留诊断产物，视觉通过需在 CI 的 Ubuntu Chromium 环境完成。
