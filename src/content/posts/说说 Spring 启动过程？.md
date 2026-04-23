---
title: "说说 Spring 启动过程？"
published: 2026-02-10
draft: false
description: ""
tags: [note]
---
# 说说 Spring 启动过程？

# Spring 启动过程详解

## 【核心定义】
Spring 启动过程本质上是 **IoC 容器的初始化过程**，它通过读取配置元数据、实例化 Bean、完成依赖注入和生命周期回调，最终构建出一个可用的应用程序上下文。

## 【关键要点】
1. **配置加载与解析**
   - Spring 启动始于 `ApplicationContext` 的创建，容器会加载 XML、Java Config 或注解等配置元数据。
   - 核心接口 `BeanDefinitionReader` 负责解析配置，将 `<bean>` 或 `@Bean` 转换为 `BeanDefinition` 对象，这是 Bean 的“蓝图”。

2. **BeanDefinition 注册**
   - 解析得到的 `BeanDefinition` 被注册到 `BeanFactory` 的 `beanDefinitionMap` 中，每个 Bean 都有唯一的名称标识。
   - 此时 Bean 尚未实例化，只是以定义的形式存储在容器中。

3. **BeanFactory 后置处理器执行**
   - 调用 `BeanFactoryPostProcessor`（如 `PropertySourcesPlaceholderConfigurer`）对 `BeanDefinition` 进行修改，例如替换 `${}` 占位符。
   - 这是容器允许外部修改 Bean 定义的扩展点。

4. **Bean 实例化与依赖注入**
   - 容器根据 `BeanDefinition` 通过反射（或 CGLIB）创建 Bean 实例，优先实例化单例且非懒加载的 Bean。
   - 依赖注入通过 `AutowiredAnnotationBeanPostProcessor` 等 `BeanPostProcessor` 完成，处理 `@Autowired`、`@Resource` 等注解。

5. **生命周期回调与初始化**
   - 执行 `InitializingBean` 的 `afterPropertiesSet()` 和自定义的 `init-method`。
   - `BeanPostProcessor` 的 `postProcessBeforeInitialization` 和 `postProcessAfterInitialization` 在此阶段被调用，AOP 代理通常在此生成。

6. **容器就绪与事件发布**
   - 容器初始化完成后，发布 `ContextRefreshedEvent` 事件，标志 Spring 上下文已完全就绪。
   - 此时 `ApplicationContext` 已包含所有完整的单例 Bean，可供应用程序使用。

## 【深度推导/细节】
### 核心矛盾：循环依赖的解决
Spring 通过 **三级缓存** 解决单例 Bean 的构造器循环依赖（仅限单例且非构造器注入）：
- **一级缓存** `singletonObjects`：存放完全初始化好的 Bean。
- **二级缓存** `earlySingletonObjects`：存放早期暴露的 Bean（已实例化但未填充属性）。
- **三级缓存** `singletonFactories`：存放 Bean 工厂，用于生成早期引用。

**解决步骤**：
1. Bean A 开始创建，实例化后放入三级缓存。
2. 填充属性时发现依赖 Bean B，触发 B 的创建。
3. Bean B 实例化后同样放入三级缓存，填充属性时发现依赖 A。
4. 从三级缓存中获取 A 的工厂，生成 A 的早期代理对象并放入二级缓存，返回给 B。
5. B 完成初始化，放入一级缓存。
6. A 获取到完整的 B，继续完成初始化，最终 A 也进入一级缓存。

### 性能优化关键点
- **懒加载（Lazy-init）**：减少启动时间，延迟 Bean 的创建到首次访问时。
- **Bean 定义合并**：父子容器的 Bean 定义会合并，避免重复解析。
- **缓存机制**：大量使用缓存存储 Bean 定义、元数据和已创建的 Bean。

## 【关联/对比】
- **BeanFactory vs ApplicationContext**：
  - `BeanFactory` 是基础 IoC 容器，提供基本的 Bean 管理功能。
  - `ApplicationContext` 是其扩展，添加了事件发布、国际化、AOP 集成等企业级功能，是实际使用的标准容器。
- **Spring Boot 启动差异**：
  - Spring Boot 通过 `SpringApplication.run()` 启动，内嵌 Web 容器，自动配置占主导。
  - 核心过程不变，但增加了自动配置类的加载（`@EnableAutoConfiguration`）、条件注解评估和 Starter 机制。

## 『面试官追问』
1. **Spring 如何解决构造器注入的循环依赖？**
   - 答：Spring **无法解决**构造器注入的循环依赖，会直接抛出 `BeanCurrentlyInCreationException`。因为构造器注入要求在实例化时就完成依赖注入，而双方都处于创建中，无法满足此条件。

2. **BeanFactoryPostProcessor 和 BeanPostProcessor 的区别？**
   - `BeanFactoryPostProcessor` 操作 **Bean 的定义**（`BeanDefinition`），在 Bean 实例化之前执行。
   - `BeanPostProcessor` 操作 **Bean 的实例**，在 Bean 初始化前后执行，用于定制化修改或包装 Bean。

3. **Spring 容器关闭时发生了什么？**
   - 容器关闭时，会发布 `ContextClosedEvent` 事件。
   - 调用单例 Bean 的 `DisposableBean.destroy()` 或自定义的 `destroy-method`。
   - 执行所有注册的 `DestructionAwareBeanPostProcessor`。

4. **Spring Boot 的自动配置是如何工作的？**
   - 通过 `@EnableAutoConfiguration` 触发，加载 `META-INF/spring.factories` 中的自动配置类。
   - 利用 `@Conditional` 系列注解（如 `@ConditionalOnClass`）按条件决定是否生效。
   - 最终将符合条件的配置类中的 `@Bean` 方法注册到容器中。

## 【版本差异】
- **Spring 2.5**：引入注解驱动开发（`@Component`、`@Autowired`）。
- **Spring 3.0**：全面支持 Java Config（`@Configuration`）。
- **Spring 4.0**：支持条件化配置（`@Conditional`），为 Spring Boot 奠基。
- **Spring 5.0**：引入响应式编程模型（WebFlux），支持 Kotlin。
- **Spring 6.0**：要求 JDK 17+，提供 AOT（Ahead-Of-Time）编译支持，为 GraalVM 原生镜像优化。

---

**总结**：Spring 启动是一个**分层级、可扩展的初始化流水线**。它通过定义（BeanDefinition）与实例（Bean）分离、后置处理器扩展点、三级缓存解决依赖等设计，平衡了**灵活性、性能与复杂度**。理解此过程是掌握 Spring 框架核心机制的基础。
