---
title: "Spring Boot 是如何通过 main 方法启动 web 项目的？"
published: 2026-04-22
draft: false
description: ""
tags: [note]
---
# Spring Boot 是如何通过 main 方法启动 web 项目的？

# Spring Boot 通过 main 方法启动 Web 项目的机制

## 【核心定义】
Spring Boot 通过其内嵌的 Servlet 容器（如 Tomcat、Jetty 或 Undertow）和 Spring 容器的自动装配机制，在标准的 Java `main` 方法中实现了 Web 应用的独立启动，从而无需部署到外部应用服务器。

## 【关键要点】
1. **程序入口与启动类**：`main` 方法作为 Java 应用的统一入口，Spring Boot 应用的主类通常使用 `@SpringBootApplication` 注解标记，并调用 `SpringApplication.run()` 方法。
2. **内嵌 Servlet 容器**：Spring Boot 通过 `spring-boot-starter-web` 依赖引入了内嵌的 Servlet 容器（默认是 Tomcat），该容器作为一个库被打包在应用内，而非外部独立进程。
3. **Spring 容器的创建与刷新**：`SpringApplication.run()` 会引导创建 Spring 的 `ApplicationContext`（通常是 `AnnotationConfigServletWebServerApplicationContext`），并触发其 `refresh()` 方法，完成 Bean 的加载、实例化和依赖注入。
4. **自动装配与条件化配置**：通过 `@EnableAutoConfiguration` 机制（包含在 `@SpringBootApplication` 中），Spring Boot 根据类路径下的依赖自动配置 Servlet 容器、DispatcherServlet 等 Web 组件。
5. **Servlet 容器的启动**：在 Spring 容器刷新过程的最后阶段，会触发 `ServletWebServerApplicationContext` 的 `onRefresh()` 方法，该方法会创建并启动内嵌的 Servlet 服务器实例。

## 【深度推导/细节】
### 启动流程的逐步拆解（逻辑复现）
**Step 1: 执行 main 方法**
```java
@SpringBootApplication
public class MyApplication {
    public static void main(String[] args) {
        SpringApplication.run(MyApplication.class, args);
    }
}
```
`SpringApplication.run()` 是一个静态工厂方法，它会创建一个 `SpringApplication` 实例并调用其 `run` 方法。

**Step 2: SpringApplication 初始化与运行**
- **初始化阶段**：`SpringApplication` 构造函数会推断应用类型（Servlet、Reactive 或 None），设置初始的 `ApplicationContextInitializer` 和 `ApplicationListener`。
- **运行阶段**：`run()` 方法的核心步骤如下：
    1. **准备环境**：创建并配置 `StandardServletEnvironment`，加载 `application.properties/yml` 等配置文件。
    2. **创建应用上下文**：根据应用类型创建对应的 `ApplicationContext`。对于基于 Servlet 的 Web 应用，会创建 `AnnotationConfigServletWebServerApplicationContext`。
    3. **刷新应用上下文**：调用 `context.refresh()`。这是整个启动过程的核心，它触发了 Spring 容器的标准生命周期。

**Step 3: Spring 容器的刷新与内嵌容器的启动**
`AbstractApplicationContext.refresh()` 是一个模板方法，其中与 Web 启动最相关的步骤是：
1. **`invokeBeanFactoryPostProcessors`**：处理所有 `BeanFactoryPostProcessor`，这包括解析 `@Configuration` 类、处理 `@ComponentScan` 等。**关键点**：`ConfigurationClassPostProcessor` 会处理 `@SpringBootApplication` 注解，进而触发 `@EnableAutoConfiguration` 的导入。
2. **`registerBeanPostProcessors`**：注册 `BeanPostProcessor`，为后续 Bean 的实例化和初始化做准备。
3. **`onRefresh`**：这是一个**关键钩子方法**，在 `ServletWebServerApplicationContext` 中被重写。其内部逻辑是：
    - 调用 `createWebServer()` 方法。
    - 该方法会从 `ServletWebServerFactory`（例如 `TomcatServletWebServerFactory`） Bean 中获取一个 `WebServer`。
    - 工厂 Bean 会创建内嵌 Tomcat 实例，配置 Connector（默认端口 8080）、Engine、Host 和 Context，并将根上下文设置为 `ServletContext`。
    - 调用 `webServer.start()`，启动 Tomcat 的 NIO 线程池，开始监听端口。

**Step 4: DispatcherServlet 的注册**
- 在自动配置类 `DispatcherServletAutoConfiguration` 中，会向 Servlet 容器注册一个 `DispatcherServlet` Bean，并将其映射到 “/” （或由 `spring.mvc.servlet.path` 配置的路径）。
- 这个 `DispatcherServlet` 在初始化时，会从根 `ApplicationContext` 中查找 `HandlerMapping`、`HandlerAdapter` 等 Bean，建立完整的 Spring MVC 处理链。

## 【关联/对比】
- **与传统 Spring MVC 项目对比**：
    | 方面 | 传统 Spring MVC (WAR 包) | Spring Boot (JAR 包) |
    | :--- | :--- | :--- |
    | **部署方式** | 需要打包成 WAR，部署到外部的 Tomcat、WebLogic 等服务器。 | 打包成可执行 JAR，包含内嵌容器，通过 `java -jar` 直接运行。 |
    | **启动方式** | 由外部 Servlet 容器调用 `ServletContainerInitializer` 或 `web.xml` 来引导 Spring 容器。 | 由 `main` 方法直接引导，先启动 Spring 容器，再由 Spring 容器启动内嵌 Servlet 容器。 |
    | **配置复杂度** | 需要配置 `web.xml` 或 `ServletContainerInitializer`，以及 Spring 的上下文加载器。 | 零配置或约定大于配置，通过自动装配完成。 |
- **与 Spring Cloud 等微服务框架的关系**：Spring Boot 的独立启动能力是构建微服务的基础。Spring Cloud 在此之上增加了服务发现、配置中心等分布式系统能力，但其每个微服务本身仍然是一个独立的 Spring Boot 应用。

## 【直击痛点：关键设计与数字】
- **默认端口 8080**：这是 Servlet 容器的通用非特权端口，可在 `application.properties` 中通过 `server.port` 修改。
- **内嵌容器的选择与排除**：通过 `spring-boot-starter-web` 默认引入 Tomcat。若要使用 Jetty 或 Undertow，只需在依赖中排除 `spring-boot-starter-tomcat` 并引入对应的 starter。这体现了 Spring Boot **“约定优于配置”** 和 **“可替换性”** 的设计思想。
- **启动速度优化**：Spring Boot 2.x 以后，通过**分层架构**（如将 Bean 定义按使用频率分层）和**Spring Context Indexer**（编译时生成索引）等技术，加速了大型应用的启动过程。

## 『面试官追问』
1.  **Spring Boot 是如何决定使用哪种内嵌容器的？**
    > 答：Spring Boot 通过类路径检测来决定。`SpringApplication` 在启动时会推断应用类型。如果类路径下存在 `Servlet`、`ConfigurableWebApplicationContext` 以及特定的服务器类（如 `org.apache.catalina.startup.Tomcat`），则推断为 Servlet Web 应用，并进一步根据存在的具体服务器类来实例化对应的 `ServletWebServerFactory`。这个过程由 `WebApplicationType` 枚举和 `ServletWebServerApplicationContext` 中的 `createWebServer` 方法协作完成。

2.  **`@SpringBootApplication` 注解背后包含了哪些注解？各自的作用是什么？**
    > 答：它是一个复合注解，主要包含三个核心注解：
    > 1.  `@SpringBootConfiguration`：本质是 `@Configuration`，表明该类是一个 Spring 配置类。
    > 2.  `@EnableAutoConfiguration`：**核心**，启用 Spring Boot 的自动配置机制。它通过 `@Import(AutoConfigurationImportSelector.class)` 导入选择器，该选择器会读取 `META-INF/spring.factories` 文件（Spring Boot 2.7+ 后为 `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`）中 `EnableAutoConfiguration` 键下的所有自动配置类，并根据条件注解（如 `@ConditionalOnClass`）决定是否生效。
    > 3.  `@ComponentScan`：启用组件扫描，默认扫描主类所在包及其子包下的 `@Component`, `@Service`, `@Repository`, `@Controller` 等注解的类。

3.  **在 `main` 方法启动过程中，Spring 容器和 Servlet 容器的启动顺序是怎样的？是否存在相互依赖？**
    > 答：**顺序是：先启动 Spring 容器，在 Spring 容器刷新过程的末尾启动 Servlet 容器。** 存在单向依赖。Spring 容器需要先完成 Bean 定义的加载和基本 Bean 的实例化（特别是 `ServletWebServerFactory` 和相关的配置 Bean），然后才能为 Servlet 容器提供必要的配置和 `DispatcherServlet`。Servlet 容器启动后，其生命周期由 Spring 容器管理。

4.  **如何自定义或修改内嵌 Tomcat 的配置，比如线程池参数？**
    > 答：主要有三种方式：
    > 1.  **配置文件**：在 `application.properties` 中使用 `server.tomcat.*` 前缀的属性进行配置，例如 `server.tomcat.max-threads=200`。
    > 2.  **编程方式**：向容器中注册一个 `WebServerFactoryCustomizer<ConfigurableServletWebServerFactory>` 类型的 Bean，在 `customize` 方法中对 `TomcatConnectorCustomizer` 等进行详细配置。
    > 3.  **直接定义 Bean**：直接声明一个 `TomcatServletWebServerFactory` Bean，Spring Boot 的自动配置会尊重用户自定义的 Bean。

5.  **Spring Boot 2.x 和 1.x 在启动机制上有什么重大变化？**
    > 答：一个显著变化是 **Web 应用类型的推断和响应式编程的支持**。Spring Boot 2.x 引入了 `ReactiveWebApplicationContext`，能够区分 Servlet Web、Reactive Web 和非 Web 应用。此外，2.x 在自动配置的加载机制上做了优化（如使用 `spring.factories` 的 `AutoConfiguration.imports` 新格式），并对内嵌容器的 API 进行了重构，提供了更一致的 `WebServer` 抽象接口。
