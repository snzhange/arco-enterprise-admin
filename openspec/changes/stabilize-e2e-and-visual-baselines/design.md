# Design

## Context

现有 Playwright 测试同时承担页面行为和截图校验，运行环境、Mock 状态与并行策略未形成统一约束。视觉快照对浏览器、字体和操作系统敏感，而功能 E2E 更关注用户可观察行为，两者需要不同的失败处理和产物保留策略。

## Goals / Non-Goals

**Goals:**

- 使用 Playwright projects 和独立 scripts 分离功能与视觉测试。
- 在 CI 固定 Linux Chromium 容器/运行器和渲染参数；本地运行保持可诊断。
- 通过 fixtures、路由 Mock、稳定时钟和状态等待消除共享状态与时序抖动。
- 统一 trace、截图和视觉 diff 的上传策略，并保护基线免被普通运行覆盖。

**Non-Goals:**

- 不把 macOS 渲染结果直接写入 Linux 基线。
- 不覆盖真实后端联调、性能压测或跨浏览器兼容性矩阵。
- 不改变业务页面和 API 契约。

## Decisions

### 1. 使用两个 Playwright project

功能 project 运行常规 spec，视觉 project 只运行视觉标记用例并使用固定截图配置。相比在单个用例中用条件分支，project 隔离能让命令、报告和 CI job 有清晰边界。

### 2. CI 固定 Linux Chromium，开发机只做显式更新

视觉快照以 CI Linux Chromium 为唯一基线。macOS 默认只校验或提示环境差异；需要更新时使用显式的 CI/容器命令，避免平台快照混入仓库。相比为每个平台维护一套基线，这能降低维护成本和误报面。

### 3. Fixture 负责状态和时钟隔离

通过每测试独立的 context、路由 Mock、固定时钟和基于响应/可见状态的等待替代共享全局数据与固定 sleep。测试数据版本化在 fixtures 中，便于并行复现。

### 4. 失败产物按测试类型分目录

功能失败上传 trace、截图和必要视频；视觉失败上传 expected/actual/diff。基线更新仅由专用命令完成，并在 CI 中要求变更快照与代码一并审查。

## Risks / Trade-offs

- [Risk] 固定字体或 Chromium 版本升级造成大范围快照变化 → 锁定镜像/浏览器版本，升级单独提交并批量审查。
- [Risk] Mock 过度固定掩盖真实接口问题 → 保留独立的契约和联调检查，不把 E2E Mock 当作后端正确性证明。
- [Risk] 分离 project 后测试重复配置 → 提取共享 fixture 和基础配置，仅在 project 层覆盖差异参数。

## Migration Plan

1. 为现有用例添加功能/视觉标签并建立两个 project。
2. 把共享 Mock、时钟和等待逻辑迁移到 fixtures，先让功能 E2E 在本地和 CI 稳定通过。
3. 在固定 Linux Chromium 环境生成并提交视觉基线，启用独立视觉 job。
4. 保留旧命令兼容入口一个迭代周期，确认 CI 结果等价后删除混合执行路径。

