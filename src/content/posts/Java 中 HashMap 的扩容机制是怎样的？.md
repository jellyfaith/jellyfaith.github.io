---
title: "Java 中 HashMap 的扩容机制是怎样的？"
published: 2026-04-10
draft: false
description: ""
tags: [note]
---
# Java 中 HashMap 的扩容机制是怎样的？

# HashMap 扩容机制详解

## 【核心定义】
HashMap 的扩容机制是指当 HashMap 中存储的键值对数量超过当前容量与负载因子的乘积时，会创建一个容量为原来两倍的新数组，并将所有现有元素重新计算哈希并分配到新数组中的过程。

## 【关键要点】
1. **触发条件**：当 `size > threshold`（阈值 = 容量 × 负载因子）时触发扩容
2. **扩容操作**：创建新数组（容量为原数组2倍），重新计算所有元素的哈希索引（rehash）
3. **链表处理**：JDK 1.8 优化了链表迁移逻辑，通过 `(e.hash & oldCap) == 0` 判断元素位置
4. **树化拆分**：当红黑树节点数 ≤ 6 时退化为链表，否则按红黑树规则拆分
5. **性能影响**：扩容是 O(n) 操作，应尽量避免频繁扩容

## 【深度推导/细节】

### 扩容触发逻辑
```java
// HashMap.putVal() 中的扩容判断
if (++size > threshold)
    resize();
```

### 扩容过程分步拆解（JDK 1.8）
**Step 1 - 计算新容量和阈值**
- 旧容量为 0（初始化）：默认容量 16，阈值 = 16 × 0.75 = 12
- 旧容量已达最大值（1<<30）：阈值设为 Integer.MAX_VALUE，不再扩容
- 正常扩容：新容量 = 旧容量 × 2，新阈值 = 新容量 × 0.75

**Step 2 - 创建新数组**
```java
Node<K,V>[] newTab = (Node<K,V>[])new Node[newCap];
```

**Step 3 - 元素迁移（核心优化）**
```java
// 关键判断：元素在新数组中的位置
if ((e.hash & oldCap) == 0) {
    // 位置不变：newIndex = oldIndex
} else {
    // 位置偏移：newIndex = oldIndex + oldCap
}
```
**原理**：因为容量总是 2 的幂，扩容后 mask 的二进制多了一位 1，元素要么在原位置，要么在原位置+旧容量处

**Step 4 - 链表/树处理**
- 链表：按上述规则拆分为两个链表
- 红黑树：当节点数 ≤ 6 时退化为链表，否则按树结构拆分

### 关键数字解析
- **负载因子 0.75**：空间与时间的折中（统计学上泊松分布的最佳值）
- **树化阈值 8**：链表长度达到 8 时转为红黑树（哈希冲突概率约 0.00000006）
- **退化阈值 6**：避免频繁的树化/退化抖动（留出 2 的缓冲）
- **初始容量 16**：平衡内存占用和性能
- **最大容量 1<<30**：数组最大长度限制（2^30 ≈ 10.7亿）

## 【关联/对比】

### HashMap vs ConcurrentHashMap 扩容
| 特性 | HashMap | ConcurrentHashMap |
|------|---------|-------------------|
| 线程安全 | 不安全 | 安全（分段锁/CAS） |
| 扩容时机 | put 时检查 | 多线程协助扩容 |
| 迁移方式 | 单线程全量迁移 | 多线程分段迁移 |

### JDK 版本差异
- **JDK 1.7**：头插法，多线程下可能产生环形链表导致死循环
- **JDK 1.8**：尾插法 + 红黑树优化，解决了死循环问题

### 死循环问题详解（JDK 1.7）
```java
// 1.7 的 transfer() 方法使用头插法
void transfer(Entry[] newTable) {
    for (Entry<K,V> e : table) {
        while(null != e) {
            Entry<K,V> next = e.next;  // 线程A在此处挂起
            e.next = newTable[i];      // 线程B执行完后，形成环形链表
            newTable[i] = e;
            e = next;
        }
    }
}
```
**产生条件**：两个线程同时触发扩容，且操作同一个链表

## 『面试官追问』

### 常见追问问题
1. **为什么负载因子是 0.75 而不是 0.5 或 1.0？**
   - 0.5：空间浪费严重，频繁扩容
   - 1.0：哈希冲突概率大增，链表过长
   - 0.75：基于泊松分布计算出的空间时间最优平衡点

2. **为什么树化阈值是 8？**
   - 根据泊松分布，哈希冲突达到 8 的概率极低（约 6×10^-8）
   - 超过 8 时，链表查询效率 O(n) 明显低于红黑树 O(log n)

3. **扩容时为什么容量总是 2 的幂？**
   - 计算索引：`index = hash & (capacity-1)` 等价于 `hash % capacity`
   - 位运算比取模运算快得多
   - 扩容时元素位置可通过 `(hash & oldCap)` 快速判断

4. **如何避免频繁扩容？**
   ```java
   // 预估元素数量，设置初始容量
   int expectedSize = 1000;
   float loadFactor = 0.75f;
   int initialCapacity = (int)(expectedSize / loadFactor) + 1;
   Map<String, String> map = new HashMap<>(initialCapacity);
   ```

5. **HashMap 在并发环境下会出现什么问题？**
   - JDK 1.7：死循环、数据丢失
   - JDK 1.8：数据覆盖（两个线程同时 put 到同一空桶）
   - 解决方案：使用 ConcurrentHashMap 或 Collections.synchronizedMap()

### 性能优化建议
1. **合理设置初始容量**：避免多次扩容
2. **重写 hashCode()**：减少哈希冲突
3. **考虑使用其他 Map**：LinkedHashMap（保持插入顺序）、TreeMap（有序）、ConcurrentHashMap（并发）
4. **注意 key 的不可变性**：避免修改 key 导致找不到值

### 实际应用场景
- **缓存实现**：LRU Cache 基于 LinkedHashMap
- **配置存储**：Properties 继承自 Hashtable
- **并发场景**：ConcurrentHashMap 用于高并发缓存
- **有序需求**：TreeMap 用于需要排序的场景

---

**总结**：HashMap 的扩容机制是其性能优化的核心，理解其底层原理不仅有助于面试，更能指导实际开发中的性能调优和并发安全处理。
