---
title: "git pull request 和 git branch 命令有哪些区别？"
published: 2026-04-22
draft: false
description: ""
tags: [git]
---
# git pull request 和 git branch 命令有哪些区别？

【核心定义】
`git pull request` 是 GitHub/GitLab 等协作平台提供的、用于发起代码审查与合并请求的协作流程机制，而 `git branch` 是 Git 版本控制系统本身提供的、用于创建和管理分支的核心命令。

【关键要点】
1.  **本质与范畴不同**：`git branch` 是 Git 的原生命令，用于分支的增删改查等本地操作；`git pull request` 是托管平台（如 GitHub）在 Git 之上构建的协作功能，本身不是 Git 命令。
2.  **操作对象与目的不同**：`git branch` 操作的是本地或远程的引用指针，目的是管理代码的并行开发线；`git pull request` 操作的是一个“合并请求”对象，目的是发起代码审查、讨论并最终将分支合并到目标分支。
3.  **触发时机与流程不同**：`git branch` 在开发过程中随时使用；`git pull request` 通常在功能开发完成、希望合并到主分支时，在 Web 界面或通过 CLI 工具发起，需经过评审、CI 检查等流程。

【深度推导/细节】
*   **`git branch` 的底层逻辑**：Git 的分支本质上是一个指向某个提交（commit）的轻量级可移动指针。创建分支（`git branch feature`）只是在 `.git/refs/heads/` 目录下创建一个新文件，内容为指向当前提交的 SHA-1 值。它不涉及代码复制，开销极低。
*   **`git pull request` 的工作流拆解**：
    *   **Step 1**: 开发者基于 `git branch` 和 `git checkout`（或 `git switch`）创建并切换到一个功能分支进行开发。
    *   **Step 2**: 开发完成后，使用 `git push` 将本地分支推送到远程仓库。
    *   **Step 3**: 在托管平台的 Web 界面上，基于推送的远程分支向目标分支（如 `main`）发起 Pull Request。
    *   **Step 4**: PR 创建后，团队成员进行代码评审、自动化测试（CI/CD）运行。
    *   **Step 5**: 评审通过后，由有权限的成员在平台上执行“合并”操作。这个操作底层通常对应 `git merge` 或 `git rebase` 命令，将更改整合到目标分支。

【关联/对比】
*   **与 `git merge`/`git rebase` 的关系**：`git pull request` 的最终合并动作，在后台就是执行 `git merge`（产生合并提交）或 `git rebase`（线性历史）。而 `git branch` 是创建供这些操作使用的“原材料”。
*   **与 `git push` 的关系**：`git push` 是将本地分支同步到远程仓库的命令，是发起 `git pull request` 的必要前置步骤。没有 `git push`，远程仓库就没有新分支，无法创建 PR。
*   **平台差异**：`git pull request` 是 GitHub 的术语，GitLab 中称为 Merge Request，Gitea/Gitee 等也类似。其核心协作概念一致，但具体功能和 UI 有差异。

『面试官追问』
1.  **如果不用 GitHub/GitLab，如何在纯命令行下完成代码审查和合并？**
    *   答案：可以使用 `git request-pull` 命令（注意，这是 Git 原生命令，不是 `pull request`）。它生成一个摘要，通过邮件等方式发送给维护者。维护者手动拉取分支、审查，然后执行 `git merge`。这是一种更原始、基于邮件列表的协作方式。
2.  **`git pull` 和 `git pull request` 有什么区别？**
    *   答案：`git pull` = `git fetch` + `git merge`，是一个**拉取并合并**远程更新的本地命令。`git pull request` 是一个**发起合并请求**的协作流程。两者名字相似但功能完全相反：一个是“拉进来”，一个是“推出去并请求合并”。
3.  **如何删除一个已经合并的 Pull Request 对应的远程分支？**
    *   答案：在 GitHub 等平台的 PR 合并后，通常有按钮可以删除源分支。命令行下，使用 `git push origin --delete branch_name`。本地分支可用 `git branch -d branch_name` 删除。

【总结】
简而言之，`git branch` 是**造路**的工具（创建并行开发路径），`git pull request` 是**申请把新路并入主干**的**流程和协议**。前者是版本控制的基石，后者是现代协作开发的枢纽。理解这一区别，有助于厘清 Git 核心操作与基于其上的工作流增强功能之间的边界。
