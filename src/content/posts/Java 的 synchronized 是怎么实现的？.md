---
title: "Java 的 synchronized 是怎么实现的？"
published: 2026-04-22
draft: false
description: ""
tags: [note]
---
# Java 的 synchronized 是怎么实现的？

# synchronized 的实现原理

## 【核心定义】
synchronized 是 Java 内置的、基于 JVM 实现的**悲观锁**机制，通过对象头中的 Mark Word 和 Monitor 对象来实现线程同步。

## 【关键要点】
1. **锁升级机制**：synchronized 采用**偏向锁 → 轻量级锁 → 重量级锁**的渐进式升级策略，平衡性能与安全性
   - 偏向锁：单线程访问时，通过 CAS 在对象头记录线程 ID
   - 轻量级锁：多线程竞争但未同时访问时，通过自旋 CAS 竞争
   - 重量级锁：竞争激烈时，线程进入阻塞队列，由操作系统调度

2. **对象头结构**：锁状态存储在对象头的 Mark Word 中（32位/64位）
   - 锁标志位（2位）：标识当前锁状态（01-无锁/偏向锁，00-轻量级锁，10-重量级锁）
   - 偏向锁标志（1位）：区分无锁和偏向锁状态
   - 线程 ID（23位/54位）：偏向锁时记录持有线程

3. **Monitor 机制**：重量级锁的核心是 ObjectMonitor 对象
   - _owner：指向持有锁的线程
   - _WaitSet：调用 wait() 的线程集合
   - _EntryList：阻塞等待锁的线程队列
   - _count：重入次数计数器

## 【深度推导/细节】

### 锁升级的完整流程（逻辑复现）：
**Step 1 - 初始状态**：
- 对象创建后，默认开启偏向锁（延迟 4s）
- 锁标志位 = 01，偏向锁标志 = 0（无锁状态）

**Step 2 - 第一次加锁（偏向锁）**：
- 线程 A 访问同步代码块
- CAS 操作将 Mark Word 中的线程 ID 替换为线程 A 的 ID
- 偏向锁标志置为 1，进入偏向锁模式
- **性能优势**：后续同一线程访问只需检查线程 ID，无需 CAS

**Step 3 - 竞争出现（轻量级锁）**：
- 线程 B 尝试获取锁，发现对象已偏向线程 A
- 撤销偏向锁（需要安全点，STW 风险）
- 线程 A 和 B 各自在栈帧中创建 Lock Record
- 通过 **CAS 自旋**竞争将对象头指向自己的 Lock Record
- 成功者获得轻量级锁，失败者继续自旋（默认 10 次）

**Step 4 - 竞争激烈（重量级锁）**：
- 线程 C 加入竞争，自旋超过阈值
- 轻量级锁膨胀为重量级锁
- 对象头指向操作系统级别的 Monitor 对象
- 未获得锁的线程进入 _EntryList 阻塞队列
- **性能代价**：涉及用户态到内核态的切换，上下文切换开销大

### 关键数字与设计合理性：
- **偏向锁延迟 4s**：避免大量对象在初始化阶段就启用偏向锁，减少撤销开销
- **自旋次数 10 次**（自适应自旋）：平衡 CPU 空转与线程阻塞的开销
- **批量重偏向阈值 20**：当同一类的对象撤销偏向锁达到 20 次，JVM 认为该类不适合偏向锁
- **批量撤销阈值 40**：达到 40 次后，JVM 禁用该类的偏向锁

## 【关联/对比】

### synchronized vs ReentrantLock：
| 特性 | synchronized | ReentrantLock |
|------|-------------|---------------|
| 实现层面 | JVM 内置，字节码指令 | JDK API 实现 |
| 锁类型 | 非公平锁（不可选） | 可公平/非公平 |
| 中断响应 | 不支持 | 支持 lockInterruptibly() |
| 条件队列 | 单一 wait/notify | 多个 Condition |
| 性能 | JDK 6+ 优化后相当 | 高竞争时略优 |

### synchronized 在字节码层面的体现：
```java
// 源代码
public void syncMethod() {
    synchronized(this) {
        // 临界区
    }
}

// 字节码等价形式
monitorenter  // 进入同步块
try {
    // 临界区代码
} finally {
    monitorexit   // 退出同步块
}
```

## 【版本差异】
- **JDK 1.6 之前**：synchronized 直接使用重量级锁，性能较差
- **JDK 1.6**：引入锁升级机制（偏向锁、轻量级锁）、自适应自旋、锁消除、锁粗化
- **JDK 15**：默认禁用偏向锁（-XX:-UseBiasedLocking），因现代多核处理器下收益有限
- **JDK 后续**：继续优化，如减少偏向锁撤销的 STW 时间

## 『面试官追问』

### 可能的问题：
1. **为什么 JDK 15 默认禁用偏向锁？**
   - 现代应用多为多线程高并发场景，偏向锁的撤销开销可能大于收益
   - 偏向锁在多核处理器上的优化效果有限
   - 简化 JVM 实现，减少代码复杂度

2. **synchronized 的锁消除和锁粗化是什么？**
   - **锁消除**：JIT 编译器对不可能存在共享数据竞争的锁进行消除
     ```java
     // 以下代码的锁会被消除
     public String concat(String s1, String s2, String s3) {
         StringBuffer sb = new StringBuffer();
         sb.append(s1);  // StringBuffer 是线程安全的
         sb.append(s2);  // 但这里的 sb 是局部变量，不可能被共享
         sb.append(s3);
         return sb.toString();
     }
     ```
   - **锁粗化**：将相邻的同步块合并，减少锁的获取/释放次数
     ```java
     // 优化前
     for (int i = 0; i < 100; i++) {
         synchronized(lock) {
             // 小段操作
         }
     }
     // 优化后（锁粗化）
     synchronized(lock) {
         for (int i = 0; i < 100; i++) {
             // 合并操作
         }
     }
     ```

3. **synchronized 的可重入性如何实现？**
   - 通过 Monitor 中的 _count 计数器记录重入次数
   - 每次重入 _count++，退出时 _count--
   - 当 _count == 0 时，真正释放锁

4. **synchronized 和 volatile 的区别？**
   - synchronized 保证**原子性、可见性、有序性**
   - volatile 只保证**可见性、有序性**，不保证原子性
   - synchronized 是阻塞同步，volatile 是非阻塞同步

5. **如何选择 synchronized 和 Lock？**
   - 优先使用 synchronized：代码简洁，JVM 自动优化
   - 需要高级功能时用 Lock：可中断、超时、公平锁、多个条件变量
   - 高竞争场景测试两者性能，选择更优者
