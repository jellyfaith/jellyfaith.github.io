---
title: "什么是 Spring Boot？"
published: 2026-04-22
draft: false
description: ""
tags: [note]
---
# 什么是 Spring Boot？

【核心定义】  
Spring Boot 是一个基于 Spring 框架的快速开发脚手架，通过约定大于配置和自动装配机制，简化了 Spring 应用的初始搭建和开发过程。

【关键要点】  
1. **约定大于配置**：Spring Boot 提供了一套默认配置（如内嵌服务器、默认日志框架），开发者无需手动配置即可快速启动项目。  
2. **自动装配（Auto-Configuration）**：通过 `@EnableAutoConfiguration` 或 `spring.factories` 文件，根据类路径下的依赖自动配置 Bean，减少 XML 或 Java 显式配置。  
3. **内嵌容器**：默认集成 Tomcat、Jetty 或 Undertow，应用可打包为独立 JAR 文件直接运行，无需部署到外部 Web 服务器。  
4. **起步依赖（Starter）**：通过 Maven/Gradle 依赖管理，一键引入功能模块（如 `spring-boot-starter-web` 包含 Web 开发所需全部依赖），解决版本冲突问题。  
5. **生产就绪特性**：提供 Actuator 模块监控应用健康状态、指标收集，以及外部化配置（如 `application.yml`）支持多环境部署。

【深度推导/细节】  
- **自动装配原理**：  
  - Step 1: Spring Boot 启动时扫描 `META-INF/spring.factories` 文件，加载 `org.springframework.boot.autoconfigure.EnableAutoConfiguration` 指定的配置类。  
  - Step 2: 配置类通过 `@Conditional` 系列注解（如 `@ConditionalOnClass`、`@ConditionalOnMissingBean`）判断条件是否满足，动态注册 Bean。  
  - Step 3: 例如，当类路径存在 `Servlet.class` 和 `Tomcat.class` 时，自动配置内嵌 Tomcat 服务器。  
- **配置优先级**：Spring Boot 支持外部化配置，优先级顺序为：命令行参数 > 系统环境变量 > `application-{profile}.yml` > `application.yml`，便于灵活切换开发/生产环境。

【关联/对比】  
- **与传统 Spring MVC 对比**：  
  - Spring MVC 需手动配置 DispatcherServlet、视图解析器、数据库连接等；Spring Boot 通过 Starter 和自动装配零配置启动。  
  - Spring Boot 内嵌容器，传统 Spring 应用需部署到外部 Tomcat。  
- **与 Spring Cloud 关系**：Spring Boot 是微服务架构的基础，Spring Cloud 基于 Boot 提供分布式系统工具（如服务发现、配置中心）。

『面试官追问』  
1. Spring Boot 如何实现自动装配？请说明 `@SpringBootApplication` 注解的组成。  
2. Spring Boot 启动流程是怎样的？  
3. 如何自定义 Starter？  
4. Spring Boot 有哪些核心配置文件？优先级如何？  
5. Spring Boot 2.x 与 1.x 的主要区别是什么？

【版本差异】  
- **Spring Boot 1.x**：基于 Spring 4，配置主要通过 `application.properties`，Actuator 端点较少。  
- **Spring Boot 2.x**：基于 Spring 5，支持响应式编程（WebFlux），默认使用 HikariCP 连接池，Actuator 端点更丰富且默认启用安全控制。  
- **Spring Boot 3.x**：基于 Spring 6 和 Jakarta EE 9+，要求 Java 17+，全面转向 GraalVM 原生镜像支持。

【直击痛点】  
- **内嵌容器默认端口**：8080（可通过 `server.port` 修改）。  
- **自动装配条件注解**：如 `@ConditionalOnClass` 确保类路径存在时才生效，避免配置冲突。  
- **配置占位符**：`${}` 支持动态属性注入，如 `@Value("${app.name}")`。  

（注：本题未涉及数据结构、核心算法、多线程等，故相关模块未展开。若需深入 Spring Boot 的并发处理或性能优化机制，可进一步探讨其异步处理、线程池配置等。）
