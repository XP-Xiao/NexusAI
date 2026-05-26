---
name: workflow-runner
description: 在 AI 工具内运行多角色 YAML 工作流——无需 API key，使用当前会话的 LLM 作为执行引擎
---
---
name: workflow-runner
description: 在 AI 工具内运行多角色 YAML 工作流——无需 API key，使用当前会话的 LLM 作为执行引擎
---

# 工作流执行器：在 AI 工具内运行多角色编排

直接在当前会话中执行 agency-orchestrator 的 YAML 工作流，无需配置 API key。当前 LLM 就是执行引擎——依次扮演每个角色完成任务。

## 适用场景

- 用户提供了一个 `.yaml` 工作流文件
- 用户要求多个角色协作完成任务
- 用户安装了 `agency-agents-zh` 并希望直接在 AI 工具内编排多角色

## 执行流程（5 步）

### 第 1 步：解析工作流

读取 YAML 文件，提取 steps、roles、inputs。

### 第 2 步：变量替换

将用户输入替换到 task 模板中。

### 第 3 步：按序执行角色

按 depends_on 拓扑序执行每个步骤，每个步骤加载对应角色的定义并完成任务。

### 第 4 步：收集输出

每个步骤的输出存入变量，供后续步骤使用。

### 第 5 步：生成总结

输出每个步骤的完成情况和最终结果。
