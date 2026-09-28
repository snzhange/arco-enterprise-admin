# Tasks

## 1. Mock 状态隔离

- [x] 1.1 在 `src/mocks/handlers.ts` 为用户、角色和当前身份保存固定初始快照，并提供仅测试支持代码使用的复位入口；用 `pnpm test -- src/mocks/rbac.test.ts` 验证复位前后用户、角色和身份均恢复默认值
- [x] 1.2 更新 `src/mocks/rbac.test.ts` 与测试 setup 的 before/after 边界，清理 Mock 状态、`sessionStorage` 和 handler override；连续执行包含创建用户、保存角色和切换身份的测试，验证测试顺序不影响结果
- [x] 1.3 保留同一测试内的角色持久化行为，增加回归断言确认保存后再次读取仍看到修改，复位只发生在测试边界

## 2. QueryClient 测试隔离

- [x] 2.1 增加可复用的测试 QueryClient 创建/清理 helper，默认关闭无关 retry，并验证每个测试使用独立缓存而不是应用入口单例
- [x] 2.2 迁移现有组件和页面测试使用该 helper，覆盖缓存数据、observer 和进行中请求的清理；运行 `pnpm test` 验证无未处理取消异常
- [x] 2.3 增加至少一个 in-flight query 隔离测试，验证测试结束后请求被取消、缓存为空且下一个用例不会收到前一个用例的数据

## 3. 覆盖率命令与质量门禁

- [x] 3.1 根据干净目标分支重新运行 `pnpm test:coverage`，记录 Lines/Branches 基线，并在 `vitest.config.ts` 设置首期保守全局门槛；用人为低覆盖率临时验证门槛失败后恢复工作树
- [x] 3.2 增加明确的 coverage check 脚本或参数组合，统一本地与 CI 的覆盖率入口，并保留 text、json-summary 和 HTML 报告；运行该脚本验证成功输出包含实际值和目标值
- [x] 3.3 更新 `.github/workflows/ci.yml`，在 quality job 执行 coverage check，并用 `if: always()` 上传 `coverage/` artifact；检查 workflow YAML 和失败路径确保报告仍被上传

## 4. 文档、回归与交付验证

- [x] 4.1 在 `docs/page-development-guide.md` 补充单测覆盖率口径、QueryClient/MSW 隔离约定和页面测试选择边界；检查示例路径与实际 helper 文件一致
- [x] 4.2 运行 `pnpm typecheck`、`pnpm lint`、`pnpm test`、`pnpm test:coverage`、`pnpm build` 和 `pnpm check:api`，确认生成客户端零 diff
- [x] 4.3 在 Linux CI 等价环境运行或验证 `pnpm e2e` 不受 Mock 状态复位改动影响，并记录 coverage artifact、单测结果和剩余未覆盖模块，供后续 C1 页面/请求测试 change 使用（本机功能 E2E 26/26 通过；视觉 5 项因缺少 Darwin 快照失败，Linux 基线需在 CI 验证）
