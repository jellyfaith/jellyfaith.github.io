---
title: "开发中常用的 Git 操作有哪些？"
published: 2026-03-07
draft: false
description: ""
tags: [git]
---
# 开发中常用的 Git 操作有哪些？

# Git 常用操作面试标准答案

## 【核心定义】
Git 是一个分布式版本控制系统，通过快照（snapshot）机制追踪和管理项目文件的变化历史，其核心操作围绕代码的提交、分支、合并与远程协作展开。

## 【关键要点】
1. **仓库初始化与克隆**
   - `git init`：在当前目录创建新的本地仓库。
   - `git clone <url>`：克隆远程仓库到本地，自动建立远程跟踪分支。

2. **工作区与暂存区操作**
   - `git add <file>`：将工作区文件的修改添加到暂存区（stage）。
   - `git status`：查看工作区、暂存区的状态。
   - `git diff`：比较工作区与暂存区的差异。
   - `git diff --cached`：比较暂存区与最新提交的差异。

3. **提交历史管理**
   - `git commit -m "message"`：将暂存区内容提交到本地仓库。
   - `git log`：查看提交历史，常用选项：`--oneline`、`--graph`、`-p`。
   - `git reset`：版本回退，三种模式：
     - `--soft`：仅移动 HEAD 指针，保留暂存区和工作区。
     - `--mixed`（默认）：移动 HEAD 并重置暂存区，保留工作区修改。
     - `--hard`：彻底回退，丢弃所有修改。
   - `git revert`：创建新的提交来撤销指定提交，适用于公共分支。

4. **分支管理**
   - `git branch`：查看、创建、删除分支。
   - `git checkout -b <branch>`：创建并切换到新分支。
   - `git merge <branch>`：将指定分支合并到当前分支。
   - `git rebase <branch>`：变基操作，将当前分支的提交“移植”到目标分支最新提交之后。

5. **远程协作**
   - `git remote add <name> <url>`：添加远程仓库。
   - `git fetch`：从远程获取最新提交历史，但不自动合并。
   - `git pull`：相当于 `git fetch` + `git merge`。
   - `git push`：将本地提交推送到远程仓库。
   - `git push -u origin <branch>`：首次推送并建立跟踪关系。

6. **临时保存与恢复**
   - `git stash`：临时保存工作区和暂存区的修改。
   - `git stash pop`：恢复最近一次 stash 的内容。

## 【深度推导/细节】

### 1. **Git 三区（工作区、暂存区、仓库）协作流程**
```
Step 1: 工作区修改文件 → `git add` → 暂存区（stage）
Step 2: 暂存区准备就绪 → `git commit` → 本地仓库（生成 commit 对象）
Step 3: 本地仓库积累提交 → `git push` → 远程仓库
```
- **设计意图**：暂存区允许选择性提交，避免一次性提交所有修改。

### 2. **Merge vs Rebase 的核心矛盾**
- **Merge**：保留完整历史，产生合并提交（merge commit），历史呈树状。
- **Rebase**：线性化历史，避免不必要的合并提交，但会重写提交历史。
- **关键原则**：公共分支（如 master/main）使用 merge，个人特性分支使用 rebase。

### 3. **冲突解决机制**
```
Step 1: 执行合并或变基时检测到冲突
Step 2: Git 暂停操作，在冲突文件中标记冲突位置（<<<<<<<, =======, >>>>>>>）
Step 3: 手动编辑文件解决冲突
Step 4: `git add` 标记冲突已解决
Step 5: 继续完成操作（`git commit` 或 `git rebase --continue`）
```

## 【关联/对比】

### Git vs SVN（集中式版本控制）
| 维度 | Git（分布式） | SVN（集中式） |
|------|--------------|--------------|
| 仓库类型 | 每个开发者拥有完整仓库 | 只有一个中央仓库 |
| 网络依赖 | 提交无需网络，推送需要 | 几乎所有操作都需要网络 |
| 分支成本 | 极低，分支即指针移动 | 较高，需复制目录结构 |
| 历史查看 | 本地即可查看完整历史 | 需连接服务器 |

### Git 内部对象模型关联
- **Blob 对象**：存储文件内容。
- **Tree 对象**：存储目录结构。
- **Commit 对象**：包含作者、时间、父提交指针和 tree 对象指针。
- **Tag 对象**：指向特定提交的不可变指针。

## 『面试官追问』

### Q1：`git pull` 和 `git fetch` 的区别是什么？
- `git fetch` 只下载远程最新数据到 `.git/refs/remotes/`，不修改工作区。
- `git pull` = `git fetch` + `git merge FETCH_HEAD`，会自动合并到当前分支。

### Q2：如何撤销上一次提交？
- 仅修改提交信息：`git commit --amend`
- 撤销提交但保留修改：`git reset HEAD~1`（默认 --mixed）
- 彻底丢弃提交：`git reset --hard HEAD~1`
- 公共分支上撤销：`git revert HEAD`（创建新提交）

### Q3：`.gitignore` 文件的作用和语法？
- 作用：指定哪些文件/目录不应被 Git 追踪。
- 语法：
  - `*.log`：忽略所有 .log 文件
  - `/target/`：忽略根目录下的 target 目录
  - `!important.log`：不忽略 important.log（例外规则）

### Q4：什么是 detached HEAD 状态？如何恢复？
- 产生原因：直接 `git checkout <commit-hash>` 切换到某个具体提交。
- 状态特点：HEAD 指针指向提交而非分支。
- 恢复方法：
  ```bash
  # 方法1：创建新分支保存修改
  git checkout -b new-branch
  
  # 方法2：切换回已有分支
  git checkout main
  ```

### Q5：Git 的 rebase 交互模式（interactive rebase）有什么用？
- 命令：`git rebase -i HEAD~3`
- 用途：合并提交、修改提交信息、重新排序提交、拆分提交等。
- 典型工作流：整理本地分支提交历史后再推送到远程。

### Q6：如何查找引入 bug 的提交？
```bash
# 二分查找
git bisect start
git bisect bad           # 标记当前版本有问题
git bisect good <hash>   # 标记某个历史版本正常
# Git 会自动切换到中间版本，重复测试并标记 good/bad
git bisect reset         # 结束二分查找
```

## 【直击痛点：关键数字与设计】

### 1. **默认分支名称变迁（master → main）**
- 历史：Git 早期默认分支名为 `master`。
- 变更：2020 年后 GitHub 等平台将默认分支改为 `main`。
- 兼容性：`git init` 默认分支可通过 `init.defaultBranch` 配置。

### 2. **Fast-forward 合并的条件**
- 当目标分支是当前分支的直接上游时，Git 默认使用快进合并（指针移动）。
- 禁用快进：`git merge --no-ff` 强制创建合并提交，保留分支历史。

### 3. **Git 的 SHA-1 到 SHA-256 过渡**
- 历史：Git 使用 SHA-1 哈希生成 40 位十六进制提交 ID。
- 问题：SHA-1 存在碰撞攻击风险。
- 过渡：Git 2.29+ 开始支持 SHA-256，可通过 `objectFormat` 配置。

## 【版本差异与最佳实践】

### Git 2.23+ 新命令
- `git switch <branch>`：替代 `git checkout <branch>`（切换分支）
- `git restore <file>`：替代 `git checkout -- <file>`（恢复文件）

### 企业级最佳实践
1. **分支策略**：Git Flow、GitHub Flow 或 Trunk Based Development。
2. **提交规范**：遵循 Conventional Commits 格式（feat:, fix:, chore: 等）。
3. **代码审查**：通过 Pull Request/Merge Request 机制进行。
4. **钩子使用**：利用 pre-commit、pre-push 钩子自动化检查。

---

**总结**：Git 的核心价值在于其分布式架构和高效的分支管理。掌握三区概念、分支合并策略和冲突解决是日常开发的基础，而理解内部对象模型和高级操作（如 rebase、bisect）则能体现深度。在实际团队协作中，遵循一致的流程规范比掌握复杂命令更为重要。
