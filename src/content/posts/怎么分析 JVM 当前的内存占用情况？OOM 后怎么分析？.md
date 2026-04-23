---
title: "怎么分析 JVM 当前的内存占用情况？OOM 后怎么分析？"
published: 2026-01-25
draft: false
description: ""
tags: [note]
---
# 怎么分析 JVM 当前的内存占用情况？OOM 后怎么分析？

# JVM 内存占用分析与 OOM 问题排查

## 【核心定义】
通过 JVM 提供的监控工具和命令行参数，实时观测堆内存、非堆内存及各内存区域的分配与使用情况，并在发生 OutOfMemoryError 时，结合内存快照和日志进行根因定位。

## 【关键要点】
1. **实时监控工具**：使用 `jstat`、`jmap`、`jcmd` 等命令行工具，或 VisualVM、JConsole、Arthas 等图形化/命令行诊断工具，实时查看各内存池（Eden、Survivor、Old Gen、Metaspace）的使用量、峰值及 GC 频率。
2. **内存溢出（OOM）类型识别**：OOM 错误后附带的具体信息（如 `Java heap space`、`Metaspace`、`Unable to create new native thread`）直接指明了溢出区域，是首要分析线索。
3. **内存快照（Heap Dump）分析**：在 OOM 发生时或发生后立即触发 Heap Dump（`-XX:+HeapDumpOnOutOfMemoryError`），使用 MAT、JProfiler 等工具分析对象占用、GC Roots 引用链，定位内存泄漏点。
4. **GC 日志分析**：开启详细 GC 日志（`-Xlog:gc*` 或 `-XX:+PrintGCDetails`），通过日志中的前后内存变化、Full GC 频率及效果，判断是内存泄漏还是单纯的内存不足。

## 【深度推导/细节】

### 内存占用分析流程拆解
**Step 1：确定分析目标与工具选择**
* 若需**实时监控趋势**，选用 `jstat -gc <pid> 1000`（每秒刷新）或 JConsole 可视化图表。
* 若需**瞬间内存快照**，使用 `jmap -heap <pid>` 查看堆配置与使用概览，或 `jmap -histo <pid>` 查看对象实例数排名。
* 生产环境推荐使用 **Arthas** 的 `dashboard`、`heapdump` 命令，无需预装，动态附着诊断。

**Step 2：关键指标解读与健康度判断**
* **堆内存**：关注 `Old Gen` 使用率是否持续上升且 Full GC 后回收效果差（内存泄漏迹象）。`Eden` 区增长率结合 `Young GC` 频率可判断对象创建速率。
* **非堆内存**：`Metaspace` 或 `CCS` 使用率若持续增长，可能存在类加载器泄漏或大量动态类生成（如 CGLib 代理）。
* **直接内存**：通过 `jcmd <pid> VM.native_memory` 查看 `Internal (malloc)` 部分，若持续增长且与堆内存增长不匹配，可能存在堆外内存泄漏（如 Netty 的 `DirectByteBuffer` 未释放）。

**Step 3：结合 GC 日志进行动态分析**
* 在日志中搜索 **`Full GC`** 关键字，观察每次 Full GC 后老年代内存是否显著下降。若下降有限，则可能存在**强引用持有**的大对象或集合。
* 观察 **`Metaspace`** 相关 GC 日志，若出现 `Metaspace` 的 Full GC 且回收量小，则可能存在类元数据泄漏。

### OOM 后分析流程拆解
**Step 1：立即保存现场**
* 若已配置 `-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/path/to/dump.hprof`，则自动生成堆转储文件。
* 若未配置，在 OOM 发生后尽快（避免进程重启）使用 `jmap -dump:live,format=b,file=dump.hprof <pid>` 手动抓取快照（注意：`live` 会触发 Full GC）。
* 同时保存对应的 **GC 日志文件** 和 **应用日志文件**（记录 OOM 发生时间点及上下文）。

**Step 2：使用 MAT 进行泄漏嫌疑分析**
1. 打开 Heap Dump 文件，首先查看 **Leak Suspects Report**（泄漏嫌疑报告），MAT 会自动分析出占用内存最大的对象及可能的原因。
2. 若报告不明确，使用 **Histogram** 功能，按 `Shallow Heap` 或 `Retained Heap` 排序，找出数量异常或体积巨大的对象类（如 `char[]`、`String`、自定义业务对象）。
3. 对可疑类右键选择 **Merge Shortest Paths to GC Roots** -> **exclude all phantom/weak/soft etc. references**，仅保留强引用链，查看是哪个 GC Root 路径持有了这些对象，导致无法回收。
4. 对于集合类（如 `HashMap`、`ArrayList`），可使用 **Group By `outgoing references`** 功能，查看集合内部具体存放了哪些数据。

**Step 3：交叉验证与根因定位**
* 将 Heap Dump 中发现的**疑似泄漏对象**（如某个一直增长的 `HashMap`）与**应用日志**中的业务操作（如“用户查询”、“数据加载”）时间点进行关联，定位触发泄漏的代码路径。
* 检查代码中是否存在：
    * **静态集合**（如 `static Map`）长期添加而未清理。
    * **缓存**实现未设置大小限制或过期策略。
    * **线程局部变量**（`ThreadLocal`）使用后未调用 `remove()`，尤其在线程池场景下。
    * **资源未关闭**（如数据库连接、文件流、网络连接）。

## 【关联/对比】
* **`jstat` vs `jmap`**：`jstat` 侧重于**动态趋势**监控（如 GC 时间、各分区容量变化），轻量且对进程影响小；`jmap` 侧重于**静态快照**获取（如堆内存详情、生成 Dump 文件），某些操作（如 `dump`）会暂停应用线程。
* **MAT vs JProfiler**：MAT 是**离线深度分析**利器，尤其擅长内存泄漏的引用链分析，功能强大且免费；JProfiler 更侧重于**实时在线 profiling**，集成了 CPU、内存、线程等多维度监控，但属于商业软件。
* **OOM vs StackOverflowError**：OOM 发生在**堆或元空间等数据区**，通常由对象数量过多或过大引起；StackOverflowError 发生在**虚拟机栈**，由方法调用层次过深（如无限递归）导致，两者错误区域和根因完全不同。

## 『面试官追问』
1. **除了 Heap Dump，还有哪些手段可以辅助分析内存问题？**
   * **GC 日志分析工具**：如 GCeasy、GCE Viewer，可自动化分析 GC 日志，生成吞吐量、暂停时间、内存提升率等报告。
   * **Native Memory Tracking (NMT)**：使用 `-XX:NativeMemoryTracking=detail` 开启，通过 `jcmd <pid> VM.native_memory detail` 追踪 JVM 自身内存使用（堆、栈、代码区、GC等），用于诊断非堆的 native 内存泄漏。
   * **操作系统级工具**：在 Linux 下，使用 `pmap -x <pid>` 查看进程内存映射，或 `top -Hp <pid>` 查看线程级 CPU 和内存消耗。

2. **如何模拟和复现 OOM 问题？**
   * **堆内存 OOM**：创建大对象（如 `new byte[100 * 1024 * 1024]`）或通过循环向集合中添加对象，并保持强引用。
   * **Metaspace OOM**：利用动态类生成技术（如 ASM、CGLib）在循环中不断创建新类。
   * **直接内存 OOM**：在循环中分配 `ByteBuffer.allocateDirect()` 且不释放。
   * **注意**：模拟时需搭配相应的 JVM 参数限制内存大小（如 `-Xmx10m`）。

3. **线上环境为了预防 OOM，有哪些常用的 JVM 参数配置？**
   * **必备参数**：
     * `-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/path/to/logs`：自动转储。
     * `-Xlog:gc*,gc+heap=debug:file=/path/to/gc.log:time,uptime,level,tags:filecount=5,filesize=100m`：输出详细 GC 日志并滚动。
     * `-XX:ErrorFile=/path/to/hs_err_pid%p.log`：保存 JVM 崩溃日志。
   * **防护性参数**：
     * 限制元空间：`-XX:MaxMetaspaceSize=256m`，防止无限制增长。
     * 限制直接内存：`-XX:MaxDirectMemorySize=128m`。
     * 设置堆大小合理比例：`-XX:NewRatio=2`（老年代/新生代=2/1），`-XX:SurvivorRatio=8`（Eden/Survivor=8/1）。

4. **如何区分是“内存泄漏”还是“内存溢出”？**
   * **内存泄漏（Memory Leak）**：指对象在逻辑上已不再使用，但由于**错误的引用关系**（通常是强引用）无法被 GC 回收，导致可用内存逐渐减少。其特点是：**内存使用率随时间单调递增，即使触发 Full GC 也无法有效回收**。
   * **内存溢出（Memory Overflow）**：指应用**确实需要**这么多内存来存放存活对象，但分配的堆最大值（`-Xmx`）不足以满足需求。其特点是：内存使用率在高水位波动，Full GC 后能回收大部分空间，但很快又会被填满。
   * **判断方法**：在压力测试或高峰时段，持续监控老年代使用率曲线。如果呈现“锯齿状”上升（每次 Full GC 后最低点都比前一次高），则是典型的内存泄漏。如果呈现“平台状”波动（每次 Full GC 后都能回到相近的低点），则更可能是容量不足的溢出。
