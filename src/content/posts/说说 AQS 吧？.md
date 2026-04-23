---
title: "说说 AQS 吧？"
published: 2026-02-12
draft: false
description: ""
tags: [note]
---
# 说说 AQS 吧？

# AQS（AbstractQueuedSynchronizer）面试标准答案

## 【核心定义】
AQS 是 Java 并发包中构建锁和同步器的核心框架，通过一个 **FIFO 队列** 管理线程的排队与唤醒，并利用一个 **volatile int 型 state 变量** 表示同步状态。

## 【关键要点】
1. **核心数据结构**：CLH 变体的 FIFO 双向队列 + volatile state 同步状态
   - 队列节点 Node 封装等待线程，包含前驱、后继指针和线程状态（CANCELLED、SIGNAL、CONDITION、PROPAGATE）
   - state 表示资源数量（如 ReentrantLock 中 0=未锁定，≥1=重入次数）

2. **核心算法逻辑**：独占/共享两种获取模式
   - 独占模式（如 ReentrantLock）：同一时刻只有一个线程能获取资源
   - 共享模式（如 Semaphore）：多个线程可同时获取资源

3. **模板方法设计**：AQS 提供骨架，子类只需实现 5 个 protected 方法
   - `tryAcquire`/`tryRelease`（独占）
   - `tryAcquireShared`/`tryReleaseShared`（共享）  
   - `isHeldExclusively`（是否独占持有）

## 【深度推导/细节】

### 1. 入队与出队逻辑（以独占模式为例）
```
Step 1: 线程调用 acquire(1)
Step 2: tryAcquire() 尝试获取锁（子类实现）
       成功 → 直接返回，线程继续执行
       失败 → 进入 Step 3
Step 3: 创建 Node 节点并入队（addWaiter(Node.EXCLUSIVE)）
Step 4: acquireQueued() 自旋尝试获取锁
       - 前驱是头节点 → 再次 tryAcquire()
       - 成功 → 设置自己为头节点，原头节点出队
       - 失败 → shouldParkAfterFailedAcquire() 判断是否需要阻塞
              前驱状态为 SIGNAL → park() 阻塞线程
Step 5: 被唤醒后继续自旋尝试获取锁
```

### 2. 关键数字与设计考量
- **自旋次数**：入队后并非立即阻塞，而是先自旋尝试 2 次获取锁（实际通过前驱判断）
- **状态传播**：PROPAGATE 状态用于共享模式下唤醒传播，避免“信号丢失”
- **超时控制**：支持 tryAcquireNanos() 实现超时获取，结合 LockSupport.parkNanos()

### 3. 取消机制
```
Step 1: 节点状态置为 CANCELLED（volatile 保证可见性）
Step 2: 从队列中移除：前驱节点的 next 跳过该节点
Step 3: 唤醒后继节点继续尝试获取锁
```
**设计精妙点**：取消时先改状态再移除，保证并发安全；移除时从尾部向前遍历找到有效前驱，解决并发入队问题。

## 【关联/对比】

### AQS vs synchronized
| 特性 | AQS | synchronized |
|------|-----|-------------|
| 实现方式 | Java 代码实现，可扩展 | JVM 内置，C++ 实现 |
| 锁类型 | 支持独占、共享、条件队列 | 仅独占锁 |
| 中断响应 | 支持可中断获取 | 不支持中断等待 |
| 公平性 | 可灵活实现公平/非公平 | 非公平锁 |
| 性能 | 在竞争激烈时更优 | 优化后性能接近 |

### AQS 在 JUC 中的应用
- **ReentrantLock**：state=0/1，实现可重入锁
- **CountDownLatch**：state=计数，共享模式
- **Semaphore**：state=许可数，共享模式
- **ReentrantReadWriteLock**：高 16 位读锁，低 16 位写锁

## 【版本差异】
- **Java 6**：AQS 已成熟，包含完整 CLH 队列实现
- **Java 8**：优化了同步器性能，改进队列操作
- **Java 9+**：内部优化，API 保持稳定，性能持续提升

## 『面试官追问』
1. **为什么 AQS 使用双向队列而不是单向队列？**
   - 原因：需要支持取消操作。当节点取消时，需要修改前驱节点的 next 指针，双向链表可以快速找到前驱节点
   - 对比：CLH 原算法是单向的，AQS 是 CLH 的变体

2. **AQS 中 state 为什么用 volatile？**
   - 保证多线程间的可见性
   - 配合 CAS 操作实现无锁更新：compareAndSetState()

3. **公平锁与非公平锁在 AQS 中如何实现？**
   - 公平锁：hasQueuedPredecessors() 检查队列是否有等待线程
   - 非公平锁：直接尝试 CAS 获取锁，失败才入队

4. **AQS 如何处理线程中断？**
   - acquireInterruptibly()：被中断时抛出 InterruptedException
   - 常规 acquire()：仅记录中断状态，由用户后续检查

5. **条件队列（ConditionObject）与同步队列的关系？**
   - 每个 ConditionObject 维护一个单向条件队列
   - await()：节点从同步队列移到条件队列
   - signal()：节点从条件队列移回同步队列

6. **AQS 为什么是 JUC 的基石？**
   - 提供了统一的线程排队、阻塞、唤醒机制
   - 模板方法模式让同步器实现变得简单
   - 高性能的并发控制基础组件

---

**回答要点**：回答时重点突出 AQS 的**队列管理机制**和**状态控制**，结合具体同步器（如 ReentrantLock）说明实现原理，展现对并发编程底层机制的深刻理解。
