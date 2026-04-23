---
title: "Synchronized 和 ReentrantLock 有什么区别？"
published: 2026-03-14
draft: false
description: ""
tags: [note]
---
# Synchronized 和 ReentrantLock 有什么区别？

# Synchronized 和 ReentrantLock 的区别

## 【核心定义】
Synchronized 是 Java 内置的、基于 JVM 实现的隐式锁机制，而 ReentrantLock 是 JDK 提供的、基于 API 实现的显式锁机制，两者都实现了可重入的互斥锁功能。

## 【关键要点】
1. **实现层面不同**
   - Synchronized 是 JVM 原生支持的锁，通过 `monitorenter` 和 `monitorexit` 字节码指令实现
   - ReentrantLock 是 JDK 级别实现的锁，基于 AQS（AbstractQueuedSynchronizer）框架

2. **使用方式不同**
   - Synchronized 是隐式锁，自动获取和释放锁（进入同步代码块获取，退出时释放）
   - ReentrantLock 是显式锁，需要手动调用 `lock()` 和 `unlock()` 方法

3. **功能特性差异**
   - **可中断性**：ReentrantLock 支持 `lockInterruptibly()`，可响应中断；Synchronized 等待时不可中断
   - **公平锁**：ReentrantLock 可配置公平/非公平锁；Synchronized 仅支持非公平锁
   - **条件变量**：ReentrantLock 支持多个 Condition；Synchronized 只有一个等待队列
   - **尝试获取锁**：ReentrantLock 支持 `tryLock()` 尝试获取锁

4. **性能表现**
   - JDK 1.6 之前，Synchronized 性能较差
   - JDK 1.6 引入锁优化（偏向锁、轻量级锁、锁消除等）后，两者性能相当
   - 高竞争场景下，ReentrantLock 通常表现更好

## 【深度推导/细节】

### Synchronized 的锁升级过程（JDK 1.6+）
**Step 1 - 无锁状态**：对象初始状态
**Step 2 - 偏向锁**：第一个线程访问时，CAS 设置线程 ID，适用于单线程重复访问场景
**Step 3 - 轻量级锁**：发生竞争时，升级为轻量级锁，通过自旋尝试获取锁
**Step 4 - 重量级锁**：自旋超过阈值（默认 10 次）或竞争激烈时，升级为重量级锁，线程进入阻塞队列

### ReentrantLock 的 AQS 实现原理
```java
// 核心数据结构
private volatile int state; // 同步状态
private transient volatile Node head; // 等待队列头
private transient volatile Node tail; // 等待队列尾

// 非公平锁获取流程
final void lock() {
    if (compareAndSetState(0, 1)) // 直接尝试 CAS
        setExclusiveOwnerThread(Thread.currentThread());
    else
        acquire(1); // 进入 AQS 队列
}
```

## 【关联/对比】

### 与相关技术的区别
1. **Synchronized vs ReentrantLock**
   - Synchronized 更简洁，不易出错（自动释放）
   - ReentrantLock 更灵活，功能更丰富

2. **ReentrantLock vs ReentrantReadWriteLock**
   - 前者是互斥锁，后者支持读写分离
   - 读多写少场景下，读写锁性能更好

3. **Synchronized vs volatile**
   - Synchronized 保证原子性和可见性
   - volatile 仅保证可见性，不保证原子性

### 版本差异
- **JDK 1.5 之前**：Synchronized 是唯一选择，性能较差
- **JDK 1.5**：引入 ReentrantLock，性能优势明显
- **JDK 1.6**：Synchronized 引入锁优化，性能大幅提升
- **JDK 1.8+**：两者性能相当，选择基于功能需求而非性能

## 【面试官追问】

### 高频问题 1：为什么 Synchronized 性能在 JDK 1.6 后大幅提升？
**核心优化**：
1. **偏向锁**：减少无竞争时的同步开销
2. **轻量级锁**：通过 CAS 和自旋避免线程阻塞
3. **锁消除**：JIT 编译器消除不可能存在竞争的锁
4. **锁粗化**：将连续的锁操作合并为一次锁操作

### 高频问题 2：什么场景下选择 ReentrantLock？
**适用场景**：
1. 需要**可中断的锁获取**（避免死锁）
2. 需要**尝试获取锁**（`tryLock()`）
3. 需要**公平锁**保证顺序性
4. 需要**多个条件变量**（`newCondition()`）
5. 需要**锁超时**机制

### 高频问题 3：Synchronized 的锁升级过程是怎样的？
**详细流程**：
1. **初始状态**：对象头 Mark Word 记录 hashcode 等信息
2. **偏向锁**：第一个线程访问，CAS 设置线程 ID 到 Mark Word
3. **轻量级锁**：竞争发生时，线程栈中创建 Lock Record，CAS 将 Mark Word 指向 Lock Record
4. **重量级锁**：竞争激烈时，指向操作系统级别的互斥量（mutex）

### 高频问题 4：ReentrantLock 如何实现可重入？
**实现机制**：
```java
// AQS 中的同步状态 state 记录重入次数
protected final boolean tryAcquire(int acquires) {
    final Thread current = Thread.currentThread();
    int c = getState();
    if (c == 0) {
        // 第一次获取锁
        if (compareAndSetState(0, acquires)) {
            setExclusiveOwnerThread(current);
            return true;
        }
    }
    else if (current == getExclusiveOwnerThread()) {
        // 重入：当前线程已持有锁
        int nextc = c + acquires;
        if (nextc < 0) // overflow
            throw new Error("Maximum lock count exceeded");
        setState(nextc); // 增加重入次数
        return true;
    }
    return false;
}
```

## 【最佳实践建议】

### 选择原则
1. **优先使用 Synchronized**：代码简洁，自动管理，不易出错
2. **需要高级功能时使用 ReentrantLock**：如可中断、公平锁、多个条件等
3. **读写分离场景**：考虑使用 ReentrantReadWriteLock 或 StampedLock

### 性能考量
- **低竞争场景**：两者性能差异不大
- **高竞争场景**：ReentrantLock 通常表现更好
- **读多写少**：读写锁性能最优

### 注意事项
1. ReentrantLock 必须**在 finally 块中释放锁**，否则可能导致死锁
2. Synchronized 的锁对象不能为 null
3. 合理设置 ReentrantLock 的公平性，非公平锁吞吐量更高但可能产生饥饿

---

**总结**：Synchronized 和 ReentrantLock 都是 Java 中重要的同步机制，选择哪个取决于具体需求。Synchronized 更简单安全，ReentrantLock 更灵活强大。在现代 JVM 中，两者的性能差异已不明显，功能需求成为主要选择依据。
