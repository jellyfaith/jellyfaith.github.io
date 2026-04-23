---
title: "说说 Springboot 的启动流程？"
published: 2026-02-10
draft: false
description: ""
tags: [note]
---
# 说说 Springboot 的启动流程？

# Spring Boot 启动流程详解

## 【核心定义】
Spring Boot 启动流程本质上是基于 Spring 框架的自动化配置和容器初始化过程，通过 `SpringApplication.run()` 方法完成应用上下文创建、Bean 加载、自动配置及嵌入式 Web 服务器启动等核心操作。

## 【关键要点】
1. **启动入口与初始化**  
   - 调用 `SpringApplication.run(Class<?> primarySource, String... args)` 静态方法
   - 创建 `SpringApplication` 实例，初始化应用类型推断、初始化器、监听器列表

2. **运行阶段与事件驱动**  
   - 执行 `run()` 方法，通过 `SpringApplicationRunListeners` 发布生命周期事件
   - 关键事件顺序：`ApplicationStartingEvent` → `ApplicationEnvironmentPreparedEvent` → `ApplicationContextInitializedEvent` → `ApplicationPreparedEvent` → `ApplicationStartedEvent` → `ApplicationReadyEvent`

3. **环境准备与上下文创建**  
   - 加载 `application.properties/yml` 配置，创建 `ConfigurableEnvironment`
   - 根据 Web 应用类型创建对应的 `ApplicationContext`（Servlet 环境为 `AnnotationConfigServletWebServerApplicationContext`）

4. **Bean 加载与自动配置**  
   - 执行 `refresh()` 方法触发容器刷新
   - 通过 `@EnableAutoConfiguration` 触发 `spring.factories` 中自动配置类的加载
   - 执行 `Conditional` 条件注解进行配置类的选择性注册

5. **Web 服务器启动**  
   - 自动配置 `ServletWebServerFactory`，创建嵌入式 Tomcat/Jetty/Undertow 实例
   - 注册 DispatcherServlet 并启动 Web 服务器

## 【深度推导/细节】

### 启动流程的 7 个核心阶段（Step-by-Step）：
**Step 1 - 资源加载与推断**  
```java
// 1. 推断应用类型（Servlet/Reactive/None）
WebApplicationType.deduceFromClasspath();
// 2. 加载 META-INF/spring.factories 中的 ApplicationContextInitializer 和 ApplicationListener
setInitializers/getInitializersFromSpringFactories();
```

**Step 2 - 环境准备**  
- 创建 `StandardServletEnvironment` 并加载配置源
- 处理 `@PropertySource` 和 `spring.config.location` 外部配置
- **关键设计**：Profile 激活机制（`spring.profiles.active`）在此阶段确定

**Step 3 - 上下文创建**  
```java
// 根据应用类型创建对应上下文
context = createApplicationContext();
// Servlet 环境：AnnotationConfigServletWebServerApplicationContext
// Reactive 环境：AnnotationConfigReactiveWebServerApplicationContext
```

**Step 4 - 前置处理**  
- 执行 `ApplicationContextInitializer.initialize()` 扩展点
- 加载主配置类（`@SpringBootApplication` 标注的类）
- **核心机制**：`BeanDefinitionLoader` 将主类作为配置源注册

**Step 5 - 容器刷新（核心）**  
调用 `AbstractApplicationContext.refresh()`，包含 12 个子步骤：
1. `prepareRefresh()` - 设置启动时间、激活状态
2. `obtainFreshBeanFactory()` - 获取 BeanFactory
3. `prepareBeanFactory()` - 配置 BeanFactory（添加后置处理器等）
4. `postProcessBeanFactory()` - 子类扩展点
5. `invokeBeanFactoryPostProcessors()` - **关键步骤**：执行 `ConfigurationClassPostProcessor` 解析 `@Configuration` 类
6. `registerBeanPostProcessors()` - 注册 Bean 后置处理器
7. `initMessageSource()` - 国际化支持
8. `initApplicationEventMulticaster()` - 事件广播器
9. `onRefresh()` - **Spring Boot 扩展点**：创建 Web 服务器
10. `registerListeners()` - 注册监听器
11. `finishBeanFactoryInitialization()` - 初始化所有单例 Bean
12. `finishRefresh()` - 发布 `ContextRefreshedEvent`

**Step 6 - 自动配置执行逻辑**  
- `SpringFactoriesLoader.loadFactoryNames()` 加载 `org.springframework.boot.autoconfigure.EnableAutoConfiguration` 下的所有配置类
- 通过 `@ConditionalOnClass`、`@ConditionalOnMissingBean` 等条件注解过滤
- **执行顺序控制**：`@AutoConfigureOrder`、`@AutoConfigureBefore`、`@AutoConfigureAfter`

**Step 7 - Web 服务器启动**  
```java
// 1. 通过自动配置创建 TomcatServletWebServerFactory
// 2. 创建 WebServer 并启动
webServer = factory.getWebServer(servletContext -> {
    // 注册 DispatcherServlet
    ServletRegistration.Dynamic registration = 
        servletContext.addServlet("dispatcher", dispatcherServlet);
});
webServer.start();
```

## 【关联/对比】

### Spring Boot vs Spring MVC 启动差异
| 对比维度 | Spring Boot | 传统 Spring MVC |
|---------|------------|----------------|
| 配置方式 | 自动配置 + 条件装配 | XML/Java Config 显式配置 |
| 容器启动 | 嵌入式 Web 服务器 | 依赖外部 Tomcat 部署 |
| 依赖管理 | Starter POM 自动传递 | 手动管理依赖版本 |
| 部署方式 | 可执行 JAR | WAR 包部署 |

### Spring Boot 1.x vs 2.x 启动优化
- **事件模型改进**：2.x 引入 `ApplicationStartup` API 替代部分事件监听
- **响应式支持**：2.x 新增 `WebApplicationType.REACTIVE` 类型推断
- **性能优化**：2.x 延迟初始化支持（`spring.main.lazy-initialization=true`）

## 『面试官追问』

### 高频追问 1：自动配置的实现原理？
**答**：基于 `@EnableAutoConfiguration` 导入 `AutoConfigurationImportSelector`，该选择器通过 `SpringFactoriesLoader` 加载 `META-INF/spring.factories` 中注册的自动配置类，配合 `@Conditional` 系列注解实现条件装配。

### 高频追问 2：如何自定义启动扩展？
**答**：三种主要方式：
1. **ApplicationRunner/CommandLineRunner**：在应用就绪后执行
2. **ApplicationContextInitializer**：在上下文刷新前执行
3. **SpringApplicationRunListener**：监听启动生命周期事件

### 高频追问 3：Spring Boot 2.x 的响应式启动流程？
**答**：当检测到 `spring-webflux` 依赖时，应用类型推断为 `REACTIVE`，创建 `AnnotationConfigReactiveWebServerApplicationContext`，使用 `ReactiveWebServerFactory` 创建 Netty/Undertow 等响应式服务器。

### 高频追问 4：启动性能优化手段？
**答**：
- 启用延迟初始化：`spring.main.lazy-initialization=true`
- 排除不必要的自动配置：`@SpringBootApplication(exclude={...})`
- 使用 Spring Boot 2.4+ 的层次化属性源减少配置解析开销
- 关闭 JMX：`spring.jmx.enabled=false`

### 高频追问 5：如何调试启动失败问题？
**答**：
1. 启用调试日志：`--debug` 参数或 `logging.level.root=DEBUG`
2. 使用 `ConditionEvaluationReport`：通过 `ManagementEndpoint` 查看条件评估详情
3. 分析 `spring-boot-autoconfigure` 日志中的 `Positive matches/Negative matches`

---

**总结要点**：Spring Boot 启动流程的核心价值在于通过约定大于配置、自动装配和嵌入式容器的设计，将传统 Spring 应用的复杂配置和部署过程简化为“一键启动”。理解其事件驱动模型、条件装配机制和容器刷新过程，是掌握 Spring Boot 精髓的关键。
