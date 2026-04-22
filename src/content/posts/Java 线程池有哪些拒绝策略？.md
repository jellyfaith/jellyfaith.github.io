---
title: "Java 线程池有哪些拒绝策略？"
published: 2026-04-22
draft: false
description: ""
tags: [note]
---
# Java 线程池有哪些拒绝策略？

# Java 线程池拒绝策略详解

## 【核心定义】
拒绝策略是当线程池的任务队列已满且工作线程数达到最大值时，用于处理新提交任务的兜底机制。

## 【关键要点】
1. **AbortPolicy（默认策略）**：直接抛出 `RejectedExecutionException` 异常，中断任务提交流程。
2. **CallerRunsPolicy**：让调用者线程（提交任务的线程）直接执行该任务，实现一种简单的负反馈。
3. **DiscardPolicy**：静默丢弃新提交的任务，不抛异常也不执行。
4. **DiscardOldestPolicy**：丢弃队列中最旧（最早）的未处理任务，然后尝试重新提交当前任务。

## 【深度推导/细节】

### 触发条件逻辑拆解
```
Step 1: 新任务提交到线程池
Step 2: 检查核心线程数 → 创建新线程或进入队列
Step 3: 队列已满 → 检查最大线程数 → 创建临时线程
Step 4: 最大线程数已满 → 触发拒绝策略
```

### 各策略设计考量
- **AbortPolicy**：最严格的策略，确保系统在过载时能立即暴露问题，避免任务堆积导致的雪崩。
- **CallerRunsPolicy**：通过让调用者参与执行，降低新任务提交速度，实现自适应限流。
- **DiscardPolicy**：适用于可丢弃的监控、日志等非关键任务。
- **DiscardOldestPolicy**：适用于时效性强的场景，用新任务替换旧任务。

## 【关联/对比】

### 与队列类型的关联
- 有界队列（ArrayBlockingQueue）：容易触发拒绝策略
- 无界队列（LinkedBlockingQueue）：理论上不会触发（除非内存耗尽）
- 同步移交队列（SynchronousQueue）：无缓冲，直接触发最大线程检查

### 自定义拒绝策略实现
```java
// 典型实现模式
RejectedExecutionHandler customHandler = (r, executor) -> {
    // 1. 记录日志
    // 2. 持久化任务到数据库
    // 3. 触发告警
    // 4. 等待后重试提交
};
```

## 『面试官追问』
1. **如何选择合适的拒绝策略？**
   - 关键业务：CallerRunsPolicy 或自定义持久化策略
   - 监控日志：DiscardPolicy
   - 需要快速失败：AbortPolicy
   - 实时数据处理：DiscardOldestPolicy

2. **为什么默认使用 AbortPolicy？**
   - 符合 "fail-fast" 设计哲学
   - 避免任务静默丢失导致的业务问题
   - 强制开发者考虑线程池容量规划

3. **在 Spring 中如何配置拒绝策略？**
   ```java
   @Bean
   public ThreadPoolTaskExecutor taskExecutor() {
       ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
       executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
       return executor;
   }
   ```

4. **拒绝策略与线程池关闭的关系？**
   - 线程池 shutdown 后，新任务会被拒绝
   - shutdownNow 会中断正在执行的任务并清空队列
   - 自定义策略可区分"过载拒绝"和"关闭拒绝"

5. **如何实现带重试的自定义拒绝策略？**
   ```java
   class RetryPolicy implements RejectedExecutionHandler {
       private int maxRetries = 3;
       
       public void rejectedExecution(Runnable r, ThreadPoolExecutor executor) {
           for (int i = 0; i < maxRetries; i++) {
               if (executor.getQueue().offer(r)) {
                   return; // 重试入队成功
               }
               try { Thread.sleep(100); } catch (InterruptedException e) { break; }
           }
           throw new RejectedExecutionException("重试失败");
       }
   }
   ```

## 【最佳实践建议】
1. **容量规划**：根据业务峰值合理设置核心/最大线程数和队列容量
2. **监控告警**：对拒绝事件进行监控和告警
3. **降级方案**：重要业务应有任务持久化或降级处理
4. **测试验证**：压测验证拒绝策略的触发和处理逻辑

## 【版本差异】
- Java 5 引入 ThreadPoolExecutor 时即包含这四种策略
- Java 8 未新增内置策略，但 Lambda 表达式使自定义策略更简洁
- 后续版本保持 API 稳定，策略实现无变化

---

**总结**：拒绝策略是线程池的"安全阀"，选择策略需综合考虑业务重要性、任务特性和系统容错能力。实际开发中，建议根据业务场景定制合适的拒绝策略，并配合完善的监控体系。
