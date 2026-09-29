# Proposal

## Why

当前懒加载页面和应用根部没有统一的渲染异常边界，组件异常或动态 chunk 加载失败可能让用户停留在空白页面。企业后台需要在错误发生后提供明确、可恢复且不泄露内部细节的路径。

## What Changes

- 增加应用级和路由/页面级 Error Boundary，分别处理全局初始化异常、页面渲染异常和懒加载 chunk 失败。
- 提供“重试当前页面”和“返回工作台”等恢复操作，并防止 chunk 失败导致无限刷新循环。
- 统一错误页的中文文案、诊断信息和可访问性语义；取消请求和已处理 API 错误继续由现有错误策略控制。
- 增加渲染异常、动态加载失败、重试成功/失败和恢复导航的组件/浏览器测试。
- 不修改 API 错误分类、后端契约、路由权限或第三方组件行为。

## Capabilities

### New Capabilities

- `error-boundaries-and-recovery`：定义应用与页面渲染异常的隔离、错误展示和恢复行为。

### Modified Capabilities

无；既有 `api-error-handling` 约束请求错误，本 change 只负责非请求渲染和加载异常。

## Impact

涉及 `src/main.tsx`、`src/app/routes.tsx`、新增错误边界/错误状态组件、CSS、测试和 Playwright 诊断配置。无需新增业务接口或依赖。
