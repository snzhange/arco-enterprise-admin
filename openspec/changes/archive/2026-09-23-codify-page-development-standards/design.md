# Design

## Context

见 proposal.md。仓库已用 `route-manifest.tsx` 统一菜单和路由，`src/api/errors.ts` 规范化错误，`UsersPage` 和官方查询表格页分别验证了服务端与本地数据的薄组件组合。`e2e/admin.spec.ts` 当前只写入调试截图；CI 已有独立 Chromium E2E job 和失败 artifact。

## Goals / Non-Goals

**目标：** 用真实代码作指南的可查证依据；为少量核心页面建立可运行的三视口视觉回归，并修正文档对测试现状的描述。

**非目标：** 改动通用组件 API、生成客户端、Java 后端、所有历史官方展示页或引入页面代码生成器。

## Decisions

1. 将 `docs/page-development-guide.md` 作为唯一详尽入口；README 和 `AGENTS.md` 只负责链接及少量强约束。服务端列表以 `UsersPage.tsx` 为实例，本地列表以 `SearchTablePage.tsx` 为实例；附短的正确签名示例，业务逻辑引用源文件，避免复制长代码。
2. 路由示例明确分组/叶子权限同时生效、`messageKey` 需要在 `src/app/i18n/messages.ts` 登记、隐藏受保护路由在单独数组、公开页与重定向分别在各自数组。列表采用当前 `useListQueryState` 的 1 基 UI 与 0 基请求，以及 `getListUsersQueryKey()` 精确失效；`ApiError` 使用 `kind`、`fieldErrors` 和 `traceId`，不直接依赖 Axios 错误形态。
3. 在独立的 `e2e/visual.spec.ts` 中用 `toHaveScreenshot` 对固定视口的工作台、用户表格、用户抽屉取少量区域截图；固定 Mock 用户、主题、语言与时区，禁用动画和 CSS transition，等待数据与字体稳定，避免依赖动态时间内容。三个视口均有明确可操作性与横向滚动断言。项目 Chromium 版本由锁文件固定，CI Linux 使用确定的字体依赖和 Playwright screenshot artifact；基线命令及评审更新流程写进指南。相较覆盖全部官方页，选取业务关键区域更容易审核回归差异。
4. 在公共页面原语对应的 CSS 选择器中替换通用灰/边框/背景硬编码为现有 Arco Token；只触及本次覆盖的样式。图表类别色、品牌示例图像和官方对照页保持现状。

## Risks / Trade-offs

- [字体和操作系统差异造成截图噪声] → 仅截稳定区域，固定字体环境与容差；基线需要在与 CI 一致的 Chromium/Linux 环境审核，保留失败的差异图，不自动批准更新。
- [页面示例随实现演进失效] → 文档只包含小型、真实签名片段并链接具体文件；新增页面验收时检查示例引用。
- [Mock 内容或 UI 动画不稳定] → 测试等待明确页面就绪状态，冻结时间，关闭动画并使用独立浏览器上下文；每张基线失败都保留 Playwright trace。

## Migration Plan

先写指南和入口，调整少量通用样式，再生成并核验视觉基线；CI 原有 E2E job 自动执行新增测试。回退只需移除视觉测试及其基线与对应文档入口，业务 API/路由不受影响。
