# Proposal

## Why

路由清单、统一错误模型和企业页面原语已经落地，但新增页面时仍缺少一份与真实代码一致的中文开发与验收指南。README 对截图覆盖范围的描述也超前于现有测试，关键页面缺乏可重复的视觉断言。

## What Changes

- 编写中文页面开发指南，以现有 route manifest、Orval/TanStack Query、权限边界、`ApiError` 和页面原语为准，提供最小可复制示例与页面验收清单。
- 更新 README、`AGENTS.md` 和相关授权/能力对照文档的入口与现状描述；校正截图测试声明。
- 核对新增页面原语的通用颜色与间距，仅将可替换的通用色迁移到现有 Arco Token/项目变量。
- 在少量真实页面上加入固定视口的 Playwright 视觉断言，稳定 Mock、动画与字体环境，使 CI 能执行基线并保留失败差异。
- 不变更组件 API、OpenAPI 契约或生成客户端，不批量重构官方展示页面。

## Capabilities

### New Capabilities

- `page-development-standards`：中文页面开发与验收指南、仓库入口一致性和关键页面可执行视觉回归。

### Modified Capabilities

无；既有路由、错误和页面模式的运行时要求保持不变。

## Impact

主要涉及 `docs/page-development-guide.md`、README、`AGENTS.md`、相关授权与能力对照文档、Playwright 用例/配置/截图基线、CI 的 E2E 环境和少量通用样式。没有新增业务接口或运行时依赖；现有 E2E job 将验证新增的视觉断言。
