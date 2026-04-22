---
title: "MySQL 中的 MVCC 是什么？"
published: 2026-04-22
draft: false
description: ""
tags: [note]
---
# MySQL 中的 MVCC 是什么？

# MySQL 中的 MVCC 是什么？

## 【核心定义】
MVCC（Multi-Version Concurrency Control，多版本并发控制）是 MySQL InnoDB 存储引擎实现的一种非锁定读机制，它通过在数据行上维护多个历史版本，使得读写操作可以并发执行而无需相互阻塞，从而在保证事务隔离性的同时，极大地提升了数据库的并发性能。

## 【关键要点】
1. **核心目标：解决读写冲突**
   - 传统锁机制（如行锁）在读写并发时会产生阻塞。MVCC 通过创建数据快照，让读操作读取历史版本，写操作创建新版本，从而实现读不阻塞写、写不阻塞读。

2. **实现基础：隐藏字段与 Undo Log**
   - InnoDB 为每行数据隐式添加了三个关键字段：
     - `DB_TRX_ID`（6字节）：记录最近一次修改该行数据的事务ID。
     - `DB_ROLL_PTR`（7字节）：指向该行上一个历史版本在 Undo Log 中的指针。
     - `DB_ROW_ID`（6字节）：隐藏的自增行ID（如果表无主键）。
   - Undo Log 存储数据修改前的历史版本，形成版本链。

3. **版本可见性判断：Read View**
   - 在事务执行快照读（如 `SELECT`）时，会生成一个 Read View，用于判断数据版本的可见性。Read View 包含：
     - `m_ids`：生成 Read View 时，系统中活跃（未提交）的事务ID列表。
     - `min_trx_id`：`m_ids` 中的最小事务ID。
     - `max_trx_id`：生成 Read View 时，系统应分配给下一个事务的ID。
     - `creator_trx_id`：创建该 Read View 的事务ID。
   - 判断规则（以可重复读隔离级别为例）：
     - 如果 `DB_TRX_ID` < `min_trx_id`，说明该版本在 Read View 创建前已提交，**可见**。
     - 如果 `DB_TRX_ID` >= `max_trx_id`，说明该版本在 Read View 创建后生成，**不可见**。
     - 如果 `min_trx_id` <= `DB_TRX_ID` < `max_trx_id`，且 `DB_TRX_ID` 在 `m_ids` 中，说明该版本由活跃事务创建，**不可见**；否则**可见**。
     - 如果 `DB_TRX_ID` == `creator_trx_id`，说明该版本由当前事务自己修改，**可见**。

4. **不同隔离级别的行为差异**
   - **读已提交（RC）**：每次执行 `SELECT` 都会生成一个新的 Read View，因此能看到其他事务已提交的最新数据。
   - **可重复读（RR）**：只在第一次执行 `SELECT` 时生成 Read View，后续读取都复用该视图，因此看到的数据保持一致（快照隔离）。

## 【深度推导/细节】

### 版本链的构建与遍历
**Step 1：数据修改**
当事务对某行数据进行修改（UPDATE/DELETE）时：
1.  InnoDB 会先将该行数据拷贝到 Undo Log 中，生成一个历史版本。
2.  修改当前行的数据，并更新 `DB_TRX_ID` 为当前事务ID，`DB_ROLL_PTR` 指向刚存入 Undo Log 的历史版本。
3.  多次修改会形成一条由 `DB_ROLL_PTR` 链接的版本链，链头是最新版本。

**Step 2：快照读的可见性判断**
当事务执行 `SELECT` 时：
1.  获取当前行数据的最新版本。
2.  从 Read View 中取出关键信息。
3.  从最新版本开始，沿 `DB_ROLL_PTR` 指针遍历版本链。
4.  对每个版本，根据上述判断规则检查其 `DB_TRX_ID` 是否对当前事务可见。
5.  找到第一个可见的版本后返回。如果遍历完都不可见，则说明该行对当前事务不可见。

### 核心设计痛点与数字解析
- **为什么需要 Undo Log？**
  Undo Log 不仅用于 MVCC，还用于事务回滚。MVCC 复用了其存储的历史数据，避免了为版本控制单独维护存储空间。版本链的长度受限于事务的活跃周期和 Undo Log 的清理策略。

- **Read View 的生成时机与性能**
  - RC 级别频繁生成 Read View 会带来额外开销，但保证了能读到已提交的最新数据。
  - RR 级别复用 Read View 减少了开销，并实现了可重复读，但可能导致“幻读”（需配合 Next-Key Lock 解决）。

- **版本清理（Purge）机制**
  当某个历史版本不再被任何活跃事务需要时（即所有 Read View 都不再可能访问它），它就可以被 Purge 线程清理。这避免了 Undo Log 无限增长。

## 【关联/对比】

### MVCC vs. 传统锁机制
| 特性 | MVCC | 基于锁的并发控制 |
| :--- | :--- | :--- |
| **读写冲突** | 读写互不阻塞（读历史版本） | 读写可能相互阻塞（共享锁与排他锁互斥） |
| **并发度** | 高 | 相对较低 |
| **实现复杂度** | 高（需维护版本链、可见性判断） | 相对较低 |
| **典型应用** | MySQL InnoDB, PostgreSQL | MySQL MyISAM, 早期数据库 |

### InnoDB 中 MVCC 与锁的关系
MVCC **并未完全取代锁**。在 MySQL InnoDB 中：
- **快照读**（普通 `SELECT`）使用 MVCC，无锁。
- **当前读**（`SELECT ... FOR UPDATE`、`UPDATE`、`DELETE`、`INSERT`）仍然需要加锁（记录锁、间隙锁等）来保证数据一致性，防止其他事务并发修改。

## 『面试官追问』

1.  **MVCC 能解决幻读吗？**
    - 在 RR 隔离级别下，MVCC 本身通过快照读可以避免**非锁定读**时的幻读。但对于**当前读**（如 `SELECT ... FOR UPDATE`），MVCC 无效，仍需依靠 Next-Key Lock（记录锁+间隙锁）来防止幻读。

2.  **Undo Log 被填满或清理了怎么办？**
    - 如果因为长事务导致其需要的早期 Undo Log 版本无法被清理，Undo Log 空间会增长。InnoDB 有 `innodb_max_undo_log_size` 和 `innodb_undo_log_truncate` 参数进行管理。如果历史版本被 Purge，而仍有活跃事务需要读取它，理论上会导致读取失败，但 InnoDB 的 Purge 机制会确保只清理绝对安全的数据。

3.  **MVCC 在 INSERT 和 DELETE 时如何工作？**
    - **INSERT**：新插入的行，其 `DB_TRX_ID` 为当前事务ID。对于其他事务，根据其 Read View 判断该行是否可见（通常，在 RR 下，后开始的事务看不到先开始事务未提交的插入）。
    - **DELETE**：InnoDB 将删除操作视为一次特殊的 UPDATE，会设置行头中的删除标记，并将删除前的数据存入 Undo Log。其他事务根据 Read View 判断时，如果该版本可见且未被标记删除，则返回数据；如果可见但被标记删除，则不会返回该行（表现为已删除）。

4.  **RC 和 RR 级别下，MVCC 的具体区别是什么？**
    - **Read View 生成时机**：RC 每次快照读都生成新视图；RR 只在第一次快照读时生成。
    - **可见性结果**：RC 下能看到语句启动时已提交的所有数据；RR 下能看到事务启动时已提交的所有数据，后续不变。
    - **示例**：事务A启动，读取某行值为1。事务B将其改为2并提交。在RC下，事务A再次读取能看到2；在RR下，事务A再次读取仍看到1。
