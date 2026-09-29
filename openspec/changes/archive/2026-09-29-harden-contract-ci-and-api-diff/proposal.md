# Proposal

## Why

现有 `check:api` 能校验 OpenAPI、重新生成 Orval 客户端和工作树零 diff，但对暂存/未跟踪生成文件的边界不够明确，也没有对契约兼容性检查做出可执行的选择说明。随着真实 Java `/v3/api-docs` 联调，CI 需要更清楚地区分前端生成一致性和后端安全契约责任。

## What Changes

- 加固生成客户端零 diff 检查，使暂存、未跟踪和临时生成结果都能得到一致判断。
- 明确当前仓库只负责 OpenAPI schema/生成一致性，不声称覆盖 Java Spring Security 和数据范围兼容性。
- 增加可选的 OpenAPI breaking-change 基线策略说明；若暂不启用，CI 必须明确记录原因和边界。
- 为检查脚本增加失败场景测试：非法 schema、Problem Details 缺失、生成差异和兼容性边界。
- 保持 `src/api/generated` 只能由 Orval 生成，不修改 API 响应语义或 Java 服务端实现。

## Capabilities

### New Capabilities

- `contract-ci-diff-and-compatibility`：定义前端 OpenAPI 校验、生成一致性、暂存边界和 breaking-change 责任边界。

### Modified Capabilities

无；`contract-ci` 的现有核心要求保持不变，本 change 将其检查边界具体化并补充可执行回归。

## Impact

涉及 `scripts/check-api.mjs`、契约测试/fixtures、CI workflow 和相关开发文档。可能新增固定版本的兼容性检查工具，但只有在确认基线来源可复现后才引入；不改变运行时页面和生成模型。
