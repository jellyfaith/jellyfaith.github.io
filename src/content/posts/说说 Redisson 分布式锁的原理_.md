---
title: "说说 Redisson 分布式锁的原理?"
published: 2026-02-11
draft: false
description: ""
tags: [note]
---
# 说说 Redisson 分布式锁的原理?

# Redisson 分布式锁原理详解

## 【核心定义】
Redisson 分布式锁是基于 Redis 实现的、支持可重入、自动续期、高可用的分布式互斥锁机制，其核心是通过 Lua 脚本保证 Redis 命令的原子性执行。

## 【关键要点】
1. **可重入锁设计**：通过 Redis 的 Hash 结构存储锁信息，Key 为锁名称，Field 为客户端唯一标识，Value 为重入次数，支持同一线程多次加锁。
2. **看门狗自动续期**：加锁成功后启动后台线程（Watchdog），定期（默认 10 秒检查一次）延长锁的过期时间，防止业务未执行完锁自动释放。
3. **Lua 脚本原子性**：所有加锁、解锁、续期操作均通过 Lua 脚本执行，确保多个 Redis 命令的原子性，避免并发问题。
4. **锁等待机制**：支持 tryLock 的等待时间，通过 Redis 的发布订阅机制实现锁释放时的通知，减少无效的轮询消耗。
5. **容错与高可用**：支持单机、主从、哨兵、集群多种模式，通过 Redlock 算法在多个 Redis 节点间实现分布式锁，提高可靠性。

## 【深度推导/细节】

### 加锁流程（以可重入锁为例）
**Step 1 - 首次加锁**
```lua
-- Lua 脚本逻辑
if (redis.call('exists', KEYS[1]) == 0) then
    redis.call('hset', KEYS[1], ARGV[2], 1)
    redis.call('pexpire', KEYS[1], ARGV[1])
    return nil
end
```
- KEYS[1]：锁的 Key（如 "myLock"）
- ARGV[1]：锁的过期时间（毫秒）
- ARGV[2]：客户端唯一标识（UUID + 线程ID）
- 执行结果：锁不存在时，设置 Hash 结构，重入次数为 1，设置过期时间

**Step 2 - 可重入加锁**
```lua
if (redis.call('hexists', KEYS[1], ARGV[2]) == 1) then
    redis.call('hincrby', KEYS[1], ARGV[2], 1)
    redis.call('pexpire', KEYS[1], ARGV[1])
    return nil
end
```
- 同一客户端再次请求时，重入次数 +1，并刷新过期时间

**Step 3 - 锁竞争处理**
- 如果锁已被其他客户端持有，当前线程订阅锁释放的 Channel
- 等待指定时间（tryLock 的 waitTime），期间收到释放通知后重试加锁
- 超时未获得锁则返回失败

### 看门狗续期机制
1. **默认配置**：锁超时时间 30 秒，看门狗每 10 秒检查一次
2. **续期条件**：仅当锁仍被当前客户端持有且未设置超时时间（leaseTime = -1）时才续期
3. **续期操作**：将锁的过期时间重置为初始超时时间（默认 30 秒）
4. **停止时机**：锁释放或客户端宕机时停止续期

### 解锁流程
```lua
if (redis.call('hexists', KEYS[1], ARGV[3]) == 0) then
    return nil
end
local counter = redis.call('hincrby', KEYS[1], ARGV[3], -1)
if (counter > 0) then
    redis.call('pexpire', KEYS[1], ARGV[2])
    return 0
else
    redis.call('del', KEYS[1])
    redis.call('publish', KEYS[2], ARGV[1])
    return 1
end
```
- 重入次数减 1，如果大于 0 则只刷新过期时间
- 重入次数为 0 时删除锁 Key，并发布解锁消息通知等待线程

## 【关联/对比】

### Redisson vs 原生 Redis 分布式锁
| 特性 | Redisson 分布式锁 | 原生 SETNX + EXPIRE |
|------|------------------|-------------------|
| 可重入性 | 支持，同一线程可多次加锁 | 不支持 |
| 自动续期 | 支持看门狗机制 | 需手动实现 |
| 锁等待 | 支持，基于发布订阅 | 需轮询实现 |
| 原子性 | Lua 脚本保证原子性 | SETNX 和 EXPIRE 非原子 |
| 容错性 | 支持 Redlock 多节点 | 单点故障风险 |

### Redisson vs ZooKeeper 分布式锁
- **性能**：Redisson（基于 Redis）性能更高，ZooKeeper 写性能较低
- **可靠性**：ZooKeeper 的 CP 模型更可靠，Redis 的 AP 模型可能锁失效
- **实现复杂度**：Redisson 封装完善，ZooKeeper 需处理临时节点、Watch 等
- **适用场景**：Redisson 适合高并发短任务，ZooKeeper 适合强一致性场景

## 【线程安全与版本差异】

### 线程安全保证
1. **客户端级别**：每个 RedissonClient 实例维护自己的连接和线程池
2. **操作原子性**：所有关键操作通过 Lua 脚本在 Redis 服务端原子执行
3. **并发控制**：Java 端的 ConcurrentHashMap 管理锁对象，synchronized 保护关键代码段

### 版本演进关键点
- **3.0+**：引入异步 API，支持 Reactive 编程
- **3.10+**：优化 Redlock 实现，修复潜在问题
- **3.12+**：增强集群模式支持，改进故障转移处理
- **最新版本**：支持 Spring Boot 3.x，优化内存使用

## 『面试官追问』

1. **Redisson 锁的过期时间设置为多少合适？**
   - 需要根据业务执行时间评估，通常设置为平均执行时间的 2-3 倍
   - 使用看门狗时可不设置（或设为 -1），由看门狗自动续期
   - 避免设置过短导致业务未完成锁释放，或过长导致死锁恢复慢

2. **看门狗续期失败怎么办？**
   - 网络分区或 Redis 故障时续期失败
   - 锁会在过期时间后自动释放，可能被其他客户端获取
   - 业务代码需考虑幂等性，或使用 Redlock 多节点降低风险

3. **Redisson 如何防止客户端崩溃后锁无法释放？**
   - 通过过期时间自动释放，即使客户端崩溃，锁也会在 TTL 后释放
   - 看门狗在客户端正常时会持续续期，崩溃后停止续期，锁自动过期

4. **集群模式下锁的安全性如何保证？**
   - 普通集群模式仍存在主从异步复制期间的锁丢失风险
   - Redlock 算法要求至少 3 个主节点，需在多数节点上加锁成功
   - 实际中需权衡一致性与性能，多数场景普通集群模式已足够

5. **Redisson 锁与数据库悲观锁对比？**
   - **性能**：Redisson 基于内存，性能远高于数据库锁
   - **粒度**：Redisson 可细粒度控制，数据库锁通常表级或行级
   - **死锁处理**：Redisson 有过期机制，数据库需超时或死锁检测
   - **分布式支持**：Redisson 为分布式设计，数据库锁限于单实例

6. **如何实现公平分布式锁？**
   - Redisson 提供 `RFairLock` 实现公平锁
   - 基于 Redis 的 List 结构维护等待队列
   - 按请求顺序获取锁，避免线程饥饿
   - 但性能低于普通锁，需根据场景选择
