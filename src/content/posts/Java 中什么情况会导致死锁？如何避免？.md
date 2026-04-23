---
title: "Java 中什么情况会导致死锁？如何避免？"
published: 2026-04-08
draft: false
description: ""
tags: [note]
---
# Java 中什么情况会导致死锁？如何避免？

# Java 死锁问题详解

## 【核心定义】
死锁是指两个或两个以上的线程在执行过程中，因争夺资源而造成的**相互等待**的现象，若无外力干涉，这些线程都将无法继续执行。

## 【关键要点】
1. **死锁产生的四个必要条件**（必须同时满足）：
   - **互斥条件**：资源在同一时间只能被一个线程占用。
   - **请求与保持条件**：线程在持有至少一个资源的同时，又请求其他线程持有的资源。
   - **不可剥夺条件**：线程已获得的资源在未使用完之前，不能被其他线程强行抢占。
   - **循环等待条件**：存在一个线程-资源的循环等待链（T1等待T2的资源，T2等待T1的资源）。

2. **Java中典型的死锁场景**：
   - 同步代码块/方法嵌套，且获取锁的顺序不一致。
   - 使用显式锁（`ReentrantLock`）时，未按固定顺序获取锁。
   - 线程间通信（如`wait/notify`）使用不当，导致相互等待。

3. **死锁的检测与定位**：
   - 使用`jstack`命令导出线程堆栈，查找`"deadlock"`关键词和`BLOCKED`状态线程。
   - 使用JConsole、VisualVM等可视化工具检测死锁。
   - 代码中增加超时机制和锁获取日志。

## 【深度推导/细节】

### 经典死锁代码示例与逻辑拆解
```java
public class DeadLockDemo {
    private static final Object lockA = new Object();
    private static final Object lockB = new Object();
    
    public static void main(String[] args) {
        new Thread(() -> {
            synchronized (lockA) {      // Step 1: 线程1获取lockA
                try { Thread.sleep(50); } catch (InterruptedException e) {}
                synchronized (lockB) {  // Step 3: 线程1尝试获取lockB（但已被线程2持有）
                    System.out.println("Thread1 got both locks");
                }
            }
        }).start();
        
        new Thread(() -> {
            synchronized (lockB) {      // Step 2: 线程2获取lockB
                try { Thread.sleep(50); } catch (InterruptedException e) {}
                synchronized (lockA) {  // Step 4: 线程2尝试获取lockA（但已被线程1持有）
                    System.out.println("Thread2 got both locks");
                }
            }
        }).start();
    }
}
```

**死锁发生的时间线**：
- **T0时刻**：线程1获取lockA，线程2获取lockB
- **T1时刻**：线程1尝试获取lockB（需等待线程2释放）
- **T2时刻**：线程2尝试获取lockA（需等待线程1释放）
- **结果**：双方相互等待，形成循环等待链

## 【关联/对比】

### synchronized vs ReentrantLock 的死锁特性对比
| 特性 | synchronized（内置锁） | ReentrantLock（显式锁） |
|------|----------------------|-----------------------|
| 死锁检测 | 依赖JVM和外部工具 | 可通过`tryLock()`主动避免 |
| 中断响应 | 不支持 | 支持`lockInterruptibly()` |
| 超时机制 | 不支持 | 支持`tryLock(timeout, unit)` |
| 锁排序 | 需手动保证顺序 | 可通过`System.identityHashCode()`辅助排序 |

### 死锁 vs 活锁 vs 饥饿
- **死锁**：线程相互等待，完全阻塞
- **活锁**：线程不断重试相同操作但始终失败（如两个线程互相让路）
- **饥饿**：某些线程长期得不到执行机会（如优先级设置不当）

## 【避免死锁的实践方案】

### 1. 破坏循环等待条件（最有效）
```java
// 方案：统一锁的获取顺序
public void transfer(Account from, Account to, int amount) {
    Object firstLock = from.id < to.id ? from : to;
    Object secondLock = from.id < to.id ? to : from;
    
    synchronized (firstLock) {
        synchronized (secondLock) {
            // 业务逻辑
        }
    }
}
```

### 2. 使用超时机制（ReentrantLock专属）
```java
private ReentrantLock lockA = new ReentrantLock();
private ReentrantLock lockB = new ReentrantLock();

public boolean tryTransfer() {
    try {
        if (lockA.tryLock(100, TimeUnit.MILLISECONDS)) {
            try {
                if (lockB.tryLock(100, TimeUnit.MILLISECONDS)) {
                    try {
                        // 业务逻辑
                        return true;
                    } finally {
                        lockB.unlock();
                    }
                }
            } finally {
                lockA.unlock();
            }
        }
        return false;
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
        return false;
    }
}
```

### 3. 使用开放调用（避免嵌套同步）
```java
// 不推荐：方法级同步导致锁范围过大
public synchronized void methodA() {
    methodB(); // 可能产生嵌套锁
}

// 推荐：缩小同步范围
public void methodA() {
    synchronized(this) {
        // 仅同步必要部分
    }
    methodB(); // 在同步块外调用
}
```

### 4. 银行家算法（资源分配策略）
- 预先声明每个线程所需的最大资源数
- 系统进行安全性检查后再分配资源
- 在Java中可通过`Semaphore`模拟实现

## 【线程安全容器的死锁规避】
- **ConcurrentHashMap**：分段锁减少锁竞争
- **CopyOnWriteArrayList**：读写分离，写时复制
- **BlockingQueue**：生产者-消费者模式解耦

## 『面试官追问』

### Q1：除了代码层面的死锁，还有哪些场景会导致死锁？
- **数据库死锁**：事务中更新顺序不一致
- **文件系统死锁**：进程相互等待对方持有的文件句柄
- **网络通信死锁**：双方都在等待对方先发送数据
- **资源池死锁**：所有线程都在等待池中的资源，但资源已被等待的线程占用

### Q2：如何设计一个死锁检测系统？
1. **资源分配图建模**：将线程和资源建模为有向图
2. **定期扫描**：定时检测图中是否存在环
3. **恢复策略**：
   - 剥夺资源：强制释放某个线程持有的资源
   - 回滚操作：让某个线程回退到安全状态
   - 终止线程：强制终止死锁环中的一个或多个线程

### Q3：synchronized和Lock在死锁处理上有何本质区别？
**synchronized**的死锁处理是**被动**的：
- 完全依赖JVM检测
- 无法从外部中断等待
- 必须重启JVM才能解除

**ReentrantLock**的死锁处理是**主动**的：
- 可设置获取锁的超时时间
- 支持响应中断的获取方式
- 可实现锁的公平性策略减少饥饿

### Q4：什么是哲学家就餐问题？Java中如何解决？
**问题描述**：5个哲学家围坐，每人需要两把叉子才能吃饭，但只有5把叉子。

**Java解决方案**：
```java
// 方案1：破坏循环等待（最多允许4人同时拿叉子）
Semaphore table = new Semaphore(4);

// 方案2：资源分级（给叉子编号，必须按顺序获取）
public void eat(int philosopherId) {
    int left = philosopherId;
    int right = (philosopherId + 1) % 5;
    
    if (philosopherId % 2 == 0) { // 偶数哲学家先拿右边
        synchronized(forks[right]) {
            synchronized(forks[left]) {
                // 吃饭
            }
        }
    } else { // 奇数哲学家先拿左边
        synchronized(forks[left]) {
            synchronized(forks[right]) {
                // 吃饭
            }
        }
    }
}
```

## 【最佳实践总结】
1. **锁排序**：始终按固定全局顺序获取锁
2. **超时控制**：使用`tryLock`替代无条件等待
3. **锁粒度**：尽量减小锁的作用范围和持有时间
4. **无锁编程**：考虑使用`Atomic`类、`ConcurrentHashMap`等无锁数据结构
5. **代码审查**：重点检查嵌套的同步块和跨方法的锁调用
6. **监控预警**：在生产环境部署死锁检测和告警机制

## 【版本差异】
- **Java 5之前**：只能使用`synchronized`，死锁处理能力有限
- **Java 5**：引入`java.util.concurrent`包，提供显式锁和高级同步器
- **Java 8**：`CompletableFuture`等异步编程减少锁竞争
- **Java 21**：虚拟线程（Virtual Threads）通过轻量级线程减少资源竞争

通过理解死锁的本质条件，采用预防性编程策略，并结合现代Java并发工具，可以显著降低死锁发生的概率，构建高可用的并发系统。
