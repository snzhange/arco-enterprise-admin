# Proposal

## Why

构建产物中存在较大的工作台轮播媒体和非首屏资源，当前体积告警不能稳定反映用户真实下载成本。需要在不牺牲页面功能的前提下压缩媒体、延迟非首屏加载，并建立可审查的资源预算。

## What Changes

- 压缩并替换过大的工作台轮播资源，记录尺寸、格式和质量验收结果。
- 延迟加载非首屏图片、轮播媒体和相关模块，保证首屏关键内容优先可用。
- 分析 JavaScript/CSS chunk，移除不必要的重复依赖和意外引入。
- 建立基于 gzip 产物和关键资源的预算检查；超预算使 CI 失败，不通过提高 warning limit 掩盖增长。

## Capabilities

### New Capabilities

- `build-assets-and-budgets`：定义生产构建资源优化、加载优先级和预算门禁。

### Modified Capabilities

无。

## Impact

涉及 `public`/页面媒体资源、路由或组件懒加载、Vite 构建配置、CI 脚本和性能文档；不改变 API 契约及业务交互语义。
