---
title: "MySQL 中使用索引一定有效吗？如何排查索引效果？"
published: 2026-04-22
draft: false
description: ""
tags: [note]
---
# MySQL 中使用索引一定有效吗？如何排查索引效果？

# MySQL 索引使用效果分析与排查

## 【核心定义】
索引是数据库中对一列或多列值进行预排序的数据结构，其核心目的是**加速数据检索**，但并非在所有查询场景下都能生效或带来性能提升。

## 【关键要点】
1. **索引并非总是有效**：索引的使用取决于查询条件、数据分布、索引类型及优化器决策，错误的使用场景或不当的索引设计反而会降低性能。
2. **索引失效的常见场景**：
   - 对索引列进行函数操作或表达式计算（如 `WHERE YEAR(create_time) = 2023`）
   - 使用 `LIKE` 以通配符开头（如 `LIKE '%keyword'`）
   - 数据类型隐式转换（如字符串列使用数字查询）
   - 复合索引未遵循最左前缀原则
   - 优化器判断全表扫描成本更低（小表或高选择性不足）
3. **排查索引效果的核心方法**：
   - 使用 `EXPLAIN` 分析执行计划
   - 监控慢查询日志
   - 使用性能模式（Performance Schema）和 `SHOW PROFILE`

## 【深度推导/细节】

### 索引失效的底层逻辑拆解
**Step 1 - 优化器成本计算**：
MySQL 优化器基于统计信息（通过 `ANALYZE TABLE` 更新）估算不同执行计划的成本，包括：
- 索引扫描的 I/O 成本（索引树高度 + 回表次数）
- CPU 成本（比较操作）
- 内存成本（临时表、排序）

**Step 2 - 索引失效的临界点分析**：
- **选择性阈值**：当索引列的唯一值比例（基数/总行数）低于约 **30%** 时，优化器可能选择全表扫描
- **小表阈值**：数据量小于 **数据页大小/行平均大小** 时，直接加载整表到内存可能更快
- **回表成本**：当需要返回的列不在覆盖索引中时，每行都需要额外的随机 I/O

**Step 3 - 复合索引的最左前缀匹配**：
对于索引 `(a, b, c)`：
- ✅ 有效：`WHERE a=1`, `WHERE a=1 AND b=2`, `WHERE a=1 AND b=2 AND c=3`
- ❌ 失效：`WHERE b=2`, `WHERE c=3`, `WHERE b=2 AND c=3`
- ⚠️ 部分有效：`WHERE a=1 AND c=3`（只能用到 a 列）

## 【关联/对比】

### MySQL 不同存储引擎的索引实现差异
| 特性 | InnoDB | MyISAM |
|------|--------|--------|
| 索引类型 | 聚簇索引（主键索引） + 二级索引 | 非聚簇索引（所有索引平等） |
| 叶子节点存储 | 主键索引存整行数据，二级索引存主键值 | 所有索引存数据行指针 |
| 回表机制 | 二级索引需要两次查找（索引→主键→数据） | 所有索引直接指向数据位置 |

### 索引类型选择策略
- **B+Tree 索引**：默认类型，适合范围查询和排序
- **哈希索引**：仅 MEMORY 引擎支持，适合等值查询，不支持范围查询
- **全文索引**：针对文本内容的特殊索引，使用倒排索引结构
- **空间索引**：用于地理数据，使用 R-Tree

## 『面试官追问』

### Q1：如何理解“覆盖索引”和“索引下推”？
**覆盖索引**：
- 定义：查询所需的所有列都包含在索引中，无需回表
- 优势：减少 I/O 操作，提升查询性能 2-10 倍
- 示例：`SELECT id, name FROM users WHERE age > 20`，若有索引 `(age, name, id)` 则完全覆盖

**索引下推（ICP，Index Condition Pushdown）**：
- MySQL 5.6+ 引入的优化技术
- 原理：在存储引擎层过滤索引条件，减少回表次数
- 示例：索引 `(a, b)`，查询 `WHERE a='x' AND b LIKE '%y'`
  - 无 ICP：先回表所有 `a='x'` 的行，再在 Server 层过滤 `b`
  - 有 ICP：在存储引擎层同时过滤 `a` 和 `b`，只回表匹配的行

### Q2：什么情况下应该创建索引？什么情况下不应该？
**应该创建索引**：
1. 主键和外键自动创建索引
2. `WHERE`、`JOIN`、`ORDER BY`、`GROUP BY` 频繁使用的列
3. 高选择性的列（唯一值比例高）
4. 覆盖索引场景下的多列组合

**不应该创建索引**：
1. 数据量极小的表（< 1000 行）
2. 更新极其频繁而查询较少的列
3. 选择性极低的列（如性别、状态标志）
4. 过长的字符串列（可考虑前缀索引）

### Q3：如何量化评估索引效果？
**关键指标**：
1. **索引选择性** = 不同值数量 / 总行数
   - 建议：> 0.2 的列适合建索引
2. **索引使用率**：通过 `SHOW INDEX FROM table` 查看 `Cardinality`
3. **查询性能对比**：
   ```sql
   -- 执行时间对比
   SELECT SQL_NO_CACHE * FROM table WHERE condition; -- 无索引
   SELECT SQL_NO_CACHE * FROM table USE INDEX(index_name) WHERE condition; -- 强制使用索引
   ```

## 【实战排查流程】

### Step-by-Step 索引效果排查
**Step 1：识别慢查询**
```sql
-- 开启慢查询日志
SET GLOBAL slow_query_log = ON;
SET GLOBAL long_query_time = 2; -- 2秒以上为慢查询
```

**Step 2：使用 EXPLAIN 分析**
```sql
EXPLAIN FORMAT=JSON SELECT * FROM orders WHERE user_id = 100 AND status = 'paid';
```
关键字段解读：
- `type`：`const` > `eq_ref` > `ref` > `range` > `index` > `ALL`
- `key`：实际使用的索引
- `rows`：预估扫描行数
- `Extra`：`Using index`（覆盖索引）、`Using where`（回表过滤）

**Step 3：索引优化建议生成**
```sql
-- 查看索引统计信息
SHOW INDEX FROM orders;
ANALYZE TABLE orders; -- 更新统计信息

-- 使用优化器提示
SELECT /*+ INDEX(orders idx_user_status) */ * 
FROM orders 
WHERE user_id = 100;
```

**Step 4：监控与验证**
```sql
-- 查看索引使用情况
SELECT * FROM sys.schema_index_statistics 
WHERE table_schema = 'your_db';

-- 验证优化效果
FLUSH STATUS;
SELECT * FROM orders WHERE condition;
SHOW SESSION STATUS LIKE 'Handler_read%';
```

## 【版本差异】
- **MySQL 5.6**：引入 ICP、MRR（Multi-Range Read）
- **MySQL 5.7**：优化器成本模型改进，生成列索引
- **MySQL 8.0**：
  - 不可见索引（`ALTER TABLE ... ALTER INDEX ... INVISIBLE`）
  - 降序索引（`INDEX idx (col1 DESC, col2 ASC)`）
  - 函数索引（`CREATE INDEX idx ON t((JSON_EXTRACT(col, '$.path')))`）
  - 跳跃扫描索引（Skip Scan）

## 【总结要点】
1. 索引有效性的核心判断标准是**优化器成本估算**，而非主观感觉
2. 必须通过 `EXPLAIN` 和性能监控数据验证索引实际效果
3. 索引设计需要平衡**查询性能**与**维护成本**（插入/更新/删除的开销）
4. 定期使用 `pt-duplicate-key-checker`、`pt-index-usage` 等工具进行索引审计和优化
