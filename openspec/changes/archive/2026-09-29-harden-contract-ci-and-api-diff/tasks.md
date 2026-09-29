# Tasks

## 1. 生成一致性检查

- [x] 1.1 重构 `scripts/check-api.mjs` 使生成结果写入临时目录或隔离输出并按内容比较，覆盖 staged、unstaged 和 untracked 状态；用临时 fixture 验证差异失败
- [x] 1.2 保留并细化 OpenAPI/Problem Details 校验错误，断言输出包含 method、path、status 或 schema 定位信息
- [x] 1.3 增加生成一致性脚本测试，覆盖成功、OpenAPI 非法、Problem Details 缺失和生成结果漂移

## 2. 兼容性边界与文档

- [x] 2.1 在 CI 和 README/开发指南中明确当前只验证前端 schema/生成一致性，Java 401/403、数据范围和真实 `/v3/api-docs` 由后端仓库负责
- [x] 2.2 记录 breaking-change 检查暂不启用的原因、未来基线要求和独立引入条件

## 3. 集成验证

- [x] 3.1 运行 `pnpm check:api`，确认生成目录零 diff 且临时目录被清理
- [x] 3.2 运行 `pnpm typecheck`、`pnpm lint`、`pnpm test` 和 `pnpm build`，确认契约检查改造不影响应用
