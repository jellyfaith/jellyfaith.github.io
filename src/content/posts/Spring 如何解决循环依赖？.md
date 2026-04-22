---
title: "Spring 如何解决循环依赖？"
published: 2026-04-22
draft: false
description: ""
tags: [note]
---
# Spring 如何解决循环依赖？

# Spring 如何解决循环依赖？

## 【核心定义】
Spring 通过**三级缓存机制**，在 Bean 创建过程中提前暴露未完全初始化的 Bean 引用，从而解决单例作用域下的循环依赖问题。

## 【关键要点】
1. **三级缓存结构**：Spring 使用三个 Map 来存储不同状态的 Bean
   - `singletonObjects`（一级缓存）：存储完全初始化完成的单例 Bean
   - `earlySingletonObjects`（二级缓存）：存储提前暴露的早期 Bean（已实例化但未完成属性注入）
   - `singletonFactories`（三级缓存）：存储 Bean 工厂对象，用于创建早期 Bean 引用

2. **解决时机**：循环依赖的解决发生在 Bean 的**实例化之后、初始化之前**
   - 实例化：通过反射创建 Bean 对象（此时属性均为空）
   - 提前暴露：将刚实例化的 Bean 包装成 ObjectFactory 放入三级缓存
   - 属性注入：从容器中获取依赖的 Bean，如果依赖的 Bean 正在创建中，则从缓存中获取

3. **作用域限制**：该机制仅适用于**单例作用域**的 Bean
   - 原型作用域的 Bean 每次都会创建新实例，无法通过缓存解决循环依赖
   - Spring 会直接抛出 `BeanCurrentlyInCreationException` 异常

## 【深度推导/细节】

### 循环依赖的三种类型
1. **构造器循环依赖**：无法解决，Spring 会直接抛出异常
   ```java
   // A 依赖 B，B 依赖 A，都在构造器中注入
   @Component
   public class A {
       public A(B b) { ... }
   }
   @Component  
   public class B {
       public B(A a) { ... }
   }
   ```

2. **Setter 循环依赖**：可以通过三级缓存解决
   ```java
   @Component
   public class A {
       @Autowired
       private B b;
   }
   @Component
   public class B {
       @Autowired
       private A a;
   }
   ```

3. **字段注入循环依赖**：同样可以通过三级缓存解决（本质与 Setter 类似）

### 解决流程分步拆解（以 A→B→A 为例）

**Step 1 - 创建 Bean A**
- 调用 `getBean("a")`，发现 A 不在任何缓存中
- 标记 A 为"正在创建"状态
- 实例化 A 对象（此时属性 b 为 null）
- 将 A 的 ObjectFactory 放入**三级缓存**
- 开始属性注入，发现需要依赖 B

**Step 2 - 创建 Bean B**
- 调用 `getBean("b")`，发现 B 不在任何缓存中
- 标记 B 为"正在创建"状态
- 实例化 B 对象（此时属性 a 为 null）
- 将 B 的 ObjectFactory 放入**三级缓存**
- 开始属性注入，发现需要依赖 A

**Step 3 - 解决循环**
- 再次调用 `getBean("a")`，发现 A 正在创建中
- 从**三级缓存**获取 A 的 ObjectFactory
- 执行 ObjectFactory 获取早期 A 对象（可能经过 AOP 代理）
- 将早期 A 对象放入**二级缓存**，并从三级缓存移除
- 将早期 A 注入到 B 中，完成 B 的属性注入

**Step 4 - 完成创建**
- B 完成初始化，放入**一级缓存**
- 回到 A 的属性注入，现在可以从一级缓存获取完整的 B
- A 完成初始化，放入**一级缓存**，并从二级缓存移除

### 关键设计点
- **为什么需要三级缓存而不是两级？**
  三级缓存中的 ObjectFactory 可以处理 AOP 代理场景。如果 Bean 需要被代理，ObjectFactory 可以返回代理对象，而不仅仅是原始对象。

- **为什么构造器注入无法解决？**
  构造器注入发生在实例化阶段，此时 Bean 还未创建完成，无法提前暴露引用。

## 【关联/对比】

### Spring 不同版本的差异
- **Spring 2.6+ 版本**：默认禁止了循环依赖，需要通过配置开启
  ```java
  spring.main.allow-circular-references=true
  ```
- **早期版本**：默认允许循环依赖

### 与其他容器对比
- **Guice**：默认不支持循环依赖，需要特殊处理
- **CDI**：有限支持，通过代理模式解决部分场景

### 与设计模式关联
- **依赖注入 vs 依赖查找**：循环依赖的解决依赖于依赖注入模式
- **工厂模式**：三级缓存使用 ObjectFactory 作为工厂创建 Bean

## 『面试官追问』

1. **Spring 为什么不能解决构造器循环依赖？**
   - 构造器注入必须在实例化时完成，此时 Bean 还未放入缓存，无法提前暴露引用
   - 从设计上，构造器循环依赖通常意味着设计问题，应该避免

2. **三级缓存的具体数据结构是什么？**
   ```java
   // DefaultSingletonBeanRegistry 中的定义
   private final Map<String, Object> singletonObjects = new ConcurrentHashMap<>(256);  // 一级
   private final Map<String, Object> earlySingletonObjects = new ConcurrentHashMap<>(16); // 二级  
   private final Map<String, ObjectFactory<?>> singletonFactories = new HashMap<>(16); // 三级
   ```

3. **如果存在 AOP 代理，循环依赖如何处理？**
   - ObjectFactory 会调用 `getEarlyBeanReference()` 方法
   - 如果有必要，会创建代理对象并返回
   - 最终注入的是代理对象，保证 AOP 功能正常

4. **原型作用域的 Bean 为什么不能解决循环依赖？**
   - 原型 Bean 每次请求都会创建新实例
   - 无法通过缓存共享未完成的 Bean 引用
   - 会导致无限递归创建，最终栈溢出

5. **如何检测循环依赖？**
   - Spring 使用 `ThreadLocal` 存储当前正在创建的 Bean 名称
   - 在 `beforeSingletonCreation()` 中检查，如果发现重复，则抛出异常

6. **循环依赖对性能的影响？**
   - 增加了 Bean 创建的复杂度
   - 需要额外的缓存存储和查找
   - 建议在设计中避免循环依赖，特别是深层循环

7. **Spring Boot 2.6+ 为什么默认禁止循环依赖？**
   - 循环依赖通常意味着不良设计
   - 强制开发者重新审视代码结构
   - 提高应用的健壮性和可维护性

---

**最佳实践建议**：虽然 Spring 提供了循环依赖的解决方案，但在实际项目中应尽量避免循环依赖，它会导致代码耦合度增加、测试困难、启动顺序敏感等问题。可以通过设计模式（如观察者模式、中介者模式）或重构代码结构来消除循环依赖。
