---
name: chinese-git-workflow
description: 国内 Git 平台配置参考——Gitee、Coding.net、极狐 GitLab、CNB 的接入差异与配置。仅在用户显式 /chinese-git-workflow 时调用
---
---
name: chinese-git-workflow
description: 国内 Git 平台配置参考——Gitee、Coding.net、极狐 GitLab、CNB 的接入差异与配置
---

# 国内 Git 工作流规范

## 概述

国内团队用 Git 经常踩的坑：GitHub 访问不稳定、CI/CD 方案照搬国外水土不服、commit message 中英混杂没有规范。本技能提供一套**完整适配国内平台和团队习惯的 Git 工作流**。

**核心原则：** 工作流服务于团队效率，不是为了流程而流程。

## 国内 Git 平台适配

### 平台对比

| 特性 | Gitee | Coding.net | 极狐 GitLab | CNB | GitHub |
|------|-------|------------|-------------|-----|--------|
| 国内访问 | 快 | 快 | 快 | 快 | 不稳定 |
| 免费私有仓库 | 有 | 有 | 有 | 有 | 有 |
| CI/CD | Gitee Go | Coding CI | 内置 GitLab CI | 内置（.cnb.yml） | GitHub Actions |
| 代码审查 | PR | MR | MR | MR | PR |
| 适合场景 | 开源/小团队 | 中大型团队 | 企业私有化 | 云原生 / Docker 流水线 | 国际项目 |

### 镜像同步

```bash
# 同时推送到 Gitee 和 GitHub
git remote set-url --add --push origin https://gitee.com/<org>/<repo>.git
git remote set-url --add --push origin https://github.com/<org>/<repo>.git
```
