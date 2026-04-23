---
title: "数组和链表在 Java 中的区别是什么？"
published: 2026-02-12
draft: false
description: ""
tags: [note]
---
# 数组和链表在 Java 中的区别是什么？

# 数组和链表在 Java 中的区别

## 【核心定义】
数组是一种在内存中连续存储的线性数据结构，通过索引直接访问元素；链表是一种通过节点指针（引用）连接的非连续存储的线性数据结构。

## 【关键要点】
1. **内存分配方式不同**
   - 数组：需要连续的内存空间，声明时必须指定固定大小
   - 链表：节点可以分散在内存各处，通过指针连接，动态分配内存

2. **访问效率差异**
   - 数组：支持随机访问，时间复杂度 O(1)
   - 链表：只能顺序访问，时间复杂度 O(n)

3. **插入删除效率对比**
   - 数组：插入删除需要移动元素，平均时间复杂度 O(n)
   - 链表：插入删除只需修改指针，时间复杂度 O(1)（已知节点位置时）

4. **内存使用效率**
   - 数组：内存利用率高，只有数据本身占用空间
   - 链表：每个节点需要额外存储指针，内存开销更大

## 【深度推导/细节】

### 数组的扩容机制（以 ArrayList 为例）
```java
// ArrayList 扩容核心代码逻辑
private void grow(int minCapacity) {
    int oldCapacity = elementData.length;
    int newCapacity = oldCapacity + (oldCapacity >> 1); // 扩容1.5倍
    if (newCapacity - minCapacity < 0)
        newCapacity = minCapacity;
    elementData = Arrays.copyOf(elementData, newCapacity);
}
```
**扩容代价分析**：
- 创建新数组：O(n) 时间复杂度和 O(n) 空间复杂度
- 复制元素：System.arraycopy() 底层使用内存拷贝，效率较高但仍为 O(n)
- 触发条件：当 size == capacity 时触发扩容

### 链表的插入优化（以 LinkedList 为例）
```java
// LinkedList 双向链表节点结构
private static class Node<E> {
    E item;
    Node<E> next;
    Node<E> prev;
    
    Node(Node<E> prev, E element, Node<E> next) {
        this.item = element;
        this.next = next;
        this.prev = prev;
    }
}
```
**插入场景分析**：
- 头部插入：O(1)，只需修改 head 指针
- 尾部插入：O(1)，LinkedList 维护 tail 指针
- 中间插入：O(n)，需要遍历找到插入位置

## 【关联/对比】

### 与 Java 集合框架的关联
| 特性 | ArrayList (基于数组) | LinkedList (基于链表) |
|------|---------------------|----------------------|
| 底层实现 | Object[] 数组 | 双向链表 |
| 随机访问 | O(1) | O(n) |
| 头部插入 | O(n) | O(1) |
| 尾部插入 | O(1)（均摊） | O(1) |
| 内存占用 | 较小（仅数据） | 较大（数据+指针） |
| 缓存友好性 | 高（空间局部性） | 低 |

### 实际应用场景选择
1. **选择数组/ArrayList 的场景**：
   - 频繁随机访问（如二分查找）
   - 已知数据量大小或变化不大
   - 对内存敏感的应用
   - 需要 CPU 缓存友好的场景

2. **选择链表/LinkedList 的场景**：
   - 频繁在头部/中间插入删除
   - 数据量动态变化频繁
   - 实现栈、队列、双向队列
   - 内存碎片化严重的环境

## 『面试官追问』

### Q1：ArrayList 的初始容量和扩容因子是多少？为什么这样设计？
**初始容量**：默认 10（JDK 1.2+）
**扩容因子**：1.5 倍（oldCapacity + (oldCapacity >> 1)）

**设计合理性**：
1. 平衡空间和时间：1.5 倍扩容既避免频繁扩容，又不过度浪费内存
2. 数学优化：1.5 接近黄金分割比例，在多次扩容后容量趋于合理
3. 位运算优化：`oldCapacity >> 1` 比 `oldCapacity * 0.5` 效率更高

### Q2：LinkedList 真的是完全 O(1) 的插入删除吗？
**不完全正确**，需要分情况讨论：

1. **已知节点位置的插入删除**：O(1)
   ```java
   // 在指定节点前后插入
   void linkBefore(E e, Node<E> succ) {
       final Node<E> pred = succ.prev;
       final Node<E> newNode = new Node<>(pred, e, succ);
       succ.prev = newNode;
       if (pred == null)
           first = newNode;
       else
           pred.next = newNode;
   }
   ```

2. **按索引位置的插入删除**：O(n)
   - 需要遍历找到对应位置的节点
   - LinkedList.get(index) 内部优化：如果 index < size/2 从头遍历，否则从尾遍历

### Q3：为什么数组的随机访问是 O(1)？
**内存地址计算公式**：
```
元素地址 = 数组首地址 + 索引 × 元素大小
```
**底层原理**：
1. 数组在内存中连续存储
2. 元素类型固定，大小已知
3. CPU 通过一次地址计算直接定位，无需遍历

### Q4：现代 CPU 架构下，数组和链表的性能差异有哪些新特点？
1. **CPU 缓存的影响**：
   - 数组：空间局部性好，容易命中 CPU 缓存
   - 链表：节点分散，缓存命中率低，可能产生缓存颠簸

2. **预取机制**：
   - 数组：CPU 可以预取后续元素到缓存
   - 链表：指针跳转无法预测，预取效果差

3. **TLB（页表缓存）**：
   - 数组：连续内存减少 TLB 缺失
   - 链表：节点分散可能跨多个内存页，增加 TLB 压力

### Q5：什么情况下 LinkedList 的性能可能反超 ArrayList？
**临界点分析**：
1. **大量头部插入**：LinkedList O(1) vs ArrayList O(n)
2. **超大容量频繁插入删除**：
   - ArrayList 扩容复制成本高
   - LinkedList 指针操作成本稳定
3. **内存碎片严重时**：
   - 数组需要连续大块内存
   - 链表可以利用内存碎片

## 【版本差异】
1. **JDK 1.2 之前**：Vector（线程安全数组）和普通数组为主
2. **JDK 1.2**：引入 Collections Framework，ArrayList 和 LinkedList 成为标准
3. **JDK 1.5**：引入泛型，支持类型安全的集合
4. **JDK 1.6**：ArrayList 优化了扩容时的数组复制
5. **JDK 1.8**：进一步优化了内存管理和性能

## 【性能优化建议】
1. **预分配容量**：已知数据量时，ArrayList 应使用带初始容量的构造函数
2. **批量操作**：使用 addAll() 而非循环 add()，减少扩容次数
3. **迭代器选择**：LinkedList 优先使用迭代器而非 get(index)
4. **并发场景**：考虑 CopyOnWriteArrayList 或 ConcurrentLinkedQueue

## 【总结】
数组和链表的选择本质上是**空间连续性**与**操作灵活性**的权衡。数组胜在访问效率和缓存友好性，链表胜在动态扩展和插入删除效率。在实际开发中，应根据具体的数据访问模式、内存约束和性能要求做出合理选择，通常 ArrayList 能满足大多数场景需求，但在特定高频插入删除场景下 LinkedList 仍有其不可替代的价值。
