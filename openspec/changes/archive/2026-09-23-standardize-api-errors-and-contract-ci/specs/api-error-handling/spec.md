# Spec Delta

## Purpose

为后台请求提供一致、可诊断且不会误导用户的错误语义，使登录、会话探测和业务请求在不同失败条件下呈现可预测的恢复路径。

## ADDED Requirements

### Requirement: 应用必须暴露稳定的错误分类

系统 SHALL 将 HTTP Problem Details、Axios transport failure 和未知异常规范化为稳定的应用错误模型。模型 MUST 区分 `validation`、`unauthenticated`、`forbidden`、`not-found`、`network`、`timeout`、`server` 和 `unknown`，并在可用时保留 `status`、`code`、`title`、`detail`、`traceId`、字段错误数组和原始原因。页面 SHALL 不需要读取 Axios response 结构来判断分类。

#### Scenario: Problem Details 字段完整保留

- **WHEN** 服务端返回 `application/problem+json`，包含 `status`、`title`、`detail`、`code`、`traceId` 和 `fieldErrors`
- **THEN** 应用错误 SHALL 保留这些字段，并 SHALL 将状态 400 归类为 `validation`

#### Scenario: HTTP 状态按语义分类

- **WHEN** 请求返回 401、403、404 或 5xx
- **THEN** 应用错误 SHALL 分别归类为 `unauthenticated`、`forbidden`、`not-found` 或 `server`，并保留原始状态码

#### Scenario: transport failure 不伪装成服务端错误

- **WHEN** 请求没有收到 HTTP response、发生超时、被 abort 或抛出普通 Error/未知值
- **THEN** 应用 SHALL 分别提供 `network`、`timeout`、无用户误导提示的取消结果或安全的 `unknown` 兜底

### Requirement: 用户可获得一致且可恢复的错误反馈

系统 SHALL 为字段校验、权限、资源不存在、网络离线、超时和服务端故障提供明确的页面级反馈。`fieldErrors` SHALL 能映射到当前 Arco Form 的字段；非字段 detail SHALL 作为表单级错误；存在 `traceId` 时 SHALL 支持安全展示或复制。查询类错误 SHALL 提供重试入口，且网络错误不得展示服务端错误文案。

#### Scenario: 字段错误回填表单

- **WHEN** 创建或更新表单收到带有字段路径和消息的 400 `fieldErrors`
- **THEN** 对应字段 SHALL 显示校验消息，表单级 detail SHALL 同时可见，且不会只显示通用“请求失败”

#### Scenario: 403 保留当前页面

- **WHEN** 已登录用户读取或修改资源时收到 403
- **THEN** 页面 SHALL 显示无权限状态或操作提示，且 SHALL 保留当前页面和未提交的上下文

#### Scenario: 网络、超时和 5xx 可重试

- **WHEN** 查询遇到网络错误、超时或 5xx
- **THEN** 页面 SHALL 显示对应的恢复提示和重试入口；若有 traceId，诊断信息 SHALL 可见，且不会将错误当成未登录

### Requirement: 401 会话策略必须按请求意图区分

系统 SHALL 明确区分登录接口、会话探测接口和已登录业务接口的 401 行为。登录接口 401 SHALL 留在登录页并显示凭证错误；会话探测 401 SHALL 跳转登录页并安全保留 pathname、search 和 hash；会话探测的网络错误、超时和 5xx SHALL 留在可重试的会话失败状态；已登录业务接口 401 SHALL 失效当前会话查询并进入统一过期流程。

#### Scenario: 登录凭证错误原地展示

- **WHEN**登录请求返回 401
- **THEN** 登录页 SHALL 保留用户输入上下文、展示服务端 detail 或安全文案，且 SHALL 不触发会话过期导航循环

#### Scenario: 未认证访问受保护页面

- **WHEN** 会话探测明确返回 401，且当前 URL 含路径、查询或 hash
- **THEN** 系统 SHALL 导航到登录页并保留安全的原始地址，登录成功后 SHALL 只返回站内地址

#### Scenario: 会话服务暂时不可用

- **WHEN** 会话探测返回网络错误、超时或 5xx
- **THEN** 系统 SHALL 显示会话加载失败和重试控件，且 SHALL 不跳转登录页

#### Scenario: 已登录业务请求会话过期

- **WHEN** 两个或更多已登录业务请求并发返回 401
- **THEN** 系统 SHALL 使当前会话 query 失效、只显示一次会话过期提示并只导航一次到登录页

### Requirement: 全局与页面错误处理不得重复

系统 SHALL 为请求提供显式的处理策略，使全局会话协调器、全局提示和页面接管互斥。登录、会话探测和登出请求 SHALL 有明确策略，不得依赖散落的 URL 字符串例外；取消请求 SHALL 不产生错误 Message。

#### Scenario: 页面接管不重复弹窗

- **WHEN** 页面声明自行处理一个 mutation 的错误
- **THEN** 全局 handler SHALL 不再为同一请求弹出第二条 Message，页面 SHALL 仍可读取规范化错误

#### Scenario: 取消请求保持安静

- **WHEN** 用户主动取消请求或组件卸载导致请求 abort
- **THEN** 系统 SHALL 不显示网络失败、会话过期或服务端故障提示
