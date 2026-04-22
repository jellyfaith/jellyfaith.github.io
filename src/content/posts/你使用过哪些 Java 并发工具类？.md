---
title: "你使用过哪些 Java 并发工具类？"
published: 2026-04-22
draft: false
description: ""
tags: [note]
---
# 你使用过哪些 Java 并发工具类？

【核心定义】
Java 并发工具类是 `java.util.concurrent` 包下提供的一系列用于简化多线程编程、提升并发性能与安全性的高级同步器与容器。

【关键要点】
1. **同步器 (Synchronizers)**：用于控制多个线程间的执行顺序与协作。
   *   **`CountDownLatch`**：一次性栅栏，允许一个或多个线程等待其他一组线程完成操作。
   *   **`CyclicBarrier`**：可循环使用的栅栏，让一组线程相互等待至一个公共屏障点。
   *   **`Semaphore`**：信号量，控制同时访问特定资源的线程数量（许可机制）。
   *   **`Exchanger`**：允许两个线程在汇合点交换数据。

2. **线程安全容器 (Concurrent Collections)**：替代传统的同步容器（如 `Collections.synchronizedMap`），提供更高的并发性能。
   *   **`ConcurrentHashMap`**：分段锁（JDK 7）或 CAS + synchronized（JDK 8+）实现的高并发哈希表。
   *   **`CopyOnWriteArrayList`**：写时复制列表，读操作无锁，适用于读多写少的场景。
   *   **`BlockingQueue`** 接口及其实现（如 `ArrayBlockingQueue`, `LinkedBlockingQueue`, `PriorityBlockingQueue`, `SynchronousQueue`）：支持阻塞操作的队列，是生产者-消费者模型的核心。
   *   **`ConcurrentLinkedQueue`**：基于 CAS 实现的高性能无界非阻塞队列。

3. **执行框架 (Executor Framework)**：将任务的提交与执行解耦，管理线程生命周期。
   *   **`ExecutorService`** 及其线程池实现（如 `ThreadPoolExecutor`, `ScheduledThreadPoolExecutor`）。
   *   **`Future`** 与 **`Callable`**：用于获取异步任务的结果。
   *   **`CompletableFuture`** (JDK 8+)：更强大的异步编程工具，支持流式调用和组合多个异步任务。

4. **原子变量类 (Atomic Variables)**：基于 CAS（Compare-And-Swap）操作，提供对单个变量的无锁线程安全访问，如 `AtomicInteger`, `AtomicReference`, `LongAdder` (JDK 8+)。

【深度推导/细节】
以 **`ConcurrentHashMap` 在 JDK 8 中的优化**为例，说明其如何解决高并发下的性能与安全问题：
*   **核心矛盾**：传统 `HashMap` 非线程安全，而 `Hashtable` 或 `Collections.synchronizedMap` 使用对象级锁，并发度低。
*   **解决方案演进**：
    *   **JDK 7**：采用**分段锁（Segment）**，将数据分成多个段，每段独立加锁，提升并发度。
    *   **JDK 8 及以后**：摒弃分段锁，采用 **`Node` 数组 + 链表/红黑树** 结构。
        *   **插入逻辑（`putVal`）**：
            *   **Step 1**: 计算 key 的 hash，定位到数组下标。如果桶为空，则尝试用 **CAS** 插入新节点（无锁化）。
            *   **Step 2**: 如果桶不为空（发生哈希碰撞），则**对桶的头节点使用 `synchronized` 加锁**。在锁内进行链表遍历或树遍历，执行插入或更新。
            *   **Step 3**: 判断是否需要将链表转换为红黑树（链表长度 >= `TREEIFY_THRESHOLD=8` 且数组长度 >= `MIN_TREEIFY_CAPACITY=64`）。
        *   **扩容逻辑**：支持多线程并发协助扩容，通过给每个线程分配迁移区间，提高扩容效率。

【关联/对比】
*   **`HashMap` vs `ConcurrentHashMap`**：前者非线程安全，在并发 `put` 时可能引发**死循环**（JDK 7 头插法导致）或数据丢失；后者通过分段锁或 CAS+synchronized 保证线程安全。
*   **`ConcurrentHashMap` vs `Hashtable`**：后者对整个数组加锁，并发度低；前者锁粒度更细，并发性能高。
*   **`synchronized` vs `ReentrantLock`**：前者是 JVM 内置锁，自动释放；后者是 API 层面的锁，更灵活（可中断、可设置超时、公平/非公平、支持多个条件变量）。
*   **`AtomicLong` vs `LongAdder`**：高并发下，前者对单一变量进行 CAS 竞争激烈；后者采用**分段累加（Cell[]）**思想，最后汇总结果，写性能更高，但读可能不绝对实时。

『面试官追问』：
1.  **`CountDownLatch` 和 `CyclicBarrier` 有什么区别？**
    *   `CountDownLatch` 计数器一次性使用，由第三方（主线程）控制等待；`CyclicBarrier` 计数器可重置，由一组线程自身相互等待，并可设置到达屏障后的动作（`Runnable`）。
2.  **`ThreadPoolExecutor` 的核心参数有哪些？工作流程是怎样的？**
    *   核心参数：`corePoolSize`, `maximumPoolSize`, `keepAliveTime`, `workQueue`, `threadFactory`, `handler` (拒绝策略)。
    *   工作流程：提交任务 -> 核心池未满则创建新线程 -> 核心池已满则入队 -> 队列已满且线程数未达最大则创建非核心线程 -> 队列已满且线程数已达最大则执行拒绝策略。
3.  **`ConcurrentHashMap` 在 JDK 8 中为什么用 `synchronized` 替换 `ReentrantLock`？**
    *   **锁粒度降低**：锁的是单个桶的头节点，而非整个段，竞争概率更低。
    *   **JVM 优化**：`synchronized` 在 JDK 6 后进行了大量优化（偏向锁、轻量级锁、自旋锁、锁消除、锁粗化），性能与 `ReentrantLock` 接近甚至在某些场景更优。
    *   **减少内存开销**：`ReentrantLock` 需要额外的 API 和数据结构支持，而 `synchronized` 是 JVM 内置支持，更轻量。
4.  **`volatile` 关键字的作用是什么？它能保证原子性吗？**
    *   作用：保证变量的**可见性**（一个线程修改后，新值立即对其他线程可见）和**禁止指令重排序**。
    *   不能保证原子性。例如 `i++` 操作，`volatile` 只能保证读取和写入 `i` 时是最新值，但 `++` 操作本身（读-改-写）不是原子的。

【直击痛点】
*   **`ConcurrentHashMap` 的负载因子 `0.75`**：权衡时间与空间。过高（如0.9）减少空间开销但增加哈希冲突，导致链表变长，查询性能下降；过低（如0.5）减少冲突但增加扩容频率，空间利用率低。0.75是数学推导（泊松分布）与经验值的平衡点。
*   **链表转红黑树的阈值 `8` 与退化阈值 `6`**：基于泊松分布，在合理的哈希函数下，链表长度达到8的概率极低（约千万分之六）。设置阈值8是为了在极端情况下（哈希函数劣化或恶意攻击）将查询复杂度从O(n)降为O(log n)。设置退化阈值6（而非7）是为了避免频繁的转换抖动。
*   **最小树化容量 `64`**：在数组容量较小时，应优先选择扩容（`resize`）来分散节点，而非将链表转为红黑树，因为红黑树节点占用空间是普通链表节点的两倍。容量小时，扩容成本相对较低。

【版本差异】
*   **JDK 5**：引入了 `java.util.concurrent` 包的基础，如 `ConcurrentHashMap` (分段锁版)、`CountDownLatch`、`Semaphore`、`ThreadPoolExecutor`。
*   **JDK 6**：对 `synchronized` 进行了锁优化（偏向锁、轻量级锁）。
*   **JDK 7**：引入了 `Fork/Join` 框架（`ForkJoinPool`），用于并行执行可分解的任务。
*   **JDK 8**：
    *   `ConcurrentHashMap` 重构为 CAS + `synchronized`。
    *   引入 `CompletableFuture`、`LongAdder`、`StampedLock`（优化读性能的锁）。
    *   `HashMap` 底层链表在哈希冲突时改为尾插法，解决了 JDK 7 中可能出现的死循环问题。
*   **JDK 9+**：持续优化并发性能，并引入更多响应式编程相关的 Flow API 等。
