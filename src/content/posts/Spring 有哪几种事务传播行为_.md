---
title: "Spring 有哪几种事务传播行为?"
published: 2026-04-22
draft: false
description: ""
tags: [note]
---
# Spring 有哪几种事务传播行为?

# Spring 事务传播行为详解

## 【核心定义】
Spring 事务传播行为定义了在多个事务方法相互调用时，事务应该如何传播和管理的规则，是 Spring 事务管理的核心机制之一。

## 【关键要点】
1. **REQUIRED（默认）**：如果当前存在事务，则加入该事务；如果当前没有事务，则创建一个新的事务。
   - 原理：通过 `TransactionSynchronizationManager.isActualTransactionActive()` 判断当前线程是否存在事务上下文

2. **SUPPORTS**：如果当前存在事务，则加入该事务；如果当前没有事务，则以非事务方式执行。
   - 原理：适用于查询操作，不影响现有事务，无事务时直接执行

3. **MANDATORY**：必须在一个已有的事务中执行，否则抛出 `IllegalTransactionStateException`。
   - 原理：通过强制检查确保方法在事务上下文中执行

4. **REQUIRES_NEW**：无论当前是否存在事务，都创建一个新的事务，并暂停当前事务（如果存在）。
   - 原理：通过 `TransactionSynchronizationManager.suspend()` 暂停当前事务，创建独立事务

5. **NOT_SUPPORTED**：以非事务方式执行操作，如果当前存在事务，则挂起该事务。
   - 原理：适用于不需要事务支持的操作，避免事务开销

6. **NEVER**：以非事务方式执行，如果当前存在事务，则抛出异常。
   - 原理：强制确保方法不在事务中执行

7. **NESTED**：如果当前存在事务，则在嵌套事务内执行；如果当前没有事务，则执行与 REQUIRED 类似的操作。
   - 原理：通过保存点（Savepoint）实现部分回滚

## 【深度推导/细节】

### 嵌套事务（NESTED）的实现机制
**Step 1**：当外层事务存在时，Spring 会创建一个数据库保存点（Savepoint）
```java
// 伪代码逻辑
Savepoint savepoint = connection.setSavepoint();
try {
    // 执行嵌套事务方法
    innerMethod();
} catch (Exception e) {
    // 只回滚到保存点，不影响外层事务
    connection.rollback(savepoint);
    throw e;
}
```

**Step 2**：嵌套事务回滚时，只回滚到保存点，外层事务不受影响

**Step 3**：外层事务提交时，嵌套事务的所有操作一并提交

### REQUIRES_NEW 与 NESTED 的关键区别
| 特性 | REQUIRES_NEW | NESTED |
|------|-------------|--------|
| 事务独立性 | 完全独立的新事务 | 依赖外层事务的嵌套事务 |
| 回滚影响 | 内层回滚不影响外层 | 内层回滚不影响外层（通过保存点） |
| 外层回滚影响 | 外层回滚不影响已提交的内层 | 外层回滚会导致内层一起回滚 |
| 数据库支持 | 所有数据库都支持 | 需要数据库支持保存点（如 MySQL、Oracle） |
| 连接使用 | 可能使用不同连接（取决于配置） | 使用同一个连接 |

## 【关联/对比】

### Spring 事务传播 vs 数据库事务隔离
- **传播行为**：解决"多个事务方法如何协作"的问题
- **隔离级别**：解决"并发事务之间的数据可见性"问题

### Spring 事务传播 vs EJB 事务传播
| 特性 | Spring | EJB |
|------|--------|-----|
| 实现方式 | 基于 AOP 代理 | 基于容器管理 |
| 配置方式 | 注解或 XML | 部署描述符 |
| 灵活性 | 更灵活，支持编程式事务 | 相对固定 |

### 实际应用场景对比
1. **资金转账（REQUIRED）**：
   ```java
   @Transactional(propagation = Propagation.REQUIRED)
   public void transfer(Account from, Account to, BigDecimal amount) {
       deduct(from, amount);  // 扣款
       add(to, amount);       // 加款 - 两个操作在同一个事务中
   }
   ```

2. **日志记录（REQUIRES_NEW）**：
   ```java
   @Transactional(propagation = Propagation.REQUIRES_NEW)
   public void logOperation(OperationLog log) {
       // 即使主业务失败，日志仍需记录
       logRepository.save(log);
   }
   ```

3. **批量处理（NESTED）**：
   ```java
   @Transactional(propagation = Propagation.REQUIRED)
   public void batchProcess(List<Item> items) {
       for (Item item : items) {
           try {
               processItem(item);  // NESTED 传播
           } catch (Exception e) {
               // 单个失败不影响其他处理
               log.error("Item failed", e);
           }
       }
   }
   
   @Transactional(propagation = Propagation.NESTED)
   public void processItem(Item item) {
       // 处理单个项目
   }
   ```

## 『面试官追问』

### Q1：REQUIRED 和 REQUIRES_NEW 在异常处理上有什么区别？
**A**：
- **REQUIRED**：内层方法抛出异常，整个事务（包括外层）都会回滚
- **REQUIRES_NEW**：内层方法异常只回滚内层事务，外层事务可继续（除非外层捕获异常并处理）

### Q2：NESTED 传播在哪些数据库上不可用？为什么？
**A**：
- **不可用数据库**：某些数据库不支持保存点机制
- **替代方案**：可改用 REQUIRES_NEW，但要注意事务完全独立的问题
- **检查方法**：`DataSourceTransactionManager.supportsSavepoints()`

### Q3：Spring 如何实现事务传播的？
**A**：
1. **事务管理器**：`PlatformTransactionManager` 负责事务管理
2. **事务同步**：`TransactionSynchronizationManager` 维护线程绑定的事务上下文
3. **AOP 拦截**：通过 `TransactionInterceptor` 拦截方法调用
4. **传播逻辑**：根据传播行为决定是加入、创建还是挂起事务

### Q4：@Transactional 注解在同类方法调用时为什么不生效？
**A**：
- **根本原因**：Spring AOP 基于代理实现，同类方法调用绕过代理
- **解决方案**：
  1. 自我注入：`@Autowired private Self self;`
  2. 使用 AspectJ 编译时织入
  3. 从 ApplicationContext 获取代理对象

### Q5：如何选择合适的事务传播行为？
**A**：决策矩阵
| 场景 | 推荐传播行为 | 理由 |
|------|-------------|------|
| 大多数业务方法 | REQUIRED | 保证数据一致性 |
| 查询方法 | SUPPORTS | 避免不必要的事务开销 |
| 必须在外层事务中 | MANDATORY | 强制事务上下文 |
| 独立业务操作 | REQUIRES_NEW | 避免相互影响 |
| 非事务操作 | NOT_SUPPORTED | 明确无事务需求 |
| 严禁在事务中 | NEVER | 强制非事务执行 |
| 部分回滚需求 | NESTED | 细粒度事务控制 |

### Q6：事务传播与分布式事务的关系？
**A**：
- **本地事务传播**：单数据源内的事务协调
- **分布式事务**：跨多个数据源/服务的事务协调
- **Spring 解决方案**：本地传播 + JTA/XA 或 Seata/Saga 模式

## 【最佳实践建议】

1. **默认使用 REQUIRED**：除非有特殊需求，否则使用默认传播行为
2. **谨慎使用 REQUIRES_NEW**：可能造成死锁或连接耗尽
3. **NESTED 的适用场景**：批量处理中的部分失败容忍
4. **事务边界清晰**：避免过长的事务链，合理划分事务边界
5. **异常处理一致**：确保异常类型与回滚规则匹配（`rollbackFor` 属性）

## 【版本差异】
- **Spring 4.0+**：支持 Java 8 的 Optional 返回值类型
- **Spring 5.0+**：响应式事务支持（Reactive Transactions）
- **Spring 5.3+**：改进的事务同步机制，更好的性能

通过深入理解这 7 种传播行为及其适用场景，可以在实际开发中更精准地控制事务边界，确保数据一致性的同时优化系统性能。
