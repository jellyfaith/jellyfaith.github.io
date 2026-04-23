---
title: "如何使用 MySQL 的 EXPLAIN 语句进行查询分析？"
published: 2026-02-28
draft: false
description: ""
tags: [note]
---
# 如何使用 MySQL 的 EXPLAIN 语句进行查询分析？

# MySQL EXPLAIN 语句查询分析详解

## 【核心定义】
EXPLAIN 是 MySQL 提供的用于分析 SQL 查询执行计划的诊断工具，通过展示查询优化器选择的执行路径，帮助开发者理解查询性能瓶颈并进行优化。

## 【关键要点】
1. **执行计划解读**：EXPLAIN 输出查询优化器选择的访问方法、连接顺序、索引使用情况等关键信息
2. **性能诊断**：通过分析 type、key、rows、Extra 等字段，定位全表扫描、临时表、文件排序等性能问题
3. **索引优化**：验证索引是否被正确使用，识别缺失或冗余索引，指导索引设计优化
4. **连接优化**：分析多表连接的执行顺序和连接算法（Nested Loop、Hash Join 等）

## 【深度推导/细节】

### 执行计划各字段深度解析

**Step 1 - id 字段分析**
- 相同 id：同一查询层级，执行顺序从上到下
- 不同 id：id 值越大优先级越高，越先执行
- id 为 NULL：表示 UNION 结果或派生表

**Step 2 - select_type 查询类型识别**
- SIMPLE：简单查询，不包含子查询或 UNION
- PRIMARY：最外层查询或包含子查询的主查询
- SUBQUERY：子查询中的第一个 SELECT
- DERIVED：派生表（FROM 子句中的子查询）
- UNION：UNION 中的第二个及后续 SELECT
- UNION RESULT：UNION 的结果集

**Step 3 - type 访问类型（性能关键）**
性能从优到劣排序：
1. **system**：表中只有一行数据（系统表）
2. **const**：通过主键或唯一索引的等值查询，最多返回一行
3. **eq_ref**：多表连接时，使用主键或唯一索引进行关联
4. **ref**：使用非唯一索引进行等值查询
5. **range**：使用索引进行范围查询（BETWEEN、IN、>、< 等）
6. **index**：全索引扫描（扫描索引树的所有叶子节点）
7. **ALL**：全表扫描（性能最差，需重点优化）

**Step 4 - possible_keys 与 key 分析**
- possible_keys：查询可能使用的索引
- key：实际使用的索引
- 关键矛盾：possible_keys 有值但 key 为 NULL → 索引未被使用，需检查查询条件

**Step 5 - rows 与 filtered 估算**
- rows：预估需要扫描的行数（基于统计信息）
- filtered：存储引擎返回数据后，经过 WHERE 条件过滤的百分比
- 性能判断：rows × filtered 值越小越好

**Step 6 - Extra 额外信息（优化重点）**
- **Using index**：覆盖索引，无需回表
- **Using where**：在存储引擎层过滤后，服务器层再次过滤
- **Using temporary**：使用临时表（GROUP BY、ORDER BY 未用索引时）
- **Using filesort**：使用文件排序（ORDER BY 未用索引时）
- **Using join buffer**：使用连接缓冲区（Block Nested-Loop）

## 【关联/对比】

### EXPLAIN 与相关工具对比

**EXPLAIN vs EXPLAIN ANALYZE**
- EXPLAIN：显示预估执行计划（MySQL 5.6+）
- EXPLAIN ANALYZE：实际执行查询并显示真实执行计划（MySQL 8.0.18+），包含实际执行时间

**EXPLAIN FORMAT 不同格式**
- TRADITIONAL：传统表格格式（默认）
- JSON：JSON 格式，包含更详细信息
- TREE：树形结构（MySQL 8.0.16+），更直观展示执行流程

**与 profiling 工具的关系**
- EXPLAIN：分析执行计划
- SHOW PROFILES / PERFORMANCE_SCHEMA：分析实际执行时间和资源消耗
- 组合使用：先用 EXPLAIN 分析计划，再用 profiling 验证实际性能

## 【实战优化案例】

### 案例：优化慢查询
```sql
-- 原始查询
EXPLAIN SELECT * FROM orders o 
JOIN customers c ON o.customer_id = c.id 
WHERE o.status = 'shipped' 
ORDER BY o.created_at DESC 
LIMIT 100;

-- 优化步骤：
-- 1. 检查 type 字段：若出现 ALL，考虑添加索引
-- 2. 检查 Extra 字段：若出现 Using filesort，考虑为 ORDER BY 字段添加索引
-- 3. 检查 key 字段：确保使用了合适的索引
```

### 索引优化策略
1. **覆盖索引优化**：让查询所需字段都包含在索引中
2. **最左前缀原则**：复合索引的左侧字段必须出现在查询条件中
3. **索引下推优化**：MySQL 5.6+ 支持，在存储引擎层过滤数据

## 『面试官追问』

### 高频追问问题：
1. **type 字段中 ref 和 eq_ref 的区别是什么？**
   - eq_ref：连接时使用主键或唯一索引，每个前表行只匹配后表一行
   - ref：使用非唯一索引，可能匹配多行

2. **Using index 和 Using where 同时出现说明什么？**
   - Using index：使用了覆盖索引
   - Using where：在索引基础上进行了额外过滤
   - 同时出现：索引覆盖了部分查询，但还需进一步过滤

3. **如何判断是否需要添加索引？**
   - type 为 ALL 或 index 时考虑添加
   - rows 值过大时考虑添加
   - Extra 出现 Using filesort 或 Using temporary 时考虑添加

4. **EXPLAIN 中的 rows 是准确值吗？**
   - 不是准确值，是基于统计信息的估算值
   - 实际行数可能相差较大，特别是表数据频繁变更时

5. **MySQL 8.0 中 EXPLAIN 有哪些新特性？**
   - EXPLAIN ANALYZE：实际执行查询并显示真实数据
   - FORMAT=TREE：树形展示执行计划
   - 支持窗口函数的执行计划分析

### 性能优化临界点：
- **rows > 1000**：通常需要优化，考虑添加索引
- **filtered < 10%**：WHERE 条件过滤效果差，考虑优化查询条件
- **type = ALL**：必须优化，避免全表扫描
- **Extra 出现 Using temporary**：数据量大时性能急剧下降

## 【版本差异】
- **MySQL 5.6**：引入索引下推优化，EXPLAIN 显示 Using index condition
- **MySQL 5.7**：优化子查询和派生表处理，EXPLAIN 显示 materialized
- **MySQL 8.0**：引入 EXPLAIN ANALYZE、TREE 格式，支持哈希连接
- **MySQL 8.0.18+**：EXPLAIN ANALYZE 显示实际执行时间和循环次数

## 【最佳实践】
1. **定期分析慢查询**：结合慢查询日志和 EXPLAIN 分析
2. **使用合适格式**：复杂查询使用 FORMAT=JSON 获取详细信息
3. **验证优化效果**：优化前后分别执行 EXPLAIN 对比
4. **关注统计信息**：ANALYZE TABLE 更新统计信息，确保 EXPLAIN 准确性
5. **结合其他工具**：与 PERFORMANCE_SCHEMA、SHOW PROFILE 配合使用

通过系统化分析 EXPLAIN 输出，可以精准定位查询性能瓶颈，制定有效的优化策略，显著提升数据库性能。
