---
title: "看过源码吗？说下 Spring 由哪些重要的模块组成？"
published: 2026-04-22
draft: false
description: ""
tags: [note]
---
# 看过源码吗？说下 Spring 由哪些重要的模块组成？

【核心定义】  
Spring 是一个轻量级的、分层的、一站式 Java 开发框架，其核心模块通过 IoC（控制反转）和 AOP（面向切面编程）实现解耦与高效开发。

【关键要点】  
1. **Spring Core Container（核心容器）**  
   - 包含 `spring-core`、`spring-beans`、`spring-context`、`spring-expression`（SpEL）等子模块。  
   - 提供 IoC 容器（`BeanFactory` 与 `ApplicationContext`）实现对象的创建、配置与管理。  

2. **AOP 与 Instrumentation（面向切面编程）**  
   - `spring-aop` 提供切面编程支持，基于代理实现日志、事务等横切关注点。  
   - `spring-aspects` 集成 AspectJ 注解支持。  

3. **Data Access/Integration（数据访问与集成）**  
   - `spring-jdbc`：简化 JDBC 操作。  
   - `spring-orm`：集成 Hibernate、JPA 等 ORM 框架。  
   - `spring-tx`：声明式事务管理。  
   - `spring-oxm`：对象与 XML 映射支持。  

4. **Web 模块**  
   - `spring-web`：提供基础 Web 功能（如文件上传）。  
   - `spring-webmvc`：基于 Servlet 的 MVC 框架。  
   - `spring-websocket`：WebSocket 通信支持。  

5. **Test 模块**  
   - `spring-test`：支持 Junit 与 TestNG 集成测试，提供容器级测试环境。  

6. **Messaging（消息通信）**  
   - `spring-messaging`：为消息驱动架构提供基础抽象（如 `Message`、`MessageChannel`）。  

7. **其他关键模块**  
   - `spring-context-support`：集成缓存、邮件等第三方库。  
   - `spring-jms`：Java 消息服务支持。

【深度推导/细节】  
- **模块依赖关系**：Core Container 是基石，AOP 依赖 Core，Web 依赖 AOP 与 Context。  
- **设计哲学**：通过分层设计实现“高内聚低耦合”，例如 Data Access 模块将事务管理与具体 ORM 解耦，通过 `PlatformTransactionManager` 统一抽象。  
- **扩展机制**：`BeanPostProcessor`、`BeanFactoryPostProcessor` 等接口允许开发者介入 Bean 生命周期，实现自定义扩展（如 `@Autowired` 注解处理）。

【关联/对比】  
- **Spring vs Spring Boot**：Spring Boot 并非新模块，而是通过自动配置（`spring-boot-autoconfigure`）和起步依赖简化 Spring 模块的集成与部署。  
- **Spring MVC vs Spring WebFlux**：WebFlux 是响应式编程模型，基于 Reactor 库，适用于高并发非阻塞场景，与传统 Servlet 栈的 MVC 并行存在。

『面试官追问』  
1. **Spring 中 `BeanFactory` 和 `ApplicationContext` 的区别是什么？**  
   - `BeanFactory` 是基础 IoC 容器，提供懒加载；`ApplicationContext` 继承并扩展了它，支持事件发布、国际化、资源加载等企业级功能，默认预初始化单例 Bean。  
2. **Spring 如何解决循环依赖？**  
   - 仅对单例 Bean 且通过 setter/字段注入有效：通过三级缓存（`singletonObjects`、`earlySingletonObjects`、`singletonFactories`）提前暴露未完全初始化的 Bean 引用。  
3. **Spring 事务的实现原理？**  
   - 基于 AOP 动态代理（JDK 或 CGLib），在方法调用前后通过 `TransactionInterceptor` 管理事务边界，底层依赖 `DataSourceTransactionManager` 等具体实现。  

【版本差异】  
- **Spring 2.x**：引入注解驱动（`@Component`、`@Autowired`）。  
- **Spring 3.x**：全面支持 Java 5+ 注解，提供 `@Configuration` 配置类。  
- **Spring 4.x**：支持 Java 8 特性，增强条件化配置（`@Conditional`）。  
- **Spring 5.x**：引入响应式编程栈（WebFlux），支持 Kotlin，基准升级至 JDK 8+。  

（注：若需进一步深入特定模块（如 Core Container 的 Bean 生命周期、AOP 的代理机制），可继续展开逻辑拆解。）
