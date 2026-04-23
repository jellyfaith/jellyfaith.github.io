---
title: "MySQL 是如何实现事务的？"
published: 2026-04-01
draft: false
description: ""
tags: [note]
---
# MySQL 是如何实现事务的？

# MySQL 事务实现机制

## 【核心定义】
MySQL 的事务是通过其存储引擎层（特别是 InnoDB）的**多版本并发控制（MVCC）、锁机制、日志系统（Redo/Undo Log）以及事务隔离级别的组合**来实现的，旨在保证 ACID 特性。

## 【关键要点】
1. **原子性（Atomicity）**：通过 **Undo Log** 实现。当事务需要回滚时，InnoDB 会利用 Undo Log 将数据恢复到事务开始前的状态。
2. **一致性（Consistency）**：由**应用层逻辑、数据库约束（如主键、外键）以及原子性、隔离性、持久性共同保证**，确保数据从一个有效状态转换到另一个有效状态。
3. **隔离性（Isolation）**：主要通过 **MVCC 和锁机制** 实现。MVCC 提供了非锁定读（快照读），而锁（如行锁、间隙锁）用于处理当前读，共同支撑了不同的事务隔离级别。
4. **持久性（Durability）**：通过 **Redo Log** 和 **Doublewrite Buffer** 实现。事务提交前，其修改会先写入 Redo Log，即使数据库崩溃也能通过 Redo Log 恢复已提交的数据。

## 【深度推导/细节】

### 1. MVCC 与 Read View 机制
*   **核心思想**：为每个数据行维护多个历史版本，不同事务在特定时刻看到不同的数据快照。
*   **实现关键**：
    *   **隐藏字段**：InnoDB 每行数据包含 `DB_TRX_ID`（最近修改的事务ID）、`DB_ROLL_PTR`（指向 Undo Log 中旧版本数据的指针）和 `DB_ROW_ID`（行ID）。
    *   **Read View**：事务在发起快照读时生成一个 Read View，主要包含：
        *   `m_ids`：当前活跃（未提交）的事务ID列表。
        *   `min_trx_id`：`m_ids` 中的最小值。
        *   `max_trx_id`：下一个将被分配的事务ID。
        *   `creator_trx_id`：创建该 Read View 的事务ID。
    *   **可见性判断算法**：当访问一行数据时，会沿着 `DB_ROLL_PTR` 形成的版本链，依次判断每个版本的 `DB_TRX_ID` 对当前 Read View 是否可见。规则简化如下：
        1.  如果 `DB_TRX_ID` < `min_trx_id`，说明该版本在 Read View 创建前已提交，**可见**。
        2.  如果 `DB_TRX_ID` >= `max_trx_id`，说明该版本在 Read View 创建后生成，**不可见**。
        3.  如果 `min_trx_id` <= `DB_TRX_ID` < `max_trx_id`，且 `DB_TRX_ID` 在 `m_ids` 中，说明该版本由活跃事务创建，**不可见**；否则**可见**。

### 2. 锁机制与隔离级别
*   **锁是隔离性的基础**，MVCC 是其高性能的优化。
*   **隔离级别实现差异**：
    *   **读未提交（RU）**：不加锁，直接读最新版本，无隔离性。
    *   **读已提交（RC）**：**每次执行 SELECT 都会生成一个新的 Read View**。因此，其他事务的提交能立即被看到。
    *   **可重复读（RR）**：**只在第一次执行 SELECT 时生成一个 Read View**，并在事务内复用。因此，整个事务期间看到的数据快照是一致的。InnoDB 在 RR 级别下还通过**间隙锁**来防止幻读。
    *   **串行化（S）**：读写都会加锁（如 Next-Key Lock），退化为基于锁的并发控制。

### 3. Redo Log 与持久性保障
*   **Write-Ahead Logging (WAL)**：修改数据页前，必须先将变更记录写入 Redo Log。
*   **两阶段提交（2PC）与组提交**：
    *   **Prepare 阶段**：事务写入 Undo Log 和 Redo Log（状态为 Prepare），并刷盘。
    *   **Commit 阶段**：将事务的 Redo Log 状态改为 Commit。为了提高效率，多个事务的 Commit 操作可以合并成一次 I/O（组提交）。
*   **Doublewrite Buffer**：防止因部分页写入（Partial Page Write）导致的数据损坏。在写入数据页到表空间前，先将其副本写入 Doublewrite Buffer，确保崩溃恢复时有一个完整的数据页副本。

### 4. Undo Log 与原子性、MVCC
*   **作用一（原子性）**：记录数据修改前的旧值。回滚时，反向执行 Undo Log 中的操作。
*   **作用二（MVCC）**：构成数据的多版本链。旧版本数据存储在 Undo Log 中，通过 `DB_ROLL_PTR` 指针链接。
*   **清理**：当事务提交且没有其他 Read View 依赖其 Undo Log 时，对应的 Undo Log 段会被 Purge 线程清理。

## 【关联/对比】
*   **InnoDB vs MyISAM**：MyISAM **不支持事务**，没有 Redo/Undo Log 和行锁，只有表锁。
*   **乐观锁 vs 悲观锁**：MySQL 事务机制是**悲观锁**（基于锁）和**乐观并发控制**（基于 MVCC）的结合。MVCC 本质是一种乐观策略，认为读多写少，冲突概率低。
*   **MySQL vs PostgreSQL 的 MVCC**：PostgreSQL 使用类似的方法，但旧版本数据直接存储在表空间中，通过 VACUUM 清理，而 MySQL 存储在单独的 Undo Tablespace 中。

## 『面试官追问』
1.  **RR 级别下真的完全解决了幻读吗？**
    *   **不完全**。在**快照读**（普通 SELECT）下，通过 MVCC 解决了幻读。但在**当前读**（SELECT ... FOR UPDATE/LOCK IN SHARE MODE）下，如果不加锁，其他事务仍然可以插入新数据。InnoDB 通过 **Next-Key Lock（行锁+间隙锁）** 来锁定一个范围，从而在当前读时防止幻读。
2.  **Redo Log 和 Binlog 的区别？**
    *   **Redo Log**：InnoDB 引擎层日志，物理日志，记录的是“在某个数据页上做了什么修改”，用于**崩溃恢复**，保证事务持久性。循环写入。
    *   **Binlog**：Server 层日志，逻辑日志（或行格式），记录的是语句的原始逻辑（如“给 ID=1 的行的 money 字段加 100”），用于**主从复制、数据恢复**。追加写入。
3.  **事务 ID 是如何分配的？**
    *   事务 ID 是全局递增的。在 InnoDB 中，只有执行了写操作（INSERT/UPDATE/DELETE）或显式 `START TRANSACTION WITH CONSISTENT SNAPSHOT` 的事务才会被分配一个唯一的事务 ID。只读事务可能不会被分配。
4.  **长事务有什么风险？**
    *   **Undo Log 膨胀**：旧版本数据无法被及时 Purge，占用大量存储。
    *   **锁竞争**：持有锁的时间过长，阻塞其他事务。
    *   **影响 Read View**：导致很老的 Read View 无法释放，可能拖慢整个系统的快照读。
5.  **为什么选择 0.75 作为默认的 Redo Log 刷盘策略（innodb_flush_log_at_trx_commit=1）的折中选项（=0或=2）不常用？**
    *   `=1` 最安全，每次提交都刷盘，保证崩溃不丢数据。
    *   `=0` 和 `=2` 性能更好，但分别在 MySQL 崩溃或操作系统崩溃时可能丢失约1秒的数据。在要求强一致性的业务中，通常必须使用 `=1`。

## 【版本差异】
*   **MySQL 5.6**：引入了 InnoDB 的全文索引和优化了只读事务的性能。
*   **MySQL 5.7**：默认隔离级别从 **REPEATABLE-READ** 变为 **REPEATABLE-READ**（未变，但优化了其性能），并增强了在线 DDL 能力。
*   **MySQL 8.0**：
    *   默认存储引擎明确为 InnoDB。
    *   引入了**原子 DDL**，使 DDL 操作也具备原子性。
    *   重构了数据字典，移除了 MyISAM 系统表。
    *   增强了**事务性数据字典**，提升了元数据管理的安全性和性能。
    *   支持**递归公用表表达式（CTE）**，增强了复杂查询的事务处理能力。
