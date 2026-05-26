---
name: mcp-builder
description: MCP 服务器构建方法论 — 系统化构建生产级 MCP 工具，让 AI 助手连接外部能力
---
---
name: mcp-builder
description: MCP 服务器构建方法论 — 系统化构建生产级 MCP 工具，让 AI 助手连接外部能力
---

# MCP 服务器构建

系统化设计、实现、测试和部署 Model Context Protocol 服务器的方法论。

## 1. 协议核心概念

MCP 定义三种原语：

- **Tools（工具）**：AI 助手主动调用的函数，有副作用。如搜索、创建、删除操作。
- **Resources（资源）**：AI 助手只读访问的数据源，用 URI 标识。如 `users://{id}/profile`。
- **Prompts（提示词模板）**：预定义交互模板，引导用户触发工作流。

**选择原则：** 执行操作 → Tool | 读取数据 → Resource | 引导交互 → Prompt

## 2. 项目结构规范

### TypeScript
```
my-mcp-server/
├── src/
│   ├── index.ts          # 入口，注册 tools/resources
│   ├── tools/             # 按功能拆分
│   ├── resources/
│   └── lib/               # 客户端封装、校验逻辑
├── tests/
├── package.json
└── tsconfig.json
```

### Python
```
my-mcp-server/
├── src/my_mcp_server/
│   ├── server.py
│   ├── tools/
│   └── lib/
├── tests/
└── pyproject.toml
```

## 3. Tool 设计原则

- 单一职责：一个 tool 只做一件事
- 清晰的输入输出：使用 zod/pydantic 做参数校验
- 完整的错误处理：不要吞异常，返回结构化错误
- 幂等性优先：重复调用不应产生副作用

## 4. 测试策略

- 单元测试：每个 tool 的独立逻辑
- 集成测试：通过 MCP 协议客户端调用
- 边界测试：空输入、超大输入、特殊字符
