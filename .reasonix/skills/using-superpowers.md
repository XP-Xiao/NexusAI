---
name: using-superpowers
description: 在开始任何对话时使用——确立如何查找和使用技能
---
---
name: using-superpowers
description: 在开始任何对话时使用——确立如何查找和使用技能
---

# 使用 Superpowers

## 指令优先级

Superpowers 技能覆盖默认系统提示行为，但**用户指令始终具有最高优先级**：

1. **用户的明确指令** — 最高优先级
2. **Superpowers 技能** — 在冲突处覆盖默认系统行为
3. **默认系统提示** — 最低优先级

## 如何访问技能

当适用时调用相关技能。`run_skill({ name })` 可以在 Reasonix Code 中调用已安装的技能。

## 核心规则

1. **收到任务时，先检查是否有匹配的 skill** — 哪怕只有 1% 的可能性也要检查
2. **设计先于编码** — 收到功能需求时，先用 brainstorming skill 做需求分析
3. **测试先于实现** — 写代码前先写测试（TDD）
4. **验证先于完成** — 声称完成前必须运行验证命令
