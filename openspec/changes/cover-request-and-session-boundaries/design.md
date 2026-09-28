# Design

## Context

`src/api/http.ts` 已通过 `RequestPolicy` 区分业务、会话、登录和退出请求，`session-expired.ts` 负责并发 401 协调，路由层通过 TanStack Query 查询当前用户。现有 E2E 已覆盖部分场景，但直接单测很少，导致请求错误映射和认证导航回归反馈较慢。

## Goals / Non-Goals

**Goals:**

- 通过请求层单测固定 policy、错误回调、取消和会话过期通知边界。
- 通过路由/页面集成测试固定认证导航、重试和缓存清理行为。
- 复用 C0 的 QueryClient、MSW 状态复位和测试 setup，保持测试可并行执行。

**Non-Goals:**

- 不改变运行时错误模型、请求策略或认证 UI。
- 不在本 change 中覆盖角色编辑、设置持久化、Error Boundary 或 E2E 视觉基线。
- 不新增真实后端接口或修改生成代码。

## Decisions

### 1. 请求层使用 mock adapter 验证可观察结果

对 Axios client 使用受控 adapter/Mock handler，断言返回的 `ApiError`、`notifySessionExpired`、`onApiError` 和抛出行为，而不是断言 Axios 内部实现。这样可以覆盖四种 policy 和 transport failure，同时不依赖网络。

### 2. 会话路由使用最小集成 harness

使用 MemoryRouter、QueryClientProvider 和受控生成 hook/mock，验证 ProtectedLayout、SessionExpiredBridge 和登录 return path。比直接测试 React Router 全部实现更稳定，也比只测纯函数能覆盖真实导航行为。

### 3. 保留 E2E 作为跨页确认

已有 E2E 继续覆盖真实浏览器中的登录、退出和账号切换；本 change 只补快速单元/集成层，避免把每种错误矩阵全部复制到 Playwright。

### 4. 测试状态由 C0 helper 统一管理

每个集成测试创建自己的 QueryClient；MSW handler 在测试边界复位。任何会话过期测试都显式 reset coordinator，避免依赖测试文件顺序。

## Risks / Trade-offs

- [Risk] 路由集成测试可能过度 mock 而遗漏真实生成 hook 行为 → 保留代表性 E2E，并对请求层单测使用真实错误转换。
- [Risk] 并发 401 测试存在异步时序波动 → 使用可控 deferred promise 和明确等待导航/handler 完成。
- [Risk] 登录页测试需要模拟 Arco Form → 只断言用户可观察的错误、导航和缓存结果，不断言第三方组件内部结构。

## Migration Plan

1. 先为 `http.ts` 和 `session-expired.ts` 增加直接测试。
2. 使用 C0 helper 增加受保护路由、登录和退出集成测试。
3. 运行单测与 coverage，确认新增测试不依赖顺序。
4. 运行现有 E2E 关键认证流程，确认行为没有变化。
