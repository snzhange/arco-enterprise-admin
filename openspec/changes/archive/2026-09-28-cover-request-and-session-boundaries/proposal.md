# Proposal

## Why

请求错误策略、受保护路由和账号切换决定用户能否安全地进入、恢复或退出业务会话，但目前这类边界多数只由端到端流程间接覆盖。给后续角色和页面测试建立基础前，应先让请求分类、401 协调与认证导航拥有快速、确定的单元/集成回归。

## What Changes

- 为请求层补齐四种 request policy、错误规范化、回调、取消和并发 401 的直接测试。
- 为受保护路由和会话过期流程覆盖加载、401、安全 return path、网络/超时/服务端错误、重试及重复导航。
- 为登录和退出覆盖字段错误、无效凭证、成功后缓存清理、退出失败保持当前会话，以及同标签页更换账号。
- 复用 C0 建立的测试 QueryClient 与 Mock 状态隔离约定；测试覆盖行为，不复制实现细节。
- 不改变 API 错误分类、认证跳转、Cookie、QueryClient 缓存策略或用户可见交互；不把前端测试当作服务端鉴权证明。

## Capabilities

### New Capabilities

- `request-and-session-test-coverage`：定义请求错误策略和认证/会话边界的可验证测试保障。

### Modified Capabilities

无；`api-error-handling` 已定义运行时行为，本 change 只建立其直接自动化验证，不改变错误语义。

## Impact

涉及 `src/api/http.test.ts`、`src/app/routes.tsx` 周边测试、登录/登出测试、C0 测试 helper 和少量必要的会话协调器测试。预期无需新增运行时依赖，不修改 API 契约或生成代码。
