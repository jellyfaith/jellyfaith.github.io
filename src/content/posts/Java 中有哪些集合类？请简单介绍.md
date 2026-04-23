---
title: "Java 中有哪些集合类？请简单介绍"
published: 2026-04-08
draft: false
description: ""
tags: [note]
---
# Java 中有哪些集合类？请简单介绍

# Java 集合类面试标准答案

## 【核心定义】
Java 集合框架（Java Collections Framework，JCF）是一组用于存储和操作数据集合的接口、实现类和算法，提供了高效、可复用的数据结构解决方案。

## 【关键要点】
1. **接口体系**：分为 `Collection` 和 `Map` 两大根接口，`Collection` 存储单值元素，`Map` 存储键值对。
2. **主要实现类**：
   - `List` 接口：有序、可重复，实现类包括 `ArrayList`、`LinkedList`、`Vector`。
   - `Set` 接口：无序、不可重复，实现类包括 `HashSet`、`LinkedHashSet`、`TreeSet`。
   - `Queue` 接口：队列，实现类包括 `LinkedList`、`PriorityQueue`、`ArrayDeque`。
   - `Map` 接口：键值对映射，实现类包括 `HashMap`、`LinkedHashMap`、`TreeMap`、`Hashtable`。
3. **线程安全类**：`Vector`、`Hashtable` 是早期同步实现；`ConcurrentHashMap`、`CopyOnWriteArrayList` 是并发包中的高性能线程安全集合。

## 【深度推导/细节】
### 数据结构差异
- **`ArrayList` vs `LinkedList`**：
  - `ArrayList` 基于动态数组，支持随机访问（O(1)），但插入删除需移动元素（O(n)）。
  - `LinkedList` 基于双向链表，插入删除快（O(1)），但随机访问慢（O(n)）。
  - **选择依据**：频繁随机访问选 `ArrayList`，频繁插入删除选 `LinkedList`。

### 扩容机制（以 `ArrayList` 为例）
- **初始容量**：默认 10。
- **扩容公式**：`newCapacity = oldCapacity + (oldCapacity >> 1)`，即扩容 1.5 倍。
- **触发条件**：添加元素时 `size + 1 > elementData.length`。
- **性能影响**：扩容涉及数组复制，建议预估容量初始化以避免频繁扩容。

### 线程安全实现
- **`Vector`/`Hashtable`**：方法级同步（`synchronized`），性能差。
- **`ConcurrentHashMap`**（JDK 8+）：
  - 数据结构：数组 + 链表/红黑树。
  - 锁粒度：Node 头节点锁（synchronized），支持更高并发。
  - 扩容：协助扩容机制，多线程可共同参与数据迁移。

## 【关联/对比】
### `HashMap` vs `ConcurrentHashMap`
| 特性 | `HashMap` | `ConcurrentHashMap`（JDK 8） |
|------|-----------|-----------------------------|
| 线程安全 | 否 | 是 |
| 锁机制 | 无 | Node 头节点锁（synchronized） |
| 数据结构 | 数组+链表/红黑树 | 数组+链表/红黑树 |
| 扩容 | 单线程扩容 | 多线程协助扩容 |
| 空键值 | 允许一个 null 键、多个 null 值 | 不允许 null 键或值 |

### `HashSet` 与 `HashMap` 的关系
- `HashSet` 内部使用 `HashMap` 实现，元素作为 `HashMap` 的 key，value 统一为 `PRESENT` 静态对象。
- 因此 `HashSet` 的不可重复性实际由 `HashMap` 的 key 唯一性保证。

## 『面试官追问』
1. **`HashMap` 的负载因子为什么是 0.75？**
   - 空间与时间的权衡：负载因子过高（如 0.9）减少空间开销但增加哈希冲突；负载因子过低（如 0.5）减少冲突但增加扩容频率。0.75 是基于统计学泊松分布得出的平衡点。

2. **`HashMap` 链表转红黑树的阈值为什么是 8？退化阈值为什么是 6？**
   - 链表长度达到 8 的概率极低（约 0.00000006），此时红黑树的查询效率 O(log n) 优于链表 O(n)。
   - 退化阈值为 6（非 7）是为避免频繁转换的“抖动现象”，提供 2 的缓冲区间。

3. **`ConcurrentHashMap` 在 JDK 7 和 JDK 8 的实现有何不同？**
   - **JDK 7**：分段锁（Segment），锁粒度较粗。
   - **JDK 8**：Node 头节点锁 + synchronized，锁粒度更细，并发度更高；引入红黑树优化长链表查询。

4. **`ArrayList` 和 `Vector` 的区别？**
   - `ArrayList` 非线程安全，`Vector` 线程安全（方法级 synchronized）。
   - `Vector` 扩容默认翻倍（2 倍），`ArrayList` 扩容 1.5 倍。
   - 现代开发中 `Vector` 已不推荐使用，需线程安全时可使用 `Collections.synchronizedList` 或 `CopyOnWriteArrayList`。

5. **如何选择 `List` 的实现类？**
   - 需要快速随机访问 → `ArrayList`
   - 频繁在任意位置插入/删除 → `LinkedList`
   - 需要线程安全且读多写少 → `CopyOnWriteArrayList`
   - 需要线程安全且写操作频繁 → `Collections.synchronizedList(new ArrayList())`

## 【版本差异】
- **JDK 1.2**：引入集合框架（JCF），取代早期的 `Vector`、`Hashtable`。
- **JDK 1.5**：引入并发包 `java.util.concurrent`，提供 `ConcurrentHashMap`、`CopyOnWriteArrayList` 等。
- **JDK 8**：
  - `HashMap` 引入红黑树优化链表性能。
  - `ConcurrentHashMap` 放弃分段锁，改用 synchronized + CAS。
  - 引入 `Stream API`，支持函数式集合操作。
- **JDK 9+**：新增 `List.of()`、`Set.of()`、`Map.of()` 等工厂方法创建不可变集合。

---

**总结**：Java 集合框架提供了丰富的数据结构选择，理解其底层实现、线程安全特性和版本演进是高效使用集合类的关键。在实际开发中，应根据数据特性、访问模式和线程安全需求选择合适的集合实现。
