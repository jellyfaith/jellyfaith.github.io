---
title: "说说 TCP 的四次挥手？"
published: 2026-04-22
draft: false
description: ""
tags: [note]
---
# 说说 TCP 的四次挥手？

# TCP 四次挥手面试标准答案

## 【核心定义】
TCP 四次挥手是 TCP 连接**双向、可靠、有序**关闭的标准过程，它确保通信双方都能安全地释放连接资源，并处理完所有在途数据。

## 【关键要点】
1. **发起关闭**：主动关闭方（Client）发送 FIN 报文，进入 FIN_WAIT_1 状态，表示“我没有数据要发送了”。
2. **确认关闭**：被动关闭方（Server）收到 FIN 后，发送 ACK 确认，进入 CLOSE_WAIT 状态，此时 Server 可能还有数据要发送。
3. **被动方关闭**：当 Server 数据发送完毕后，发送自己的 FIN 报文，进入 LAST_ACK 状态。
4. **最终确认**：Client 收到 FIN 后，发送 ACK 确认，进入 TIME_WAIT 状态，等待 2MSL 后彻底关闭。

## 【深度推导/细节】

### 为什么需要四次？
- **双向通道独立关闭**：TCP 是全双工协议，每个方向都需要独立关闭。FIN 只表示“我不再发送数据”，但还可以接收数据。
- **数据完整性保证**：被动方收到 FIN 后，需要时间处理缓冲区剩余数据，避免数据丢失。

### TIME_WAIT 状态详解（核心痛点）
- **持续时间**：2MSL（Maximum Segment Lifetime，报文最大生存时间，通常 2 分钟）。
- **设计目的**：
  1. **可靠终止**：确保最后一个 ACK 能到达被动方。如果 ACK 丢失，被动方会重传 FIN，Client 在 TIME_WAIT 期间能响应。
  2. **清理旧连接**：让本次连接的所有报文都在网络中消失，避免与新连接产生数据混淆。

### 状态变迁逻辑拆解
```
Step 1: Client 调用 close() → 发送 FIN → 状态: ESTABLISHED → FIN_WAIT_1
Step 2: Server 收到 FIN → 发送 ACK → 状态: ESTABLISHED → CLOSE_WAIT
        （此时 Server 仍可发送数据）
Step 3: Server 调用 close() → 发送 FIN → 状态: CLOSE_WAIT → LAST_ACK
Step 4: Client 收到 FIN → 发送 ACK → 状态: FIN_WAIT_2 → TIME_WAIT
        （等待 2MSL 后进入 CLOSED）
Step 5: Server 收到 ACK → 状态: LAST_ACK → CLOSED
```

## 【关联/对比】

### TCP 挥手 vs 握手
- **握手三次**：SYN 和 ACK 可以合并，因为 Server 的 SYN-ACK 同时完成了“同步序列号”和“确认 Client 的 SYN”。
- **挥手四次**：Server 的 ACK 和 FIN 不能合并，因为 ACK 是立即响应，FIN 要等数据处理完才能发送。

### 异常场景处理
- **同时关闭**：双方同时发送 FIN，会进入 FIN_WAIT_1 → CLOSING → TIME_WAIT 的特殊状态流转。
- **FIN_WAIT_2 超时**：如果 Server 一直不发 FIN，Client 在 FIN_WAIT_2 状态有超时机制（可配置，默认几分钟）。

## 『面试官追问』

1. **为什么 TIME_WAIT 是 2MSL，不是 1MSL 或 3MSL？**
   - 1MSL 确保自己的 ACK 能到达对方
   - 另 1MSL 确保对方的 FIN 重传能到达自己
   - 往返时间刚好覆盖最坏情况

2. **大量 TIME_WAIT 连接有什么影响？如何优化？**
   - 影响：占用端口资源，可能导致新连接无法建立
   - 优化方案：
     - 调整 `net.ipv4.tcp_tw_reuse`（允许 TIME_WAIT 连接复用）
     - 调整 `net.ipv4.tcp_max_tw_buckets`（限制 TIME_WAIT 数量）
     - 应用层使用连接池

3. **CLOSE_WAIT 状态过多说明什么？**
   - 通常是应用 Bug：Server 程序没有正确调用 close()
   - 需要检查代码的资源释放逻辑

4. **如果第四次 ACK 丢失了怎么办？**
   - Server 在 LAST_ACK 状态会重传 FIN
   - Client 在 TIME_WAIT 期间收到重传的 FIN，会重发 ACK
   - 如果 Client 已关闭，Server 会最终超时关闭连接

5. **TCP 有快速关闭机制吗？**
   - 有，TCP 同时关闭（simultaneous close）：双方同时发送 FIN，减少一次报文交换
   - 但实际应用中较少见，需要双方恰好同时调用 close()

## 【版本差异/扩展】
- **Linux 内核优化**：从 2.6 内核开始支持 `tcp_tw_recycle`（已废弃）和 `tcp_tw_reuse`
- **HTTP/1.1 vs HTTP/1.0**：Keep-Alive 机制减少了频繁的四次挥手
- **QUIC 协议**：基于 UDP，没有四次挥手过程，连接迁移更灵活

---

**回答要点总结**：四次挥手体现了 TCP 的可靠性设计，通过状态机确保连接安全关闭。TIME_WAIT 是关键保护机制，虽然会带来资源占用，但防止了数据错乱。实际调优需平衡可靠性和性能。
