# 项目协作约定

## 技术栈

- React 18.3 + Vite 8 + TypeScript 6，开启 `strict`。Arco 2.66.16 的 React 19 适配器保留在入口，但生产基线使用 React 18.3，避免旧弹层实现读取 `element.ref` 产生 React 19 警告。
- Arco Design React `2.66.16`，官方最新 `main` 源码保存在 `vendor/arco-design`，运行时不要直接引用 vendor。
- React Router 7 负责路由，TanStack Query 负责服务端状态，Axios 只允许在 `src/api/http.ts` 和生成代码中使用。
- Java 后端契约以 OpenAPI 为唯一事实源；`src/api/generated` 只能通过 `pnpm generate:api` 更新。

## 常用命令

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm lint
pnpm test
pnpm e2e
pnpm build
```

## 约束

- 不要手改 `src/api/generated`。
- 不要把密码、Token 或会话凭证写入 `localStorage`。生产认证使用 HttpOnly、Secure、SameSite Cookie。
- 前端权限只负责菜单和界面体验，Java Spring Security 必须在服务端再次鉴权。
- 新增接口先修改 `openapi/admin-api.yaml`（或替换成 Java 的 `/v3/api-docs`），再生成客户端。
- Mock 仅在 `VITE_ENABLE_MOCK=true` 时启用。
