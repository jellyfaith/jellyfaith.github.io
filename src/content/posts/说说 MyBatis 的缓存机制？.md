---
title: "说说 MyBatis 的缓存机制？"
published: 2026-02-11
draft: false
description: ""
tags: [note]
---
# 说说 MyBatis 的缓存机制？

# MyBatis 缓存机制详解

## 【核心定义】
MyBatis 的缓存机制是一种用于提升数据库查询性能的本地数据存储策略，通过将查询结果临时存储在内存中，减少对数据库的直接访问次数。

## 【关键要点】
1. **两级缓存结构**：MyBatis 采用一级缓存（SqlSession 级别）和二级缓存（Mapper/Namespace 级别）的层级设计。
2. **一级缓存特性**：默认开启且无法关闭，生命周期与 SqlSession 绑定，在同一个 SqlSession 中执行相同查询会直接返回缓存结果。
3. **二级缓存配置**：需要显式开启（`<cache/>` 标签），作用域为 Mapper 命名空间，可被多个 SqlSession 共享。
4. **缓存失效策略**：执行 INSERT、UPDATE、DELETE 操作会自动清除相关缓存，保证数据一致性。
5. **缓存实现方式**：默认使用 PerpetualCache（基于 HashMap），可通过配置使用 EhCache、Redis 等第三方缓存。

## 【深度推导/细节】

### 一级缓存工作原理
**Step 1**：执行查询时，MyBatis 创建 CacheKey（由 Mapper Id + Offset + Limit + SQL + Params + Environment 等要素生成）
**Step 2**：在 BaseExecutor 的 localCache（HashMap 实现）中查找对应 CacheKey
**Step 3**：命中则直接返回，未命中则查询数据库并将结果存入 localCache
**Step 4**：执行更新操作时，清空当前 SqlSession 的一级缓存

### 二级缓存数据同步问题
**核心矛盾**：多 SqlSession 共享缓存时的数据一致性问题
- **解决方案**：采用事务性缓存机制，只有事务提交后，缓存才会真正生效
- **执行流程**：查询结果先暂存在 TransactionalCache 中，commit() 时同步到共享缓存区
- **脏读防护**：未提交事务的修改对其他 SqlSession 不可见

### 缓存配置参数解析
```xml
<cache 
  eviction="LRU"           <!-- 淘汰策略：LRU/FIFO/SOFT/WEAK -->
  flushInterval="60000"    <!-- 刷新间隔（毫秒） -->
  size="512"               <!-- 最大缓存对象数 -->
  readOnly="true"         <!-- 是否只读 -->
/>
```

## 【关联/对比】

### MyBatis 缓存 vs Hibernate 缓存
| 对比维度 | MyBatis | Hibernate |
|---------|---------|-----------|
| 缓存级别 | 2级（Session/Mapper） | 3级（Session/SessionFactory/Query） |
| 默认状态 | 一级默认开启 | 二级默认关闭 |
| 缓存策略 | 声明式配置 | 注解+配置 |
| 分布式支持 | 需集成第三方 | 原生支持有限 |

### 一级缓存 vs 二级缓存
- **作用域**：一级缓存为 SqlSession（近似数据库连接），二级缓存为 Mapper 命名空间
- **共享性**：一级缓存线程隔离，二级缓存进程共享
- **失效时机**：一级缓存随 Session 关闭而清除，二级缓存可配置过期策略
- **性能影响**：一级缓存减少重复查询，二级缓存减少跨 Session 重复查询

## 『面试官追问』

### 高频问题清单
1. **为什么 MyBatis 一级缓存默认开启而二级缓存需要手动配置？**
   - 设计哲学：一级缓存风险可控（Session 生命周期短），二级缓存涉及数据共享需要谨慎评估

2. **什么场景下应该关闭 MyBatis 缓存？**
   - 高频更新业务（缓存命中率低反而增加开销）
   - 对实时性要求极高的金融交易场景
   - 多应用共享数据库且无分布式缓存同步机制

3. **如何解决 MyBatis 缓存导致的脏读问题？**
   - 方案一：对关键业务关闭缓存（`useCache="false"`）
   - 方案二：使用 `flushCache="true"` 强制刷新
   - 方案三：合理设计缓存作用域（避免过大范围的缓存）

4. **MyBatis 缓存与 Spring 事务管理器的协作机制？**
   - Spring 管理的 SqlSession 在事务提交后才会提交缓存
   - `@Transactional` 注解的方法中，缓存更新与数据库事务保持原子性

5. **缓存 Key 的生成规则如何避免冲突？**
   - CacheKey 采用复合哈希：`[hashcode, checksum, count, updateList.hashCode()]`
   - 包含 SQL 语句、参数值、分页参数、环境标识等要素
   - 相同 SQL 不同参数会生成不同 CacheKey

### 性能优化关键数字
- **默认缓存大小**：无上限（基于 HashMap），建议通过 `size` 属性限制
- **LRU 淘汰阈值**：当缓存数量超过 `size` 时触发淘汰
- **刷新间隔**：`flushInterval` 设为 0 表示不主动刷新（依赖失效机制）
- **建议配置**：读多写少场景 size=1000，读写均衡场景 size=100-500

## 【版本差异】
- **MyBatis 3.2 之前**：二级缓存存在并发问题，多个 Session 同时更新可能丢失数据
- **MyBatis 3.2+**：引入 BlockingCache 解决并发问题，提供读写锁机制
- **MyBatis 3.5+**：支持缓存装饰器模式，可自定义缓存链（Cache Chain）

## 【最佳实践建议】
1. **查询为主的应用**：开启二级缓存，配置合适的淘汰策略（LRU）
2. **读写均衡场景**：关闭二级缓存或设置较小缓存空间
3. **分布式环境**：禁用 MyBatis 内置缓存，统一使用 Redis 等分布式缓存
4. **监控手段**：通过日志或监控工具观察缓存命中率，指导调优决策

---

**总结**：MyBatis 缓存机制通过精巧的两级设计，在简化开发与保证性能之间取得平衡。正确理解其工作原理和适用场景，能够有效提升系统性能，同时避免因缓存不当导致的数据一致性问题。在实际应用中，应根据业务特征和数据访问模式进行针对性配置。
