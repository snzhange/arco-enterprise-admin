# request-and-session-test-coverage Specification

## Purpose

为请求错误和认证会话建立快速、直接且可重复的自动化验证，使网络故障、凭证错误、会话过期和用户主动退出不会因回归而产生错误导航或重复提示。

## Requirements

### Requirement: 请求策略和错误边界必须有直接测试保障

测试 SHALL 覆盖登录、会话探测、业务请求和退出请求的不同错误策略，并验证 HTTP Problem Details、网络错误、超时、取消和未知异常被交给正确的处理边界。取消请求 MUST 不产生会话过期或错误 Message。

#### Scenario: 登录凭证错误留在登录上下文

- **WHEN** 登录请求返回 401 和服务端 detail
- **THEN** 测试 SHALL 证明错误被页面消费、不会触发全局会话过期导航，并保留表单上下文

#### Scenario: 业务 401 只触发一次会话流程

- **WHEN** 两个业务请求并发返回 401
- **THEN** 测试 SHALL 证明只清理一次会话缓存、只显示一次提示并只导航一次到登录页

#### Scenario: 取消和网络错误保持语义区分

- **WHEN** 请求被 abort、超时或没有 HTTP response
- **THEN** 测试 SHALL 证明取消保持安静，超时和网络错误分别进入可重试错误语义

### Requirement: 受保护路由的会话状态必须可测试恢复

测试 SHALL 覆盖受保护页面的 pending、明确未认证、网络/超时/5xx 以及成功状态。明确 401 SHALL 保留安全的 pathname、search 和 hash；其他会话服务故障 SHALL 留在可重试状态，不得跳转登录页。

#### Scenario: 未认证访问安全返回

- **WHEN** 未认证用户访问带查询和 hash 的受保护地址
- **THEN** 测试 SHALL 证明登录页接收站内 return path，登录成功后恢复原地址

#### Scenario: 会话服务故障可重试

- **WHEN** 会话探测返回网络错误、超时或 5xx
- **THEN** 测试 SHALL 证明当前页面显示会话错误和重试入口，不显示凭证过期跳转

### Requirement: 登录退出和账号切换必须覆盖缓存边界

测试 SHALL 验证登录成功、退出成功和业务 401 都会隔离旧账号 Query 缓存；退出失败 SHALL 保持当前会话。账号切换测试 SHALL 验证新账号重新请求用户列表且不复用旧账号权限或业务数据。

#### Scenario: 登录成功清理旧账号

- **WHEN** QueryClient 中存在旧身份和业务数据，随后登录新账号成功
- **THEN** 测试 SHALL 证明旧缓存和进行中请求被清理，新账号从空缓存重新获取会话和业务数据

#### Scenario: 退出失败不丢失会话

- **WHEN** 退出接口返回服务端错误
- **THEN** 测试 SHALL 证明用户仍停留在当前工作台并能继续使用当前会话
