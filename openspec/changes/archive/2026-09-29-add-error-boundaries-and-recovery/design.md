# Design

## Context

当前路由使用 `Suspense` 展示懒加载占位，但没有 Error Boundary；官方异常页只处理显式业务路由，不能捕获 React 渲染或动态 import 异常。应用入口通过 `createRoot` 启动，适合在根组件外增加最后一道边界。

## Goals / Non-Goals

**Goals:**

- 提供应用级兜底和路由页面级隔离。
- 区分 chunk 加载错误与一般渲染错误，提供有限重试和返回工作台。
- 复用现有错误页风格、路由和国际化入口，保持 role/键盘语义。

**Non-Goals:**

- 不捕获并替代 API 查询错误，查询错误继续由页面状态和 `ApiError` 处理。
- 不自动上报外部监控服务，不展示原始异常消息。
- 不改变路由 manifest、权限和懒加载拆分策略。

## Decisions

### 1. 两层边界

在应用根部增加最后兜底，在受保护页面/`LazyPage` 周围增加路由级边界。页面级边界允许保留 AppLayout 和导航，根级边界负责初始化或布局本身崩溃时的最小恢复。

### 2. 有限重试策略

组件渲染错误通过重新挂载子树重试；chunk 错误第一次可使用一次受控 reload 标记，标记已存在时不再 reload，改为显示返回工作台。使用 sessionStorage 或等价短期标记，避免无限刷新。

### 3. 统一错误状态组件

错误边界复用一个无 API 依赖的状态组件，输入错误类别、重试回调、返回回调和安全 trace id。这样单测可以直接验证可观察行为，不耦合第三方异常对象。

## Risks / Trade-offs

- [Risk] 根级边界依赖 Router 导航 → 根级只提供安全 reload/返回首页，路由级负责站内 navigate。
- [Risk] reload 标记残留导致后续正常加载不重试 → 成功加载后清除标记，并限制标记 key 到失败 chunk 路径。
- [Risk] Error Boundary 捕获到可由页面处理的异常 → 页面 API 错误不通过 throw 进入边界，继续使用现有 query error state。

## Migration Plan

1. 新增错误状态和边界组件，先覆盖路由级渲染异常。
2. 在入口接入根级边界并添加 chunk 错误识别。
3. 增加 Testing Library/Playwright 恢复测试。
4. 运行全套静态、单测、构建和 E2E 验证。
