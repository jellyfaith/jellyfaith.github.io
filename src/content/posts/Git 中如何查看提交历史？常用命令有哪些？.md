---
title: "Git 中如何查看提交历史？常用命令有哪些？"
published: 2026-04-22
draft: false
description: ""
tags: [git]
---
# Git 中如何查看提交历史？常用命令有哪些？

# Git 查看提交历史：面试标准答案

## 【核心定义】
查看 Git 提交历史是通过一系列命令，以不同格式和粒度展示版本库中提交记录的演变过程，是代码审计、问题追溯和协作分析的核心操作。

## 【关键要点】
1. **基础查看命令**：`git log` 是查看提交历史的基础命令，默认按时间倒序显示提交的哈希值、作者、日期和提交信息。
2. **图形化与单行显示**：`git log --oneline --graph` 将提交历史压缩为单行并显示分支合并的图形化拓扑结构，便于快速理解项目分支脉络。
3. **按条件过滤**：可通过 `git log --author=<name>`、`git log --since=<date>`、`git log --grep=<pattern>` 等参数按作者、时间范围、提交信息关键词进行精准筛选。
4. **查看文件变更详情**：`git log -p` 或 `git log --patch` 在显示提交信息的同时，展示该提交引入的具体代码差异（diff），用于深入分析代码变更。
5. **统计与摘要**：`git log --stat` 显示每个提交中变更文件的统计摘要（如修改了哪些文件、增删行数），适合快速浏览影响范围。

## 【深度推导/细节】
### 核心矛盾：信息过载与精准定位
Git 历史可能非常庞大，直接使用 `git log` 会产生信息过载。解决方案是通过参数组合实现“分层查看”：
- **第一层（概览）**：`git log --oneline -10` 查看最近10条提交的摘要。
- **第二层（分支拓扑）**：`git log --graph --all --oneline` 查看所有分支的简化拓扑，理清分支合并关系。
- **第三层（深度挖掘）**：`git log -p <file_path>` 仅查看特定文件的完整变更历史与差异，精准定位问题引入点。

### 关键参数设计原理
- **`--since` 与 `--until`**：接受灵活的时间格式（如 "2 weeks ago", "2023-01-01"），底层基于 Git 的内部时间戳过滤，避免全量扫描。
- **`-S<string>`（pickaxe 搜索）**：搜索添加或删除了特定字符串内容的提交，其算法会遍历所有提交的 diff，而非仅提交信息，用于追踪代码片段的生命周期。
- **`--follow`**：在文件重命名后仍能追踪其历史，Git 会尝试通过相似度算法匹配重命名前后的文件，但有一定局限性（如同时大量修改内容时可能断链）。

## 【关联/对比】
- **`git log` vs `git show`**：`git log` 用于查看一系列提交的元信息，而 `git show <commit>` 专注于展示**单个提交**的完整详情（包括变更内容、作者、日期等）。`git show` 默认显示最新提交，是 `git log -p -1` 的快捷方式。
- **`git log` vs `git reflog`**：`git log` 展示**版本库的公共历史**（即提交 DAG），而 `git reflog` 记录的是**本地仓库的引用变更日志**（如 HEAD、分支的移动），包含已“丢失”的提交（如 reset、误删分支），用于操作救赎。
- **GUI 工具对比**：命令行提供最强大和灵活的过滤能力，而如 `gitk`、`SourceTree`、VS Code Git Lens 等 GUI 工具在可视化分支拓扑、交互式浏览方面更直观，适合代码审查。

## 『面试官追问』
1. **如何查看某个特定提交的详细信息？**
   - 使用 `git show <commit-hash>`。如果想看该提交的元信息但不显示 diff，可加 `--stat` 参数。
2. **`git log --oneline` 显示的哈希值为什么是短格式？安全吗？**
   - 这是 SHA-1 哈希的前7位（默认）。Git 会确保其在当前仓库内**唯一**，足以安全引用。可通过 `git log --abbrev-commit` 显式启用，或 `--no-abbrev-commit` 禁用。
3. **如何查看两个分支之间的差异提交？**
   - `git log branch1..branch2` 查看在 branch2 中但不在 branch1 中的提交。`git log --left-right branch1...branch2` 可显示两分支分叉后的所有提交，并标记属于哪边。
4. **`git log -p` 的输出中，`+++` 和 `---` 是什么意思？**
   - 这是 unified diff 格式：`---` 表示变更前的文件（通常是 a/版本），`+++` 表示变更后的文件（通常是 b/版本）。后面的文件名可能带有前缀，如 `a/src/file.js` 和 `b/src/file.js`。
5. **如何将提交历史输出为 JSON 格式以便脚本处理？**
   - 使用 `git log --pretty=format:'{"hash":"%H", "author":"%an", "date":"%ad", "message":"%s"}'` 自定义格式。更复杂的解析建议使用 `git log --pretty=format:"%H%x09%an%x09%ad%x09%s"` 输出为分隔符格式，或用 `git log --json`（Git 2.32+）。

## 【版本差异】
- **Git 2.23+**：引入了 `git log --exclude-hidden=<namespace>` 用于排除隐藏的引用（如 `refs/replace/` 中的替换提交）。
- **Git 2.33+**：`git log --since` 等日期过滤性能大幅优化，尤其在大仓库中。
- **Git 2.19+**：`git log --show-signature` 可更清晰地显示 GPG 签名验证结果。
- **传统差异**：早期版本中，一些格式占位符（如 `%D` 显示 ref 名称）的行为可能略有不同，且 `--json` 输出格式在较新版本中才成为标准。

## 【逻辑复现：问题排查场景】
**场景**：发现生产环境 bug，需要定位是哪个提交引入。
**步骤**：
1. **Step 1（定位可疑时间范围）**：`git log --since="2024-01-01" --until="2024-01-15" --oneline` 查看该时间段所有提交。
2. **Step 2（缩小到相关文件）**：`git log --since="2024-01-01" -- path/to/file.js` 查看该文件在该时间段的修改记录。
3. **Step 3（查看具体变更）**：`git show <可疑提交哈希>` 或 `git log -p -1 <可疑提交哈希>` 分析该提交的详细 diff，确认是否引入问题。
4. **Step 4（二分法自动化定位）**：若范围仍大，使用 `git bisect start`、`git bisect bad`、`git bisect good` 启动二分查找，Git 会自动引导你测试并定位第一个坏提交。

## 【常用命令速查表】
```bash
# 基础与格式
git log
git log --oneline
git log --graph --all --oneline
git log --pretty=format:"%h - %an, %ar : %s"

# 过滤
git log -n 5                      # 最近5条
git log --author="John"
git log --since="1 week ago"
git log --grep="BUGFIX"
git log -- path/to/file           # 文件历史
git log -S "functionName"         # 代码内容搜索

# 详情与统计
git log -p                        # 显示差异
git log --stat                    # 显示文件变更统计
git log --name-status             # 仅显示变更文件列表及操作类型（A/M/D/R）

# 分支比较
git log main..feature             # 在 feature 中不在 main 中的提交
git log --left-right main...feature # 分叉后的所有提交
```

掌握这些命令的组合使用，能够高效、精准地导航 Git 历史，是高级 Git 用户的标志性技能。
