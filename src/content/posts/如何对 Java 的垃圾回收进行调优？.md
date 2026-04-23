---
title: "如何对 Java 的垃圾回收进行调优？"
published: 2026-03-02
draft: false
description: ""
tags: [note]
---
# 如何对 Java 的垃圾回收进行调优？

# 如何对 Java 的垃圾回收进行调优？

## 【核心定义】
Java 垃圾回收（GC）调优是通过调整 JVM 参数、选择合适的垃圾收集器以及优化应用程序代码，以达到特定性能目标（如低延迟、高吞吐量或最小内存占用）的系统性过程。

## 【关键要点】
1. **明确调优目标与监控先行**
   - 调优前必须明确核心指标：是追求高吞吐量（Throughput）、低延迟（Low Latency）还是最小内存足迹（Footprint）。不同目标策略迥异。
   - 必须建立监控基线。使用 `jstat`、GC 日志（`-Xlog:gc*`）、JMX 或 APM 工具（如 VisualVM, GCeasy）持续监控关键指标：GC 频率、各次 GC 暂停时间、吞吐量、堆内存各区域使用率。

2. **合理设置堆与各区域大小**
   - **初始堆（-Xms）与最大堆（-Xmx）**：通常设置为相同值，以避免运行时堆伸缩带来的额外 GC 开销。
   - **新生代（Young Gen）大小**：通过 `-Xmn` 或 `-XX:NewRatio` 设置。增大新生代可减少 Minor GC 频率，但可能增加单次暂停时间；过小则会导致对象过早晋升，增加 Full GC 压力。
   - **Survivor 区比例**：使用 `-XX:SurvivorRatio` 调整 Eden 与 Survivor 区的比例。目标是让对象在 Survivor 区经历几次 Minor GC（通过 `-XX:MaxTenuringThreshold` 控制）后，只有真正长期存活的对象才晋升到老年代。

3. **根据目标选择并配置垃圾收集器**
   - **高吞吐量优先**：选择 Parallel Scavenge + Parallel Old（JDK 8 默认）。可调整 `-XX:ParallelGCThreads`（并行线程数）和 `-XX:MaxGCPauseMillis`（目标最大暂停时间，JVM 会尽力达成）。
   - **低延迟优先**：选择 G1（JDK 9+ 默认）或 ZGC/Shenandoah。核心是调整最大暂停时间目标（G1: `-XX:MaxGCPauseMillis`，默认 200ms），并可能需增加堆内存以换取更短暂停。
   - **大堆或超大堆（>4-8G）**：优先考虑 ZGC（亚毫秒级暂停）或 Shenandoah，它们通过并发压缩等技术，几乎将停顿时间与堆大小解耦。

4. **优化 GC 触发策略与行为**
   - **避免过早晋升与过早提升**：监控老年代增长速率。若频繁 Full GC，可能是新生代过小或 `-XX:MaxTenuringThreshold` 设置不当，导致短期对象进入老年代。
   - **处理大对象**：使用 G1 时，可设置 `-XX:G1HeapRegionSize` 并配合 `-XX:G1MixedGCLiveThresholdPercent` 等参数优化混合回收。对于易产生大对象的应用，可调整 `-XX:G1HeapWastePercent` 和 `-XX:G1MixedGCCountTarget`。
   - **Full GC 优化**：Full GC 是调优重点规避对象。CMS 需设置 `-XX:CMSInitiatingOccupancyFraction`（触发百分比，如75）并开启 `-XX:+UseCMSInitiatingOccupancyOnly`，同时配合 `-XX:+CMSScavengeBeforeRemark` 减少重新标记停顿。

5. **应用程序层配合优化**
   - **减少对象分配速率**：优化代码，避免在热点循环中创建临时对象，重用对象（使用对象池需谨慎评估）。
   - **消除内存泄漏**：使用堆转储（`jmap -dump`）和内存分析器（MAT, JProfiler）定位并解决因静态集合、未关闭资源等导致的对象无法回收。
   - **调整对象生命周期**：使对象生命周期符合“朝生夕死”的理想模式，长期存活的对象应尽早稳定在老年代。

## 【深度推导/细节】
**核心矛盾：吞吐量 vs. 延迟的权衡**
- **Parallel Scavenge/Old** 采用标记-复制（新生代）和标记-整理（老年代）算法，追求高吞吐量，但进行老年代整理时会发生“Stop-The-World”的全局暂停，延迟不可控。
- **CMS** 首次尝试以并发方式收集老年代，在初始标记和重新标记阶段有短暂停顿，并发清理无停顿。但其不进行压缩，会产生碎片，最终可能触发并发模式失败（Concurrent Mode Failure），退化为一次 Serial Old 的 Full GC，造成长时间停顿。
- **G1** 将堆划分为多个固定大小的 Region，采用“标记-整理”与“复制”混合算法。其核心调优逻辑围绕 **暂停时间目标（MaxGCPauseMillis）** 展开：
  - G1 会根据目标暂停时间，动态选择回收价值最高的 Region 集合（基于“回收效率”，即垃圾多少）进行回收。
  - 增大 `-XX:G1ReservePercent` 可以为复制操作预留更多内存，降低复制失败风险。
  - 若实际暂停时间远超目标，通常需要**增大堆内存**或**降低应用分配速率**，而非单纯调低目标值。
- **ZGC/Shenandoah** 几乎将所有耗时操作（标记、转移、重定位）都并发执行，仅剩极短的起始和结束停顿。其调优更侧重于提供足够的内存（`-Xmx`）和 CPU 资源以支撑并发处理。

## 【关联/对比】
- **CMS vs. G1**：CMS 适用于中小堆、追求低延迟且能容忍碎片的场景。G1 旨在替代 CMS，在大堆（>4G）上提供更可预测的暂停，并自动进行局部压缩。
- **G1 vs. ZGC**：G1 的暂停时间仍在毫秒到百毫秒级，且与堆大小有一定关联。ZGC 将暂停时间控制在亚毫秒级（通常 <1ms），且几乎与堆大小无关，适用于超大堆（TB级）和极致低延迟场景。
- **调优与 JVM 版本**：JDK 8 默认 Parallel 收集器，调优重点在大小调整。JDK 11 默认 G1，调优重点在暂停时间目标和 Region 设置。JDK 17+ 强烈建议评估 ZGC。

## 『面试官追问』
1.  **GC 日志怎么看？如何从日志中判断问题？**
    - 答：开启 `-Xlog:gc*,gc+heap=debug,gc+age=trace:file=gc.log`。关注：① **Full GC 频率和原因**（如 `Allocation Failure`, `Metadata GC Threshold`, `System.gc()`）；② **晋升速率**（从 Young GC 日志看晋升大小）；③ **暂停时间分布**；④ **并发模式失败**（CMS）或 **疏散失败**（G1）等关键事件。

2.  **什么是卡表（Card Table）？它在 GC 中起什么作用？**
    - 答：卡表是一种**跨代引用**的**记忆集（Remembered Set）** 的具体实现。它将老年代内存划分为512字节的“卡”，并维护一个字节数组（卡表）来标记脏卡（即可能包含指向新生代引用的卡）。在 Young GC 时，只需扫描脏卡，而无需扫描整个老年代，从而**加速根枚举过程，减少停顿时间**。

3.  **调优时，为什么有时候增大堆内存反而让 GC 暂停时间变长了？**
    - 答：对于 **Parallel 或 G1** 这类需要进行部分或全部区域整理的收集器，堆内存增大会导致**单次需要扫描或移动的存活对象集（Live Set）变大**，从而增加单次 GC 的工作量。特别是如果应用存在大量**长生命周期对象**，增大堆可能只是让这些对象分散在更大空间，并未减少存活数据量，从而导致暂停时间增加。此时，调优方向应是**减少存活数据量**或换用 **ZGC** 这类停顿与堆大小无关的收集器。

4.  **如何诊断和解决 Metaspace（元空间）导致的 Full GC？**
    - 答：监控 `Metaspace` 使用量。频繁 `Metadata GC Threshold` 的 Full GC 通常是因为元空间动态增长。解决方案：① 设置 `-XX:MaxMetaspaceSize` 限制上限（但需留足余量）；② 增加 `-XX:MetaspaceSize` 初始大小，减少早期扩容GC；③ 根本解决是检查类加载器泄漏（如热部署框架、OSGi），使用 `-XX:+TraceClassLoading` 和 `-XX:+TraceClassUnloading` 辅助排查。

## 【直击痛点：关键数字与参数】
- **-XX:MaxGCPauseMillis=200 (G1默认)**：这是一个**目标值，而非承诺值**。JVM 会尽力达成，但若分配速率过高或堆过小，实际值会超标。盲目设置为极低值（如10ms）会导致 GC 过于频繁，严重降低吞吐量。
- **-XX:InitiatingHeapOccupancyPercent=45 (G1默认)**：堆占用率达到此百分比时，触发并发标记周期。**调高此值可延迟标记周期，减少 GC 开销，但可能增加并发模式失败风险**。通常与 `MaxGCPauseMillis` 联动调整。
- **-XX:ConcGCThreads**：G1/ZGC 并发阶段的线程数。默认值基于 `-XX:ParallelGCThreads` 计算。**增加此值可加快并发阶段，但会占用更多应用线程的 CPU 资源**，需在停顿时间和吞吐量间权衡。
- **0.75, 0.5, 0.25**：在 G1 的混合回收（Mixed GC）中，这些是用于选择回收老年代 Region 的阈值比例。例如，`-XX:G1MixedGCLiveThresholdPercent=85` 意味着存活对象比例高于85%的 Region 不会被纳入混合回收，避免复制开销大的 Region。

## 【逻辑复现：G1 混合回收触发逻辑】
**Step 1: 空间探测** - 在一次 Young GC 后，若整个堆的使用率超过 `InitiatingHeapOccupancyPercent`（IHOP），G1 会启动一个**并发标记周期**。
**Step 2: 标记完成** - 并发标记结束后，G1 知道了每个 Region 中的存活对象比例。
**Step 3: 回收计划** - G1 会根据 `MaxGCPauseMillis` 目标，计算在下次暂停时间内能回收多少 Region。它会优先选择**垃圾最多**（即存活比例最低）的 Region，这些 Region 主要来自 Eden 和 Survivor（年轻代），也可能包括一部分老年代 Region（即“混合回收”）。
**Step 4: 执行混合回收** - 接下来的几次 GC（次数由 `G1MixedGCCountTarget` 影响）中，G1 不仅收集年轻代 Region，还会按计划收集一部分老年代 Region，直到回收出足够空间或达到其他阈值（如 `G1HeapWastePercent`）。
