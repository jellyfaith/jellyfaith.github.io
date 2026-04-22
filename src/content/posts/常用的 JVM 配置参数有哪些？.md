---
title: "常用的 JVM 配置参数有哪些？"
published: 2026-04-22
draft: false
description: ""
tags: [note]
---
# 常用的 JVM 配置参数有哪些？

# JVM 配置参数详解

## 【核心定义】
JVM 配置参数是用于调整 Java 虚拟机运行时行为、性能优化和故障排查的各类选项，主要包括标准参数、非标准参数（-X）和非稳定参数（-XX）三大类。

## 【关键要点】
1. **堆内存配置**：控制 JVM 堆内存的分配与使用
   - `-Xms`：初始堆大小（默认物理内存1/64）
   - `-Xmx`：最大堆大小（默认物理内存1/4）
   - `-Xmn`：新生代大小（推荐为堆的1/3~1/2）

2. **垃圾回收器选择**：指定不同的垃圾回收算法实现
   - `-XX:+UseSerialGC`：串行收集器（Client模式默认）
   - `-XX:+UseParallelGC`：并行收集器（Server模式默认）
   - `-XX:+UseConcMarkSweepGC`：CMS收集器（JDK 9前）
   - `-XX:+UseG1GC`：G1收集器（JDK 9+默认）

3. **GC日志配置**：记录垃圾回收详细信息用于分析
   - `-XX:+PrintGCDetails`：打印GC详细信息
   - `-Xloggc:<file>`：GC日志输出到文件
   - `-XX:+PrintGCDateStamps`：打印GC时间戳

4. **元空间配置**：控制方法区（元空间）内存
   - `-XX:MetaspaceSize`：初始元空间大小
   - `-XX:MaxMetaspaceSize`：最大元空间大小（默认无限制）

5. **线程栈配置**：控制线程栈内存分配
   - `-Xss`：每个线程的栈大小（默认1MB）

## 【深度推导/细节】

### 堆内存配置的临界点设计
- **-Xms与-Xmx设置相同值**：避免堆内存动态调整带来的性能抖动，适合生产环境
- **新生代比例（-Xmn）**：新生代过小导致频繁Minor GC，过大则老年代空间不足引发Full GC
- **Survivor区比例**：`-XX:SurvivorRatio=8`表示Eden:Survivor=8:1，每个Survivor占新生代1/10

### 垃圾回收器选择逻辑
```
Step 1: 根据应用特点选择GC类型
    - 低延迟应用 → G1/CMS
    - 高吞吐应用 → Parallel GC
    
Step 2: 配置GC参数
    - Parallel GC: -XX:MaxGCPauseMillis=200（最大停顿时间）
    - G1 GC: -XX:G1HeapRegionSize=2m（区域大小）
    
Step 3: 监控调整
    - 观察GC日志中的Full GC频率
    - 调整新生代/老年代比例
```

### 元空间内存管理
- **MetaspaceSize**：首次超过此阈值触发Full GC进行类卸载
- **MaxMetaspaceSize**：防止元空间无限增长导致内存泄漏
- **关键数字**：默认MetaspaceSize=20.8MB，CompressedClassSpaceSize=1GB

## 【关联/对比】

### 不同JDK版本的参数变化
| 参数 | JDK 8及之前 | JDK 9+ | 变化原因 |
|------|------------|--------|----------|
| 默认GC | Parallel GC | G1 GC | G1提供更均衡的吞吐/延迟 |
| 元空间 | PermGen | Metaspace | 避免PermGen OOM，支持动态扩展 |
| 日志系统 | PrintGCDetails | Xlog | 统一日志框架，更灵活配置 |

### 生产环境常用配置组合
```bash
# 高并发Web应用配置
-Xms4g -Xmx4g -Xmn2g 
-XX:+UseG1GC 
-XX:MaxGCPauseMillis=200
-XX:ParallelGCThreads=4
-XX:ConcGCThreads=2
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/path/to/dump.hprof
```

## 『面试官追问』

### 可能追问的问题：
1. **如何确定合适的堆大小？**
   - 监控工具分析：通过JMX、jstat观察老年代使用率
   - 经验公式：最大堆=系统内存×70%（预留OS和其他进程）
   - 压力测试：模拟峰值流量，观察GC频率和停顿时间

2. **G1和CMS的主要区别？**
   - 内存布局：G1分Region，CMS分代连续
   - 回收算法：G1标记整理，CMS标记清除（有碎片）
   - 停顿目标：G1可预测停顿，CMS不可控
   - 适用场景：G1适合大堆（>4GB），CMS适合中小堆

3. **如何排查内存泄漏？**
   ```bash
   # 1. 开启内存溢出时堆转储
   -XX:+HeapDumpOnOutOfMemoryError
   
   # 2. 使用jmap手动转储
   jmap -dump:live,format=b,file=heap.bin <pid>
   
   # 3. 分析工具：MAT、JProfiler、VisualVM
   ```

4. **ZGC和Shenandoah的配置参数？**
   - ZGC：`-XX:+UseZGC -XX:MaxGCPauseMillis=10`
   - Shenandoah：`-XX:+UseShenandoahGC -XX:ShenandoahGCHeuristics=adaptive`
   - 共同特点：亚毫秒停顿，适合超大堆（TB级）

### 性能调优实战参数
```bash
# 电商大促场景配置
-Xms16g -Xmx16g                  # 堆固定大小，避免扩容
-XX:+UseG1GC                     # 低延迟GC
-XX:MaxGCPauseMillis=100         # 目标停顿100ms
-XX:InitiatingHeapOccupancyPercent=45  # 触发并发标记阈值
-XX:ParallelGCThreads=8          # 并行线程数（CPU核心数）
-XX:ConcGCThreads=2              # 并发线程数
-XX:G1ReservePercent=15          # 预留空间避免Evacuation失败
-XX:+PrintAdaptiveSizePolicy     # 打印自适应调整日志
-XX:+UnlockExperimentalVMOptions # 实验性参数（如需要）
```

### 关键数字记忆点
- **8/6**：Parallel GC默认线程数=CPU核心数≤8？核心数：8+(核心数-8)×5/8
- **45%**：G1触发并发标记的堆占用率阈值（IHOP）
- **2048**：G1 Region大小范围1MB~32MB，必须是2的幂
- **15**：对象晋升老年代的年龄阈值（-XX:MaxTenuringThreshold）

通过合理配置这些参数，可以在不同应用场景下实现性能最优的JVM运行环境。实际配置需要结合具体硬件资源、应用特性和性能监控数据进行动态调整。
