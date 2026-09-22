# 企业后台能力补齐路线图

本目录将 `docs/ant-design-pro-vs-arco.md` 第 9 节的方向性建议，整理为一份分析报告和五个可独立交接的 change 落地清单。

## 阅读顺序

1. [总分析报告](./analysis-report.md)
2. [Change 01：统一 Route Manifest](./change-01-unify-route-manifest.md)
3. [Change 02：规范 RBAC 契约](./change-02-normalize-rbac-contracts.md)
4. [Change 03：统一 API 错误与契约 CI](./change-03-standardize-api-errors-and-contract-ci.md)
5. [Change 04：建设企业页面模式](./change-04-build-enterprise-page-patterns.md)
6. [Change 05：固化页面开发规范](./change-05-codify-page-development-standards.md)

## 状态说明

- 这些文件是规划和交接材料，不代表对应能力已经实现。
- 当前没有为五项工作创建 OpenSpec change。
- 后续建议每个新会话只处理一个清单，先用清单末尾的 `$openspec-propose` 提示创建正式 change，再评审和实现。
- 五个清单是范围上限。实现过程中发现跨 change 的新需求时，应先更新 proposal/design，而不是顺手扩大代码改动。

## 推荐顺序

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

Change 01 与 Change 02 技术上可以并行，但顺序执行更便于控制权限模型的变化范围。
