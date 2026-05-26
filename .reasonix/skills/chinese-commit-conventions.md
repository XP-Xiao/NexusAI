---
name: chinese-commit-conventions
description: 中文 commit 与 changelog 配置参考——Conventional Commits 中文适配。仅在用户显式 /chinese-commit-conventions 时调用
---
---
name: chinese-commit-conventions
description: 中文 commit 与 changelog 配置参考——Conventional Commits 中文适配
---

# 中文 Git 提交规范

## 1. Conventional Commits 中文适配

基于 Conventional Commits 1.0.0 规范，针对中文团队的实际使用习惯进行适配。

### 类型（type）定义

| 类型       | 说明                         | 示例场景                   |
| ---------- | ---------------------------- | -------------------------- |
| `feat`     | 新功能                       | 添加用户注册模块           |
| `fix`      | 修复缺陷                     | 修复登录页白屏问题         |
| `docs`     | 文档变更                     | 更新 API 接口文档          |
| `style`    | 代码格式（不影响逻辑）       | 调整缩进、补充分号         |
| `refactor` | 重构（非新功能、非修复）     | 拆分过长的服务类           |
| `perf`     | 性能优化                     | 优化首页列表查询速度       |
| `test`     | 测试相关                     | 补充用户模块单元测试       |
| `chore`    | 构建/工具/依赖变更           | 升级 webpack 到 v5         |
| `ci`       | 持续集成配置                 | 修改 GitHub Actions 流程   |
| `revert`   | 回滚提交                     | 回滚 v2.1.0 的登录重构     |

### 原则

- type 保留英文关键字（工具链兼容性好）
- scope 和 description 使用中文
- body 使用中文完整描述

## 2. 中文 commit message 模板

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 完整示例

```
feat(用户模块): 添加手机号一键登录功能

- 接入运营商一键登录 SDK
- 支持移动、联通、电信三网
- 登录失败自动降级到短信验证码
```
