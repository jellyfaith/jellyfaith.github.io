---
title: "线程的生命周期在 Java 中是如何定义的？"
published: 2026-04-22
draft: false
description: ""
tags: [note]
---
# 线程的生命周期在 Java 中是如何定义的？

# 线程的生命周期在 Java 中的定义

## 【核心定义】
Java 线程的生命周期由 `java.lang.Thread.State` 枚举明确定义，包含 **NEW、RUNNABLE、BLOCKED、WAITING、TIMED_WAITING、TERMINATED** 六个状态，这些状态精确描述了线程从创建到销毁的完整过程。

## 【关键要点】
1. **NEW（新建状态）**  
   - **结论**：线程对象已创建但尚未启动。  
   - **原理**：通过 `new Thread()` 实例化后，线程处于此状态，此时系统未为其分配资源，`start()` 方法未被调用。

2. **RUNNABLE（可运行状态）**  
   - **结论**：线程正在 JVM 中执行或等待操作系统调度。  
   - **原理**：调用 `start()` 后进入此状态，包含两个子状态：**Ready（就绪）** 等待 CPU 时间片，**Running（运行）** 正在执行。注意：Java 将传统的“就绪”和“运行”合并为 RUNNABLE。

3. **BLOCKED（阻塞状态）**  
   - **结论**：线程因等待监视器锁（synchronized）而被阻塞。  
   - **原理**：当线程试图进入一个被其他线程持有的 synchronized 代码块/方法时，会进入此状态，直到锁被释放。

4. **WAITING（无限期等待）**  
   - **结论**：线程主动进入等待，直到被其他线程显式唤醒。  
   - **原理**：通过调用 `Object.wait()`、`Thread.join()`（无参）或 `LockSupport.park()` 进入，需通过 `notify()`/`notifyAll()` 或目标线程终止来唤醒。

5. **TIMED_WAITING（限期等待）**  
   - **结论**：线程在指定时间内等待。  
   - **原理**：通过 `Thread.sleep(long)`、`Object.wait(long)`、`Thread.join(long)` 或 `LockSupport.parkNanos()` 进入，超时或收到通知后自动返回 RUNNABLE。

6. **TERMINATED（终止状态）**  
   - **结论**：线程执行完毕或异常退出。  
   - **原理**：`run()` 方法正常结束或抛出未捕获异常后进入此状态，线程不可再次启动。

## 【深度推导/细节】
### 状态转换的核心逻辑与临界点
- **从 NEW 到 RUNNABLE**：仅能通过 `start()` 触发，且每个线程只能调用一次 `start()`，重复调用抛出 `IllegalThreadStateException`。
- **RUNNABLE 到 BLOCKED 的临界场景**：  
  Step 1: 线程 T1 持有对象锁 O 执行 synchronized 代码块。  
  Step 2: 线程 T2 尝试进入同一 synchronized 区域，发现锁被占用。  
  Step 3: T2 立即进入 BLOCKED 状态（注意：不同于 WAITING，BLOCKED 是被动等待锁）。
- **WAITING/TIMED_WAITING 的唤醒机制差异**：  
  - `Object.wait()` 必须由持有同一对象锁的线程调用 `notify()` 唤醒，否则抛出 `IllegalMonitorStateException`。  
  - `Thread.join()` 实质是通过 `wait()` 实现，当目标线程终止时自动调用 `notifyAll()`。
- **线程中断（Interrupt）对状态的影响**：  
  - 在 WAITING/TIMED_WAITING 状态的线程收到中断信号时，会抛出 `InterruptedException` 并清除中断标志，线程状态转为 RUNNABLE。  
  - 在 RUNNABLE 状态的线程仅设置中断标志，不会直接改变状态。

## 【关联/对比】
- **Java 线程状态 vs 操作系统线程状态**：  
  Java 的 RUNNABLE 对应操作系统的 Ready 和 Running；BLOCKED/WAITING/TIMED_WAITING 对应操作系统的 Sleeping/Waiting 等阻塞状态。Java 抽象更贴近并发编程模型。
- **BLOCKED vs WAITING 的本质区别**：  
  BLOCKED 是**被动等待锁**（进入 synchronized 时竞争失败），WAITING 是**主动释放锁并等待**（调用 wait() 时主动放弃锁）。
- **线程生命周期 vs 协程/虚拟线程（Loom 项目）**：  
  传统线程状态依赖操作系统调度，而虚拟线程由 JVM 管理调度，状态转换更轻量，BLOCKED 状态不再导致操作系统线程阻塞。

## 『面试官追问』
1. **为什么 Java 把就绪和运行都合并为 RUNNABLE？**  
   答：因为 JVM 不直接控制 CPU 时间片分配，这两者对于 Java 应用层是透明的，合并简化了状态模型。

2. **调用 `yield()` 方法后线程状态会改变吗？**  
   答：不会改变状态，`yield()` 只是提示调度器让出 CPU，线程仍保持 RUNNABLE 状态。

3. **`synchronized` 和 `ReentrantLock` 在线程状态上有何不同？**  
   答：`synchronized` 竞争失败进入 BLOCKED；`ReentrantLock.lock()` 竞争失败会使线程进入 WAITING（通过 AQS 队列），使用 `LockSupport.park()` 实现。

4. **如何诊断线程长时间处于 BLOCKED 或 WAITING 状态？**  
   答：使用 `jstack` 或 JDK Mission Control 抓取线程转储，分析锁竞争或等待条件。

5. **Java 19+ 的虚拟线程状态有何变化？**  
   答：虚拟线程新增 `CARRIER` 状态表示载体线程被占用，但用户态仍沿用传统六状态，阻塞操作不再阻塞 OS 线程。

## 【版本差异】
- **Java 5 之前**：线程状态通过 `Thread.isAlive()`、`Thread.isInterrupted()` 等布尔方法间接判断，无统一枚举。
- **Java 5+**：引入 `Thread.State` 枚举，标准化六状态模型。
- **Java 19+（预览）**：虚拟线程引入后，`Thread.getState()` 仍返回六状态之一，但底层实现完全改变，BLOCKED/WAITING 不再导致操作系统线程阻塞。

---

**总结**：掌握 Java 线程六状态及其转换条件是并发编程的基础，需重点理解 BLOCKED/WAITING 的产生场景和转换机制，这对诊断死锁、线程泄漏等问题至关重要。
