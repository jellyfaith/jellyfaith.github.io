---
title: "线上发现 Redis 机器爆了，如何优化？"
published: 2026-01-31
draft: false
description: ""
tags: [note]
---
# 线上发现 Redis 机器爆了，如何优化？

【核心定义】  
线上 Redis 机器“爆了”通常指内存或 CPU 资源耗尽，导致服务不可用或性能骤降，需从资源监控、数据结构优化、配置调优、架构升级四方面系统性解决。

【关键要点】  
1. **紧急止血**：立即扩容实例内存或切换至从节点，恢复服务可用性。  
2. **定位根因**：通过 `INFO memory`、`MONITOR`（慎用）、慢查询日志分析内存增长点与热点 Key。  
3. **数据结构优化**：将 String 存储的 JSON 拆分为 Hash，对大 Key 进行分片（如 `user:1000:{field}`）。  
4. **内存控制**：设置 `maxmemory` 并启用 LRU/LFU 淘汰策略，对冷数据设置 TTL。  
5. **配置调优**：关闭透明大页（`transparent_hugepage`），调整 `tcp-backlog` 与 `timeout` 防连接堆积。  
6. **架构升级**：数据分片（Cluster/Codis）、读写分离、热数据加本地缓存（如 Caffeine）。

【深度推导/细节】  
**内存爆满场景拆解**：  
- **大 Key 问题**：单个 Key 值过大（如 List 存百万元素）导致序列化阻塞、迁移失败。  
  *优化*：用 `SCAN` 扫描并拆分，或改用 `SSTable` 结构存储（如 RocksDB）。  
- **内存碎片**：频繁增删改导致 `mem_fragmentation_ratio > 1.5`。  
  *解决*：启用 `activedefrag yes` 或重启实例整理碎片。  
- **淘汰策略失效**：`allkeys-lru` 在弱访问模式下可能误删热点数据。  
  *调优*：结合 `OBJECT idletime` 分析访问模式，改用 `allkeys-lfu`（Redis 4.0+）。  

**CPU 飙升场景拆解**：  
- **慢查询阻塞**：`O(N)` 命令（如 `KEYS *`、全量 `HGETALL`）占用单线程。  
  *定位*：`slowlog get 10` 分析，用 `SCAN` 替代 `KEYS`，复杂计算移至客户端。  
- **持久化冲突**：`bgsave` 子进程与 AOF 重写同时触发导致 `fork` 延迟。  
  *控制*：错峰配置 `save` 规则，或改用混合持久化（AOF+RDB）。  

【关联/对比】  
- **Redis vs Memcached**：Redis 单线程模型更易受 CPU 密集型操作影响，需避免 Lua 脚本长时间运行。  
- **Cluster vs Codis**：Cluster 原生分片但运维复杂，Codis 支持平滑扩容但需代理层。  

『面试官追问』  
1. **如何发现热 Key？**  
   - 客户端统计（如 Jedis 的 KeyTracker）、代理层收集、`redis-cli --hotkeys`（Redis 5.0+）。  
2. **内存达到 maxmemory 后写入会怎样？**  
   - 根据 `maxmemory-policy` 决定：默认 `noeviction` 拒绝写入，生产环境建议 `volatile-lru`。  
3. **AOF 重写期间内存暴涨怎么办？**  
   - 控制 `aof-rewrite-incremental-fsync yes`，或升级至 Redis 7.0 使用多部分 AOF 减少阻塞。  

【优化体系总结】  
- **短期**：扩容 + 大 Key/热 Key 治理。  
- **中期**：配置调优 + 架构分层（热点数据本地缓存）。  
- **长期**：数据分片 + 监控告警（如 Prometheus + Grafana 设置内存 80% 阈值）。
