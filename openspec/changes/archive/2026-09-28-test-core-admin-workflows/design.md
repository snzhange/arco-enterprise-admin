# Design

## Context

用户页已经有少量 Testing Library 测试，角色页和设置/工作台主要依赖 Playwright 或未覆盖。业务页面使用生成的 TanStack Query hooks、AuthProvider、Arco 组件和 MSW handler；C0/C1 将提供稳定的 QueryClient、Mock 状态和请求边界测试支持。

## Goals / Non-Goals

**Goals:**

- 让角色和用户的高风险编辑路径在组件层可快速回归。
- 让设置存储和 Dashboard 错误状态有直接验证。
- 使用用户可观察结果和请求 payload 断言，避免绑定 Arco 内部实现。
- 让组件测试与 E2E 形成分层，而不是复制整条浏览器流程。

**Non-Goals:**

- 不追求所有官方展示页逐行覆盖。
- 不改页面业务逻辑、API schema、权限契约或组件公共 API。
- 不在本 change 中实现 Error Boundary 或资源性能优化。

## Decisions

### 1. 角色和用户页采用组件集成测试

使用 AuthProvider、MemoryRouter、QueryClientProvider 和 mock generated hooks/MSW 响应，验证权限、表单、请求 payload、缓存失效和错误恢复。这样可以直接覆盖页面控制器，同时避免启动完整应用。

### 2. 复杂数据使用最小夹具

每个场景只提供必要的角色、权限、用户和错误 payload；未知权限、停用角色和字段错误使用显式 fixture。避免复用大段生产 Mock 数据导致测试对无关字段敏感。

### 3. 展示页面按风险分层

Dashboard、设置和官方页面测试只覆盖数据状态、恢复操作和关键交互；静态视觉细节继续由现有 Playwright 断言负责，不在 Vitest 中重复截图。

## Risks / Trade-offs

- [Risk] Arco 组件 DOM 变化造成测试脆弱 → 优先使用 role、label、文本和用户操作，不依赖生成 class。
- [Risk] Mock hook 与真实 hook 行为差异 → 对关键请求保留 MSW 集成场景，并继续运行现有 E2E。
- [Risk] 页面测试数量快速膨胀 → 以规格场景为准，每个行为只保留一个清晰测试，避免重复 happy path。

## Migration Plan

1. 先补角色页和用户页错误/权限场景。
2. 接入设置与 Dashboard 的状态测试。
3. 运行 coverage，记录核心页面覆盖率变化。
4. 运行全量单测、构建、契约检查和关键 E2E。
