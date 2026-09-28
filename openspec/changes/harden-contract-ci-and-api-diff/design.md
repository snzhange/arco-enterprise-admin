# Design

## Context

`scripts/check-api.mjs` 当前执行 validate、`pnpm generate:api`、`git diff --quiet -- src/api/generated` 和 typecheck。直接依赖 Git 工作树 diff，无法完整表达暂存或未跟踪文件边界；仓库没有 Java 后端基线，不能在前端安全地声称完成服务端兼容性检查。

## Goals / Non-Goals

**Goals:**

- 让生成检查比较内容而不是 Git index 状态。
- 保留现有 Problem Details 结构检查和清晰失败信息。
- 记录是否启用 breaking-change 检查以及其基线来源。
- 用脚本测试覆盖主要失败路径。

**Non-Goals:**

- 不修改 OpenAPI schema 或 Orval 生成代码。
- 不在没有可复现基线的情况下引入任意 breaking-change 工具。
- 不替代 Java 仓库的 Spring Security、Service/Repository 和真实 `/v3/api-docs` 测试。

## Decisions

### 1. 使用临时生成目录比较内容

让 Orval 输出到临时目录或复制受控生成目录后比较文件列表与内容，完成后清理临时文件。这样检查不依赖 `git diff` 是否包含 staged/untracked 状态。若 Orval 配置难以临时改写，则使用隔离临时 worktree/目录执行生成并比较，保持同一锁定依赖。

### 2. Breaking-change 检查先明确不启用

在没有 Java 仓库基线和稳定版本策略前，不启用会产生误报的 breaking-change job；文档和 CI 输出明确“当前只检查 schema/生成一致性”。后续获得受控基线后再新增独立 change 引入工具和阈值。

### 3. 脚本测试使用临时 fixtures

将非法 Problem Details、非法 schema 和生成差异作为临时 fixture 或受控复制，不修改真实 OpenAPI。测试验证退出码和诊断文本，避免只测试内部函数。

## Risks / Trade-offs

- [Risk] 临时生成目录与正式 Orval 输出环境不同 → 复用同一 config、lockfile 和 Node 版本，并在 CI 执行 typecheck。
- [Risk] 生成比较忽略文件权限或换行差异 → 比较相对路径和字节内容，统一明确的换行处理。
- [Risk] 团队误读“未启用 breaking check”为缺失质量门禁 → 在 README、脚本输出和路线图明确后端责任边界及未来启用条件。

## Migration Plan

1. 为检查脚本抽出可测试的生成/比较步骤。
2. 增加 fixture 测试并保持现有正常路径通过。
3. 更新 CI 和文档输出边界。
4. 运行完整契约、类型、单测和构建验证。
