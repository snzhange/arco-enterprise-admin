# Tasks

## 1. 请求层边界测试

- [ ] 1.1 扩展 `src/api/http.test.ts` 覆盖 business/session/login/logout policy、`onApiError`、401 通知和错误重新抛出；运行该测试文件验证各策略行为
- [ ] 1.2 增加网络、超时、取消和 Problem Details 响应测试，验证取消不产生会话过期通知且其他错误保留分类；运行 `pnpm test -- src/api/http.test.ts src/api/errors.test.ts`
- [ ] 1.3 增加并发 401 的 deferred promise 测试，验证 `session-expired` handler 只调用一次并在 reset 后可再次处理

## 2. 路由与认证集成测试

- [ ] 2.1 为受保护路由建立最小 MemoryRouter 测试 harness，覆盖 pending、成功、401、网络/超时/5xx 和 retry 状态；运行路由测试验证安全 return path 与页面恢复
- [ ] 2.2 为登录页面增加凭证错误、字段错误、成功后缓存清理和站内 return path 测试；验证外部 URL 不会被导航接受
- [ ] 2.3 为布局退出增加成功清理、Mock 会话清除和失败保留当前会话测试；使用 C0 的 Mock/QueryClient reset helper 验证用例互不影响

## 3. 会话回归与覆盖率验证

- [ ] 3.1 增加同标签页更换账号的集成回归，验证旧用户列表缓存不复用、新账号权限生效，并确认并发业务 401 只产生一次跳转
- [ ] 3.2 运行 `pnpm test` 与 `pnpm test:coverage`，记录请求和认证模块覆盖率提升且无未处理取消异常
- [ ] 3.3 运行 `pnpm typecheck`、`pnpm lint`、`pnpm build` 和认证相关 `pnpm e2e`，确认实现不改变既有用户可见行为
