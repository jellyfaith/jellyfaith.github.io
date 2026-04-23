---
title: "为什么 Spring 循环依赖需要三级缓存，二级不够吗？"
published: 2026-02-03
draft: false
description: ""
tags: [note]
---
# 为什么 Spring 循环依赖需要三级缓存，二级不够吗？

# Spring 循环依赖三级缓存机制详解

## 【核心定义】
Spring 通过三级缓存机制解决 Bean 创建过程中的循环依赖问题，其本质是在 Bean 生命周期中引入**对象工厂**作为中间层，允许提前暴露未完全初始化的 Bean 引用，同时确保代理对象的正确创建。

## 【关键要点】
1. **三级缓存结构**：
   - **一级缓存**：`singletonObjects` - 存放完全初始化好的单例 Bean
   - **二级缓存**：`earlySingletonObjects` - 存放提前暴露的早期 Bean 引用
   - **三级缓存**：`singletonFactories` - 存放 Bean 工厂对象，用于创建早期引用

2. **解决的核心问题**：
   - 普通循环依赖：二级缓存即可解决
   - **代理对象循环依赖**：必须使用三级缓存，确保代理对象只被创建一次

3. **设计原则**：
   - 保证 Bean 在容器中的唯一性
   - 支持 AOP 代理的透明替换
   - 遵循 Bean 生命周期的完整性

## 【深度推导/细节】

### 为什么二级缓存不够？
**核心矛盾**：当 Bean 需要被 AOP 代理时，如果只有二级缓存，会出现**代理对象创建时机**与**对象引用传递**的冲突。

#### 场景推演（假设只有二级缓存）：
```
// 假设只有一级和二级缓存
Bean A 依赖 Bean B，Bean B 依赖 Bean A，且 A 需要被代理

Step 1: 开始创建 A
- 实例化 A（普通对象）
- 将 A 的早期引用放入二级缓存
- 开始填充属性 → 发现需要 B

Step 2: 开始创建 B
- 实例化 B
- 将 B 的早期引用放入二级缓存
- 开始填充属性 → 发现需要 A

Step 3: B 获取 A
- 从二级缓存获取到 A 的早期引用（普通对象）
- B 完成属性注入
- B 完成初始化，放入一级缓存

Step 4: A 继续创建
- 获取到 B（已完全初始化）
- 完成属性注入
- **问题出现**：此时 A 需要被代理
- 创建 A 的代理对象 A'
- 将 A' 放入一级缓存

结果：B 中持有的 A 引用是普通对象，但容器中的 A 是代理对象 → **不一致！**
```

#### 三级缓存解决方案：
```
Step 1: 开始创建 A
- 实例化 A
- 将 A 的 ObjectFactory 放入三级缓存
  （这个工厂能判断是否需要创建代理）
- 开始填充属性 → 发现需要 B

Step 2: 开始创建 B
- 实例化 B
- 将 B 的 ObjectFactory 放入三级缓存
- 开始填充属性 → 发现需要 A

Step 3: B 获取 A
- 从三级缓存获取 A 的 ObjectFactory
- 执行 factory.getObject() 
  → 此时判断 A 是否需要代理
  → 如果需要，创建代理对象 A'
  → 将 A' 放入二级缓存，从三级移除
- B 获得 A'（代理对象）
- B 完成初始化

Step 4: A 继续创建
- 获取到 B（已完全初始化）
- 完成属性注入
- 初始化时发现二级缓存已有自己的代理对象
- 直接使用该代理对象，保证唯一性
```

### 三级缓存的关键设计：
```java
// Spring 源码中的关键逻辑
protected Object getSingleton(String beanName, boolean allowEarlyReference) {
    // 1. 从一级缓存查
    Object singletonObject = this.singletonObjects.get(beanName);
    if (singletonObject == null && isSingletonCurrentlyInCreation(beanName)) {
        // 2. 从二级缓存查
        singletonObject = this.earlySingletonObjects.get(beanName);
        if (singletonObject == null && allowEarlyReference) {
            // 3. 从三级缓存获取工厂并创建
            ObjectFactory<?> singletonFactory = this.singletonFactories.get(beanName);
            if (singletonFactory != null) {
                singletonObject = singletonFactory.getObject();
                // 移动到二级缓存
                this.earlySingletonObjects.put(beanName, singletonObject);
                this.singletonFactories.remove(beanName);
            }
        }
    }
    return singletonObject;
}
```

## 【关联/对比】

### Spring 不同版本的演进：
- **Spring 早期版本**：确实使用二级缓存，但无法完美解决代理对象的循环依赖
- **Spring 2.0+**：引入三级缓存，支持 AOP 与循环依赖的兼容
- **Spring 5.x**：优化缓存逻辑，但三级缓存核心机制不变

### 与其他容器对比：
- **Guice**：默认不支持构造器循环依赖，通过 Provider 延迟解决
- **CDI**：使用代理模式解决循环依赖，类似 Spring 但实现不同

### 设计模式关联：
- **工厂模式**：三级缓存中的 ObjectFactory
- **代理模式**：AOP 动态代理
- **单例模式**：缓存机制确保 Bean 唯一性

## 『面试官追问』

### 可能的问题：
1. **为什么构造器注入无法解决循环依赖？**
   - 构造器注入发生在实例化阶段，此时 Bean 还未放入缓存
   - Spring 无法提前暴露 Bean 引用，导致循环依赖检测失败

2. **原型 Bean 的循环依赖为什么不被支持？**
   - 原型 Bean 每次获取都是新实例，无法通过缓存解决
   - Spring 直接抛出 BeanCurrentlyInCreationException

3. **三级缓存对性能的影响？**
   - 增加了内存开销（多一层缓存）
   - 但避免了重复创建代理对象的更大开销
   - 总体是空间换时间的合理设计

4. **如何检测循环依赖？**
   - 使用 ThreadLocal 记录当前正在创建的 Bean
   - `isSingletonCurrentlyInCreation()` 方法判断
   - 发现循环时根据缓存策略决定是否抛出异常

5. **@Lazy 注解如何解决循环依赖？**
   - 创建代理对象延迟加载
   - 实际注入的是代理，打破初始化时的直接依赖

### 实际应用建议：
- 尽量避免循环依赖，这是代码结构需要优化的信号
- 优先使用 setter 注入而非构造器注入
- 对于必须的循环依赖，确保理解三级缓存的工作原理
- 在 Spring Boot 2.6+ 中，默认禁止了循环依赖，需要显式开启

---

**总结**：三级缓存是 Spring 在 Bean 生命周期完整性、AOP 代理一致性、循环依赖解决三者之间找到的平衡点。二级缓存能解决普通循环依赖，但无法保证代理对象的正确性和唯一性，这是三级缓存存在的根本原因。
