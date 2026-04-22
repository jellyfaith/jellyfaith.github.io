---
title: "什么是 Java 的 CAS（Compare-And-Swap）操作？"
published: 2026-04-22
draft: false
description: ""
tags: [note]
---
# 什么是 Java 的 CAS（Compare-And-Swap）操作？

# Java CAS（Compare-And-Swap）操作详解

## 【核心定义】
CAS（Compare-And-Swap）是一种**无锁的原子操作**，它通过比较内存中的值与预期值是否相等来决定是否更新为新值，整个过程在硬件层面保证原子性。

## 【关键要点】
1. **原子性保证**：CAS操作在CPU指令级别实现原子性（如x86的`CMPXCHG`指令），避免了传统锁机制带来的线程阻塞和上下文切换开销。
   
2. **乐观锁思想**：基于“冲突检测”而非“冲突避免”，先尝试操作，失败则重试（自旋），适用于低竞争场景。
   
3. **三大操作数**：
   - **内存地址V**：要更新的变量内存位置
   - **预期值A**：认为变量当前应该的值
   - **新值B**：想要更新成的值
   
4. **返回值机制**：返回内存中的实际值，无论更新是否成功，便于判断和重试逻辑的实现。

## 【深度推导/细节】

### CAS操作流程（分步拆解）：
```
Step 1: 读取内存位置V的当前值，记为current
Step 2: 比较current与预期值A是否相等
Step 3: 如果相等，将内存位置V的值更新为新值B
Step 4: 如果不相等，说明其他线程已修改，操作失败
Step 5: 返回内存位置V的实际值（无论是否更新成功）
```

### ABA问题及解决方案：
**问题本质**：线程1读取值A → 线程2将A改为B又改回A → 线程1的CAS仍成功，但中间状态已变化。

**解决方案**：
- **版本号机制**：`AtomicStampedReference`为值附加版本戳
- **标记引用**：`AtomicMarkableReference`使用布尔标记
- 示例：`AtomicStampedReference.compareAndSet(expectedReference, newReference, expectedStamp, newStamp)`

### 自旋优化策略：
```java
// 典型自旋CAS实现模式
public final int getAndIncrement() {
    for (;;) {
        int current = get();
        int next = current + 1;
        if (compareAndSet(current, next))
            return current;
    }
}
```

## 【关联/对比】

### CAS vs synchronized锁：
| 特性 | CAS | synchronized |
|------|-----|-------------|
| 实现机制 | 硬件指令 | JVM监视器锁 |
| 线程阻塞 | 无（自旋） | 有（等待队列） |
| 适用场景 | 低竞争、简单操作 | 高竞争、复杂临界区 |
| 内存语义 | 具有volatile读写特性 | 保证可见性、有序性 |
| 性能特点 | 无上下文切换开销 | 竞争激烈时性能下降 |

### CAS在JUC中的应用：
- **`AtomicInteger`**：`getAndIncrement()`内部使用Unsafe.compareAndSwapInt
- **`ConcurrentHashMap`**：JDK8中Node插入使用CAS
- **`AQS`**：同步状态state的更新
- **非阻塞算法**：实现无锁队列、栈等数据结构

## 【面试官追问】

### 高频追问1：CAS的缺点是什么？
1. **ABA问题**：已详细说明
2. **自旋开销**：高竞争下长时间循环消耗CPU
3. **单一变量**：只能保证一个共享变量的原子操作
4. **公平性问题**：可能造成线程饥饿

### 高频追问2：JDK中如何解决ABA问题？
- **`AtomicStampedReference`**：通过int版本号解决
- **`AtomicMarkableReference`**：通过boolean标记解决
- 原理：比较时同时检查值和版本号/标记

### 高频追问3：CAS在ARM架构和x86架构的实现差异？
- **x86**：直接有`CMPXCHG`指令支持
- **ARM**：早期需要`LDREX/STREX`指令对实现
- **MIPS**：使用`LL/SC`（Load-Linked/Store-Conditional）指令
- JVM通过Unsafe类屏蔽底层差异

### 高频追问4：什么情况下CAS性能优于锁？
- **低到中度竞争**：线程数少于CPU核心数时
- **操作简单**：CAS操作本身开销小
- **临界区小**：执行时间短，自旋代价低
- **NUMA架构**：避免跨节点锁通信

## 【版本差异】

### JDK 8及之前：
- 主要通过`sun.misc.Unsafe`提供CAS操作
- `Atomic`类家族基本完善
- 自旋策略相对简单

### JDK 9+：
- 引入`VarHandle`作为更安全替代
- 逐步减少对Unsafe的直接使用
- 增强的内存排序控制
- 示例：`VarHandle.compareAndSet()`

### JDK 17+：
- 进一步限制Unsafe的使用
- 强化模块化安全
- 提供标准API完成相同功能

## 【性能优化实践】

### 避免伪共享（False Sharing）：
```java
// 使用@Contended注解（JDK8+）
@sun.misc.Contended
class AtomicLongWithPadding {
    private volatile long value;
    // 自动填充缓存行
}
```

### 退避策略优化：
```java
// 指数退避减少竞争
int backoff = 1;
while (!casOperation()) {
    for (int i = 0; i < backoff; i++) {
        Thread.yield();
    }
    backoff = Math.min(backoff * 2, MAX_BACKOFF);
}
```

---

**总结要点**：CAS是并发编程的基石，理解其原理、优劣及适用场景，是区分初级和高级Java开发者的关键标志。在实际应用中，需要根据竞争程度、操作复杂度等因素，在CAS和锁之间做出合理选择。
