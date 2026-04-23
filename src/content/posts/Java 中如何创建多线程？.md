---
title: "Java 中如何创建多线程？"
published: 2026-04-09
draft: false
description: ""
tags: [note]
---
# Java 中如何创建多线程？

# Java 中如何创建多线程？

## 【核心定义】
Java 中创建多线程的本质是让一个任务（Runnable 或 Callable）在独立的执行路径上并发运行，主要可通过继承 `Thread` 类、实现 `Runnable` 接口、实现 `Callable` 接口结合 `ExecutorService` 线程池，以及利用 `CompletableFuture` 这四种核心方式实现。

## 【关键要点】
1. **继承 Thread 类**：重写 `run()` 方法，通过 `start()` 启动线程。这是最基础的方式，但**不推荐**，因为 Java 是单继承，限制了类的扩展性。
2. **实现 Runnable 接口**：实现 `run()` 方法，将 `Runnable` 实例作为 `Thread` 构造器的参数。这是**最常用且推荐**的方式，实现了任务与线程执行体的解耦，更灵活。
3. **实现 Callable 接口**：实现 `call()` 方法，该方法可以**返回结果**并**抛出异常**。通常需要配合 `ExecutorService` 线程池（如 `FutureTask` 或 `submit` 方法）来执行。
4. **使用 ExecutorService 线程池**：这是**企业级开发的标准做法**。通过 `Executors` 工具类或直接创建 `ThreadPoolExecutor` 来管理线程生命周期，避免频繁创建/销毁线程的开销，提升性能。

## 【深度推导/细节】
### 为什么推荐 Runnable 而非继承 Thread？
*   **设计原则**：`Runnable` 是一个函数式接口，只定义了任务（`run` 方法）。`Thread` 类是任务的执行者和线程资源的管理者。使用 `Runnable` 符合**单一职责原则**（任务与执行分离）和**组合优于继承**原则。
*   **资源共享**：多个线程可以共享同一个 `Runnable` 实例（任务），方便地共享数据。而继承 `Thread` 时，每个线程是独立的对象，共享数据更复杂。
*   **扩展性**：Java 不支持多继承，实现了 `Runnable` 的类还可以继承其他类，灵活性更高。

### 线程池的核心优势与工作原理
1.  **降低资源消耗**：复用已创建的线程，避免频繁创建和销毁。
2.  **提高响应速度**：任务到达时，若有空闲线程可立即执行，无需等待线程创建。
3.  **提供管理能力**：可控制并发数、队列策略、拒绝策略等。
    *   **核心流程**：提交任务 -> 核心线程未满则创建新线程执行 -> 核心线程已满则放入工作队列 -> 队列已满且最大线程数未满则创建临时线程 -> 所有条件均满则触发拒绝策略。

### Callable 与 Runnable 的核心区别
| 特性 | Runnable | Callable |
| :--- | :--- | :--- |
| **方法签名** | `void run()` | `V call() throws Exception` |
| **返回值** | 无 | 有，类型为泛型 `V` |
| **异常处理** | 只能内部消化，无法抛出 | 可以抛出受检异常 |
| **使用方式** | 直接给 `Thread` 或提交给线程池的 `execute` | 必须提交给线程池的 `submit` 方法，返回 `Future` 对象 |

## 【关联/对比】
*   **Thread vs Runnable**：如上所述，是“继承”与“实现”、“执行者与任务绑定”与“执行者与任务分离”的区别。
*   **Runnable vs Callable**：核心是“无返回/无异常抛出”与“有返回/可抛异常”的区别，决定了它们与线程池交互方式的不同。
*   **直接 new Thread() vs 线程池**：前者是原始的、资源管理粗放的方式；后者是资源池化、管理精细的工业级实践。在**高并发场景下，必须使用线程池**来避免系统资源耗尽。
*   **Future vs CompletableFuture**：`Future` 是获取 `Callable` 异步结果的传统方式，但获取结果（`get()`）是阻塞的。`CompletableFuture`（Java 8+）提供了更强大的异步编程能力，支持非阻塞回调、组合多个异步任务、异常处理等，是现代响应式编程的基础。

## 『面试官追问』
1.  **`start()` 和 `run()` 方法有什么区别？**
    *   `run()` 只是普通的方法调用，会在当前线程中同步执行。
    *   `start()` 会**启动一个新的线程**，由JVM调用该新线程的 `run()` 方法，实现异步执行。这是**本质区别**。
2.  **线程池有哪几种，`ThreadPoolExecutor` 的核心参数是什么？**
    *   常见线程池：`FixedThreadPool`（固定大小）、`CachedThreadPool`（可缓存）、`SingleThreadExecutor`（单线程）、`ScheduledThreadPool`（定时）。
    *   `ThreadPoolExecutor` 核心7参数：
        1.  `corePoolSize`：核心线程数，即使空闲也不会被回收（除非 `allowCoreThreadTimeOut` 为 true）。
        2.  `maximumPoolSize`：最大线程数。
        3.  `keepAliveTime` + `unit`：非核心线程空闲存活时间。
        4.  `workQueue`：任务队列（如 `ArrayBlockingQueue`, `LinkedBlockingQueue`, `SynchronousQueue`）。
        5.  `threadFactory`：线程工厂，用于创建线程。
        6.  `handler`：拒绝策略（`AbortPolicy` 抛异常、`CallerRunsPolicy` 调用者运行、`DiscardPolicy` 丢弃、`DiscardOldestPolicy` 丢弃最老任务）。
3.  **如何获取线程的执行结果？**
    *   对于 `Runnable`：无法直接获取，需通过共享变量或回调等间接方式。
    *   对于 `Callable`：通过 `Future` 对象。使用 `ExecutorService.submit(Callable)` 返回 `Future`，然后通过 `future.get()` 阻塞获取结果，或 `future.isDone()` 轮询状态。
    *   更优方案：使用 `CompletableFuture`，通过 `thenApply`, `thenAccept` 等回调非阻塞地处理结果。
4.  **如何在 Spring 项目中优雅地使用多线程？**
    *   通常配置一个自定义的 `ThreadPoolTaskExecutor` Bean，通过 `@Async` 注解来异步执行方法。需要注意线程池参数的合理配置（如根据CPU核心数设置大小）以及异常处理。

## 【版本差异与演进】
*   **Java 5 之前**：主要依靠 `Thread` 和 `Runnable`。
*   **Java 5**：引入了 `java.util.concurrent` 包，带来了 `Callable`、`Future`、`ExecutorService` 线程池框架，以及 `Lock`、`Condition` 等高级并发工具，这是Java并发编程的一次重大升级。
*   **Java 7**：引入了 `ForkJoinPool`，支持分治任务的并行执行。
*   **Java 8**：引入了 `CompletableFuture` 和 `Stream API` 的并行流，极大地简化了异步和并行编程模型，是当前的主流选择。
*   **Java 21 (LTS)**：引入了**虚拟线程（Virtual Threads）**，这是颠覆性的改变。虚拟线程由JVM管理，映射到少量平台线程（载体线程）上执行，可以极低成本地创建数百万个并发虚拟线程，用于处理大量I/O密集型任务，旨在简化高吞吐量并发应用的开发，无需复杂线程池调优。创建方式：`Thread.ofVirtual().start(runnable)` 或 `Executors.newVirtualThreadPerTaskExecutor()`。
