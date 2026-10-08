# 官方页面覆盖矩阵

> 核对日期：2026-10-08。本表描述当前仓库的官方路由和测试边界；复制到新项目后，应按实际业务页面重新分类和维护。

本文档将当前 manifest 中的官方展示页面分为正式支持页面和展示示例。正式支持页面必须有共置行为测试；展示示例使用行为测试或视觉基线验收，不计入业务 API 支持承诺。

| 路由 | 页面 | 分类 | 权限前置 | 主要行为与状态 | 验收方式 |
| --- | --- | --- | --- | --- | --- |
| `/dashboard/monitor` | MonitorPage | 正式支持 | `dashboard:read` | 消息发送、搜索、轮播操作、更新反馈 | 行为测试 + 视觉回归 |
| `/visualization/data-analysis` | DataAnalysisPage | 展示示例 | `visualization:read` | 图表/表格展示、无数据视觉 | 视觉回归 + 隔离渲染测试 |
| `/visualization/multi-dimension-data-analysis` | MultiDimensionPage | 展示示例 | `visualization:read` | 多维图表和筛选展示 | 视觉回归 + 隔离渲染测试 |
| `/list/search-table` | SearchTablePage | 正式支持 | `list:read` | 查询、重置、空态、排序、新建校验与成功 | 共置行为测试 |
| `/list/card` | CardListPage | 正式支持 | `list:read` | 搜索、分类、卡片/列表视图、启用切换、新建 | 共置行为测试 |
| `/form/group` | GroupFormPage | 正式支持 | `form:read` | 必填校验、重置、提交成功 | 共置行为测试 |
| `/form/step` | StepFormPage | 正式支持 | `form:read` | 分步校验、返回、完成、再次创建 | 共置行为测试 |
| `/profile/basic` | BasicProfilePage | 展示示例 | `profile:read` | 参数展示、流程状态和返回入口 | 视觉回归 + 隔离渲染测试 |
| `/result/success` | SuccessResultPage | 展示示例 | `result:read` | 成功结果与返回列表 | 视觉回归 + 路由行为测试 |
| `/result/error` | ErrorResultPage | 展示示例 | `result:read` | 错误详情、返回修改、重新提交入口 | 视觉回归 + 路由行为测试 |
| `/exception/403` | Exception403Page | 正式支持 | `exception:read` | 无权限说明、返回首页 | 行为测试 |
| `/exception/404` | Exception404Page | 正式支持 | `exception:read` | 不存在说明、重载、返回首页 | 行为测试 |
| `/exception/500` | Exception500Page | 正式支持 | `exception:read` | 服务异常说明、返回首页 | 行为测试 |
| `/user/info` | UserInfoPage | 正式支持 | `user:read` | 用户资料展示和基础操作 | 行为测试 |
| `/user/setting` | UserSettingPage | 正式支持 | `user:read` | 基本信息保存/重置、tab 切换、安全与认证记录 | 行为测试 |

暂未完成的正式页面测试不得通过 coverage exclude 隐藏，必须在对应 OpenSpec change 或路线图中登记。
