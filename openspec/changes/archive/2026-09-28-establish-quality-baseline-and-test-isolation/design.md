# Design

## Context

当前 Vitest 使用 V8 provider，覆盖率默认包含 `src` 下非生成代码，已有 `pnpm test:coverage`，但 CI 只运行普通单测。最近一次基线测得 Lines 33.69%、Branches 42.58%；核心基础模块覆盖较好，页面编排层仍有较多未覆盖代码。测试共享 `src/mocks/handlers.ts` 的模块级 `currentUser`、`users` 和 `roles`，而现有清理只覆盖 MSW handler、`sessionStorage` 和 QueryClient 的局部实例。

## Goals / Non-Goals

**Goals:**

- 让本地与 CI 使用相同的覆盖率配置和失败语义。
- 以可解释的全局 Lines/Branches 门槛阻止明显回退，同时保留后续提升核心模块门槛的空间。
- 让 Mock 数据、身份、角色持久化和 QueryClient 在测试边界可复位，并验证测试顺序独立。
- 让 CI 在质量检查成功或失败时都提供可审计的覆盖率报告。

**Non-Goals:**

- 不在本 change 中补齐 `http.ts`、`routes.tsx`、`RolesPage`、`AppLayout` 等业务模块的目标覆盖率。
- 不改变生产认证、QueryClient 运行时配置、OpenAPI、生成客户端或页面交互。
- 不把覆盖率门槛扩展为单个文件强制门槛，也不把 E2E/视觉基线混入 Vitest 覆盖率统计。

## Decisions

### 1. 复用 V8，门槛只设 Lines 和 Branches

继续使用已锁定的 `@vitest/coverage-v8`，避免引入新的 coverage 工具。首期门槛以当前干净 CI 基线复核后确定，建议从 Lines 35%、Branches 45% 起步；Functions 和 Statements 先继续报告但不作为失败条件，因为当前函数计数会被 JSX/组件包装放大，容易造成低信噪比门禁。后续核心模块补测完成后再提升全局和模块级门槛。

替代方案是立即设置 70% 全局门槛，容易把当前历史展示页和未覆盖的框架编排代码混为一谈，阻碍后续增量工作；不设置门槛则无法阻止回退。

### 2. 在 quality job 中单独执行覆盖率并上传 artifact

增加 `test:coverage:check` 或等价脚本，CI 直接执行带门槛的 coverage 命令；普通 `pnpm test` 继续作为快速反馈。覆盖率 artifact 使用工作流的 `if: always()`，路径固定为 `coverage/`，并在报告中保留 `coverage-summary.json`。

替代方案是只把覆盖率发布到外部服务；这会增加凭证和服务依赖，当前仓库只需要可审计的 CI artifact。

### 3. Mock 采用固定快照恢复，而不是重新加载模块

在 `src/mocks/handlers.ts` 暴露测试专用的复位函数或状态工厂：保存初始用户/角色快照，复位时深拷贝恢复数组并重置当前身份。`sessionStorage` 由测试 setup 清理；`server.resetHandlers()` 仍只负责恢复 handler 覆盖。这样既能保留单个测试内的角色持久化，也不会依赖 Vitest 模块重载或测试文件隔离策略。

替代方案是每个测试动态 `vi.resetModules()`，但 MSW server、模块级 handler 和 React import 顺序会变得脆弱，且无法清晰表达业务状态边界。

### 4. QueryClient 在测试 helper 中按用例创建

新增轻量测试 helper 或约定，由组件测试在 `render` 时创建 `QueryClient`，设置 `retry: false`，测试结束销毁 observer 并清理 cache。不得复用应用入口的单例 QueryClient，也不把清理逻辑放入生产代码。涉及进行中请求的测试显式等待取消 promise 完成。

## Risks / Trade-offs

- [Risk] 当前未提交的本地改动会影响覆盖率基线 → 在实现前以目标分支干净快照重新运行 coverage，并把最终数字记录在 CI 日志或 change 验收记录中。
- [Risk] 全局门槛过低只能防止回退，不能保证核心页面质量 → 本 change 完成后创建后续页面测试 change，按 `http/routes/login/roles` 分层提高门槛。
- [Risk] Mock 复位函数被业务代码误用 → 将其放在明确的测试支持模块或以 `resetMockStateForTests` 命名，并只在 Vitest setup/test 中导入。
- [Risk] QueryClient 清理遗漏导致未处理取消异常 → 测试 helper 对取消 promise 做显式等待，并增加至少一个 in-flight query 回归场景。

## Migration Plan

1. 先实现 Mock 状态快照与测试复位，再迁移现有 `rbac.test.ts` 的 setup/teardown。
2. 增加 QueryClient 测试 helper，迁移已有组件测试并验证顺序随机化/并行执行。
3. 在本地生成覆盖率，复核门槛，再更新 package script 和 CI artifact。
4. 运行全套 typecheck、lint、test、coverage、build、check:api；E2E 不作为本 change 的实现门禁变更。

## Open Questions

无。覆盖率具体数字在实现前按当前目标分支的干净测试结果确认，不改变规格中的门禁类型和隔离语义。
