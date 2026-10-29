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

- 新增或调整业务页面先阅读 [页面开发指南](docs/page-development-guide.md)，按其中的路由、请求、页面状态、响应式和验收清单执行。
- 不要手改 `src/api/generated`。
- 不要把密码、Token 或会话凭证写入 `localStorage`。生产认证使用 HttpOnly、Secure、SameSite Cookie。
- 前端权限只负责菜单和界面体验，Java Spring Security 必须在服务端再次鉴权。
- 新增接口先修改 `openapi/admin-api.yaml`（或替换成 Java 的 `/v3/api-docs`），再生成客户端。
- Mock 仅在 `VITE_ENABLE_MOCK=true` 时启用。
- 一级菜单 SVG 在展开和折叠状态都必须保持可见尺寸；图标槽位内覆盖 Arco 的默认图标右边距时，选择器优先级要高于 `.arco-menu-vertical .arco-menu-inline-header .arco-icon`，并回归检查展开态图标宽度及折叠态 48px 侧栏边界。
- 菜单分组 `openKeys` 首次按当前路由初始化，之后由用户点击控制；路由切换到其他分组时可以展开目标分组，但不要在每次渲染时强制展开当前路由分组，否则当前选中的子项会阻止一级菜单收起。回归检查收起后子项仍保持选中。
- `DataTable` 表头沿用 Arco 默认 14px/500 字重和主文本色 `--color-text-1`，保持与原生 Arco Table 一致；不要在通用表格选择器中设置 10px/600 或弱化为 `--color-text-3`，紧凑或弱化样式使用页面级作用域类。
- `QueryForm` 桌面端筛选项与操作按钮保持水平对齐和明确间距；校验提示、权限条件和条件字段变化不能造成错位或重叠。多值/长文本表格列要约束宽度、提供省略后的完整值入口，并在窄屏保持可横向浏览。细则见 [页面开发指南](docs/page-development-guide.md) 的 UI 与响应式章节。
