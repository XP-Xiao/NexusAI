---
name: using-git-worktrees
description: 当需要开始与当前工作区隔离的功能开发，或在执行实现计划之前使用
---
---
name: using-git-worktrees
description: 当需要开始与当前工作区隔离的功能开发，或在执行实现计划之前使用
---

# 使用 Git 工作树

## 概述

确保工作发生在隔离的工作区中。优先使用你的平台的原生 worktree 工具。仅在没有原生工具可用时，再回退到手动 git worktree。

**核心原则：** 先检测现有隔离。然后用原生工具。再回退到 git。绝不与 harness 对抗。

## 步骤 0：检测现有隔离

**创建任何东西之前，先检查你是否已经在一个隔离的工作区里。**

如果在 linked worktree 内，直接跳到项目设置。如果在普通仓库检出中，询问用户是否要创建 worktree。

## 步骤 1：创建隔离工作区

先尝试平台原生 worktree 工具，回退到 `git worktree add`。

## 步骤 2：项目设置

在 worktree 中安装依赖、设置环境。

## 步骤 3：开始工作

worktree 就绪，可以开始实现了。
