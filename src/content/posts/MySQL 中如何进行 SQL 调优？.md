---
title: "MySQL 中如何进行 SQL 调优？"
published: 2026-04-22
draft: false
description: ""
tags: [note]
---
# MySQL 中如何进行 SQL 调优？

# MySQL SQL 调优面试标准答案

## 【核心定义】
MySQL SQL 调优是通过分析SQL语句执行过程、优化数据访问路径、调整数据库配置等手段，以最低的资源消耗获取最高查询性能的系统性工程。

## 【关键要点】
1. **执行计划分析**：使用`EXPLAIN`或`EXPLAIN ANALYZE`查看查询执行计划，重点关注type（访问类型）、key（使用索引）、rows（扫描行数）、Extra（额外信息）等字段。
2. **索引优化**：
   - 确保WHERE、JOIN、ORDER BY、GROUP BY涉及的列有合适索引
   - 遵循最左前缀原则，避免索引失效（如函数操作、类型转换、OR条件不当使用）
   - 考虑覆盖索引减少回表
3. **查询重写优化**：
   - 避免SELECT *，只取必要字段
   - 将子查询优化为JOIN（特别是相关子查询）
   - 分页查询使用延迟关联优化深分页
   - 批量操作代替循环单条操作
4. **表结构设计**：
   - 选择合适的数据类型（如INT代替VARCHAR存储数字）
   - 避免NULL值，设置默认值
   - 大字段分离到扩展表
   - 范式与反范式的平衡
5. **配置调优**：
   - 调整`innodb_buffer_pool_size`（通常设为物理内存的70-80%）
   - 合理设置`join_buffer_size`、`sort_buffer_size`等会话级缓冲区
   - 配置查询缓存（MySQL 8.0前）或放弃使用（8.0后移除）

## 【深度推导/细节】

### 索引失效的临界场景分析
**数字8的玄机**：当查询条件返回数据超过表总行数的**20-30%**时（经验值，非绝对），全表扫描可能比索引扫描更快。这是因为：
- Step 1: 使用索引需要两次查找（索引树+回表）
- Step 2: 如果满足条件的数据比例很高，回表成本超过直接扫描
- Step 3: 优化器基于统计信息（`cardinality`）做出选择

**索引下推优化（ICP）**：MySQL 5.6引入
```sql
-- 联合索引(name, age)
SELECT * FROM users WHERE name LIKE '张%' AND age > 20;
```
- 无ICP：先通过name索引找到所有'张%'记录，再回表过滤age
- 有ICP：在索引层直接过滤age>20，减少回表次数

### 分页查询深度优化
**问题**：`LIMIT 100000, 20` 需要先扫描100020行再丢弃前100000行

**优化方案**：
```sql
-- 原查询（性能差）
SELECT * FROM articles ORDER BY id DESC LIMIT 100000, 20;

-- 优化1：使用覆盖索引+延迟关联
SELECT * FROM articles a
JOIN (SELECT id FROM articles ORDER BY id DESC LIMIT 100000, 20) t
ON a.id = t.id;

-- 优化2：记录上次查询位置（连续分页）
SELECT * FROM articles WHERE id < 上次最小ID ORDER BY id DESC LIMIT 20;
```

## 【关联/对比】

### MySQL各版本调优差异
| 版本 | 关键特性 | 调优影响 |
|------|---------|---------|
| 5.6 | ICP索引下推 | 减少回表，优化联合索引查询 |
| 5.7 | 生成列、虚拟列 | 可对计算列建索引 |
| 8.0 | 窗口函数、CTE | 复杂查询可读性和性能提升 |
| 8.0 | 移除查询缓存 | 不再需要query_cache相关配置 |

### 不同存储引擎对比
- **InnoDB**：聚簇索引、行锁、MVCC、外键支持（调优重点）
- **MyISAM**：表锁、全文索引（已过时）
- **Memory**：内存表，临时表场景

## 『面试官追问』

### 高频追问问题：
1. **如何定位慢查询？**
   - 开启慢查询日志（`slow_query_log`）
   - 使用`pt-query-digest`分析
   - 监控`information_schema.processlist`

2. **EXPLAIN中type字段有哪些值？性能排序？**
   - system > const > eq_ref > ref > range > index > ALL
   - 至少达到range级别，避免ALL

3. **什么情况下索引会失效？**
   - 对索引列进行函数运算：`WHERE YEAR(create_time) = 2023`
   - 隐式类型转换：`WHERE phone = 13800138000`（phone是varchar）
   - 使用OR且部分列无索引
   - LIKE以通配符开头：`WHERE name LIKE '%张'`
   - 索引列参与计算：`WHERE age + 1 > 20`

4. **如何优化JOIN查询？**
   - 确保JOIN字段有索引且类型一致
   - 小表驱动大表（MySQL会自动优化）
   - 适当调整`join_buffer_size`

5. **MySQL 8.0为什么移除查询缓存？**
   - 缓存失效频繁，维护成本高
   - 表更新即缓存失效，写频繁场景反而降低性能
   - 应用层缓存（Redis/Memcached）更灵活高效

### 调优实战数字要点：
- **索引选择性**：`cardinality/总行数` > 0.1 适合建索引
- **InnoDB缓冲池**：设为物理内存的70-80%，但不超过80%（留空间给OS）
- **重做日志大小**：`innodb_log_file_size`通常设为缓冲池的25%
- **连接数**：`max_connections`根据应用需求设置，避免过高（默认151）

### 调优流程总结：
1. **监控发现**：识别慢查询（响应时间>1s）
2. **分析定位**：EXPLAIN分析执行计划
3. **索引优化**：添加/调整索引
4. **查询重写**：优化SQL逻辑
5. **配置调整**：调整服务器参数
6. **架构升级**：读写分离、分库分表（终极方案）

**最终建议**：调优是持续过程，需结合业务场景，避免过度优化。优先解决性能瓶颈最严重的20%查询，往往能获得80%的性能提升。
