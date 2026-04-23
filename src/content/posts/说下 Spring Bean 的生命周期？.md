---
title: "说下 Spring Bean 的生命周期？"
published: 2026-02-08
draft: false
description: ""
tags: [note]
---
# 说下 Spring Bean 的生命周期？

# Spring Bean 生命周期详解

## 【核心定义】
Spring Bean 的生命周期是指一个 Bean 从被实例化、初始化到最终被销毁的完整过程，由 Spring IoC 容器进行全权管理。

## 【关键要点】
1. **实例化阶段**：容器通过反射调用构造器创建 Bean 实例
2. **属性赋值阶段**：通过 setter 方法或字段注入完成依赖注入
3. **初始化阶段**：执行各种初始化回调方法
4. **使用阶段**：Bean 处于就绪状态，可被应用程序使用
5. **销毁阶段**：容器关闭时执行销毁回调

## 【深度推导/细节】

### 完整生命周期流程（共 13 个关键节点）

**Step 1 - Bean 实例化前**
- `InstantiationAwareBeanPostProcessor.postProcessBeforeInstantiation()`：Bean 实例化前的最后机会，可返回代理对象替代目标 Bean

**Step 2 - Bean 实例化**
- 通过构造器或工厂方法创建 Bean 实例

**Step 3 - Bean 实例化后**
- `InstantiationAwareBeanPostProcessor.postProcessAfterInstantiation()`：实例化后立即执行，可修改 Bean 实例

**Step 4 - 属性填充前**
- `InstantiationAwareBeanPostProcessor.postProcessProperties()`：处理 @Autowired、@Value 等注解的注入

**Step 5 - 属性赋值**
- 通过 setter 方法或字段反射完成属性注入

**Step 6 - Aware 接口回调**
- 按顺序执行：
  1. `BeanNameAware.setBeanName()`
  2. `BeanClassLoaderAware.setBeanClassLoader()`
  3. `BeanFactoryAware.setBeanFactory()`
  4. `EnvironmentAware.setEnvironment()`
  5. `EmbeddedValueResolverAware.setEmbeddedValueResolver()`
  6. `ResourceLoaderAware.setResourceLoader()`
  7. `ApplicationEventPublisherAware.setApplicationEventPublisher()`
  8. `MessageSourceAware.setMessageSource()`
  9. `ApplicationContextAware.setApplicationContext()`

**Step 7 - BeanPostProcessor 前置处理**
- `BeanPostProcessor.postProcessBeforeInitialization()`：初始化前的最后处理机会

**Step 8 - 初始化方法执行**
- 按顺序执行：
  1. `@PostConstruct` 注解方法
  2. `InitializingBean.afterPropertiesSet()` 方法
  3. 自定义的 `init-method` 方法

**Step 9 - BeanPostProcessor 后置处理**
- `BeanPostProcessor.postProcessAfterInitialization()`：初始化后的处理，常用于生成代理对象

**Step 10 - Bean 就绪**
- Bean 完全初始化，可被应用程序使用

**Step 11 - 容器关闭**
- 容器接收到关闭信号

**Step 12 - 销毁前处理**
- `DestructionAwareBeanPostProcessor.postProcessBeforeDestruction()`：销毁前的处理

**Step 13 - 销毁方法执行**
- 按顺序执行：
  1. `@PreDestroy` 注解方法
  2. `DisposableBean.destroy()` 方法
  3. 自定义的 `destroy-method` 方法

## 【关联/对比】

### Spring Bean 生命周期 vs 普通 Java 对象生命周期
| 对比维度 | Spring Bean | 普通 Java 对象 |
|---------|------------|---------------|
| 创建方式 | 容器控制，反射/工厂 | 直接 new 或反射 |
| 依赖管理 | 自动注入 | 手动设置 |
| 生命周期 | 完整回调机制 | 无回调机制 |
| 作用域 | 支持 singleton/prototype 等 | 固定作用域 |

### 不同作用域的 Bean 生命周期差异
- **Singleton**：容器启动时创建（默认懒加载除外），容器关闭时销毁
- **Prototype**：每次获取时创建，容器不管理销毁
- **Request/Session**：对应作用域创建和销毁时触发生命周期

## 【直击痛点】

### 高频追问点解析

**1. 为什么要有这么多回调接口？**
- **设计原则**：遵循单一职责原则，每个接口负责特定功能
- **扩展性**：允许开发者在不同阶段介入 Bean 的创建过程
- **解耦**：将 Bean 的创建逻辑与业务逻辑分离

**2. BeanPostProcessor 的执行时机**
- 前置处理在初始化方法之前，后置处理在初始化方法之后
- 每个 Bean 都会经过所有 BeanPostProcessor 的处理

**3. @PostConstruct vs InitializingBean.afterPropertiesSet()**
- 执行顺序：@PostConstruct 先于 afterPropertiesSet()
- 耦合度：@PostConstruct 注解方式耦合度更低
- 推荐使用：优先使用 @PostConstruct，避免实现 Spring 特定接口

## 『面试官追问』

### 可能追问的问题：
1. **BeanFactory 和 ApplicationContext 在 Bean 生命周期管理上有何区别？**
   - ApplicationContext 在 BeanFactory 基础上增加了更多功能，如事件发布、国际化等
   - ApplicationContext 在启动时会预实例化所有单例 Bean（除非配置懒加载）

2. **循环依赖是如何解决的？**
   - Spring 通过三级缓存解决循环依赖：
     - 一级缓存：singletonObjects，存放完全初始化的 Bean
     - 二级缓存：earlySingletonObjects，存放早期暴露的 Bean（未完成属性注入）
     - 三级缓存：singletonFactories，存放 Bean 工厂对象
   - 仅支持构造器注入的循环依赖无法解决

3. **Bean 的作用域有哪些？对生命周期的影响？**
   - singleton：默认作用域，整个容器只有一个实例
   - prototype：每次获取都创建新实例
   - request：每个 HTTP 请求创建一个实例
   - session：每个 HTTP Session 创建一个实例
   - application：每个 ServletContext 生命周期内一个实例
   - websocket：每个 WebSocket 会话一个实例

4. **如何自定义 Bean 的初始化顺序？**
   - 使用 @DependsOn 注解指定依赖关系
   - 实现 SmartInitializingSingleton 接口
   - 使用 @Order 注解或实现 Ordered 接口（对 BeanPostProcessor 有效）

5. **Bean 的懒加载机制如何工作？**
   - 通过 @Lazy 注解或 lazy-init="true" 配置
   - 首次请求时才会触发完整的生命周期
   - 适用于初始化成本高或不一定会用到的 Bean

### 版本差异说明：
- **Spring 2.5**：引入 @PostConstruct 和 @PreDestroy 注解（JSR-250）
- **Spring 3.0**：增强对 Java 配置的支持
- **Spring 4.0**：改进条件化 Bean 注册
- **Spring 5.0**：支持函数式 Bean 注册，响应式编程支持

### 最佳实践建议：
1. 初始化逻辑尽量放在 @PostConstruct 方法中，避免实现 Spring 特定接口
2. 销毁资源时使用 @PreDestroy，确保资源正确释放
3. 谨慎使用 BeanPostProcessor，避免性能问题
4. 理解不同作用域的生命周期差异，避免内存泄漏
5. 合理使用懒加载优化应用启动时间
