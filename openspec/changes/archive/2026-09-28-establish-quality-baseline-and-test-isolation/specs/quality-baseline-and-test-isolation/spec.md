# Spec Delta

## Purpose

为前端单元测试建立可重复、可观察且不会被共享状态污染的质量边界，使覆盖率回退和测试顺序依赖能在合并前被发现。

## ADDED Requirements

### Requirement: 单元测试质量门禁必须可重复执行

项目 SHALL 提供一个本地和 CI 使用相同配置执行的覆盖率命令，统计已纳入测试范围的源代码，并在覆盖率低于声明的全局 Lines 或 Branches 下限时失败。门槛 SHALL 保守高于当前基线且允许后续单独提升，不得通过排除业务源文件来制造达标结果。

#### Scenario: 覆盖率达到门槛

- **WHEN** 单元测试通过且 Statements、Lines、Branches 和 Functions 均达到当前声明的最低范围
- **THEN** 覆盖率命令 SHALL 以成功状态结束，并生成机器可读摘要和可浏览报告

#### Scenario: 覆盖率回退

- **WHEN** 测试通过但 Lines 或 Branches 低于声明的最低范围
- **THEN** 覆盖率命令 SHALL 以失败状态结束，并在输出中显示实际值与目标值

### Requirement: 覆盖率结果必须在 CI 中可审计

CI SHALL 在快速质量 job 中执行覆盖率检查，并在成功或失败时保留覆盖率摘要和 HTML 报告。报告 SHALL 与 typecheck、lint、普通单测和 build 的结果区分，使覆盖率失败可以独立定位。

#### Scenario: 质量 job 生成覆盖率 artifact

- **WHEN** CI 执行质量 job
- **THEN** 工作流 SHALL 运行覆盖率命令，并上传 `coverage` 目录或等价的报告 artifact

#### Scenario: 覆盖率检查失败仍保留报告

- **WHEN** 测试或覆盖率门禁失败
- **THEN** CI SHALL 使用 always 条件上传已生成的覆盖率报告，并在 job 日志中保留失败原因

### Requirement: 单元测试必须隔离服务端状态和查询缓存

每个测试用例 SHALL 拥有独立的 QueryClient 或显式清理其缓存、观察者和进行中的请求；MSW handler 的内存用户、角色和当前身份 SHALL 提供测试可调用的复位语义。测试复位 SHALL 清除测试数据变更、会话存储和请求处理器变更，不得依赖测试文件或用例执行顺序。

#### Scenario: 前一个测试创建的数据不泄露

- **WHEN** 一个测试通过 Mock API 创建用户或修改角色，随后另一个测试开始
- **THEN** 后一个测试 SHALL 看到声明的初始用户和角色数据，而不是前一个测试的变更

#### Scenario: 前一个测试的身份不泄露

- **WHEN** 一个测试以非管理员 Mock 身份请求接口，随后另一个测试开始
- **THEN** 后一个测试 SHALL 使用默认身份和默认权限，除非该测试显式设置了其他身份

#### Scenario: QueryClient 缓存和进行中请求被清理

- **WHEN** 一个组件测试结束或执行测试复位
- **THEN** 其 QueryClient 缓存、进行中的请求和订阅 SHALL 不影响后续测试，且被取消请求不得产生未处理异常

### Requirement: 测试状态隔离不得改变单次测试内的 Mock 语义

Mock 的会话登录、用户新增/编辑、角色保存和 `sessionStorage` 持久化 SHALL 在同一测试用例内保持现有行为；复位入口 SHALL 只用于测试边界或明确的开发初始化，不得让业务页面依赖测试专用 API。

#### Scenario: 单个测试内角色修改仍可持久化

- **WHEN** 测试在同一用例内更新角色并再次读取角色列表
- **THEN** 第二次读取 SHALL 返回该用例刚保存的角色内容

#### Scenario: 测试结束后恢复默认 Mock

- **WHEN** 测试执行复位并开始下一个用例
- **THEN** 角色、用户和当前身份 SHALL 恢复到固定默认快照，且页面运行代码无需调用复位函数
