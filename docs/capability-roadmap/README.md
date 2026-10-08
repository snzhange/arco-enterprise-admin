# 企业后台能力补齐路线图

> 文档性质：历史路线图和实施记录。当前新项目入口是[新后台搭建指南](../arco-admin-new-project-guide.md)，日常页面规则以[页面开发指南](../page-development-guide.md)为准。

本目录将 `docs/ant-design-pro-vs-arco.md` 第 9 节的方向性建议，整理为一份分析报告和五个 change 落地清单。分析报告的前九节记录 2026-09-22 实施前基线，[第十节](./analysis-report.md#10-2026-09-24-实施进度与后续路线)记录最新状态和后续工作；2026-09-30 起的质量改进 change 与逐路由覆盖情况以本仓库活动 OpenSpec 和[质量覆盖率基线](../quality-coverage-baseline.md)为准。

## 阅读顺序

1. [总分析报告](./analysis-report.md)
2. [Change 01：统一 Route Manifest](./change-01-unify-route-manifest.md)
3. [Change 02：规范 RBAC 契约](./change-02-normalize-rbac-contracts.md)
4. [Change 03：统一 API 错误与契约 CI](./change-03-standardize-api-errors-and-contract-ci.md)
5. [Change 04：建设企业页面模式](./change-04-build-enterprise-page-patterns.md)
6. [Change 05：固化页面开发规范](./change-05-codify-page-development-standards.md)

## 状态说明

- 五项 OpenSpec change 均已归档，路由、前端 RBAC、API 错误处理、页面原语和开发指南均已落地；下方清单保留当时的设计和交接内容，不能再作为“尚未实现”的状态依据。
- 2026-09-24 补修了同标签页退出后换账号会重回登录页的问题；登录成功、退出成功和业务 401 现在会取消进行中的查询并清空旧账号缓存。同标签页切换账号及新账号重新请求用户列表已有单测和 E2E 覆盖。
- 仍未完成的主要工作是 Java 服务端排序、鉴权与数据范围契约测试，以及真实 `/v3/api-docs` 联调。前端 OpenAPI、Mock 和 Playwright 的通过不等于服务端已落实这些约束。
- 截至 2026-10-08，`cover-supported-official-pages`、`verify-linux-e2e-and-visual-regressions` 和 `enforce-directory-coverage-trends` 已完成；`stabilize-e2e-table-keys-and-linux-visuals` 仍等待 Linux CI 的最后验证，`validate-backend-security-and-pagination-contracts` 尚未形成执行任务。官方页面逐路由分类见[覆盖矩阵](../official-page-coverage-matrix.md)；状态以 `openspec list --json` 为准。
- 后续优先级和其他工程改进见[分析报告第十节](./analysis-report.md#10-2026-09-24-实施进度与后续路线)。清单末尾的 `$openspec-propose` 是历史执行提示；不要为已归档的五项 change 再次创建同名提案。

## 原五项 change 的实施顺序（已完成前端部分）

```text
01 Route Manifest
       |
       v
02 RBAC Contracts
       |
       v
03 API Errors + Contract CI
       |
       v
04 Enterprise Page Patterns
       |
       v
05 Page Development Standards
```

原顺序保留用于理解设计依赖；当前开发应按上方最新状态和分析报告的待办顺序推进。
