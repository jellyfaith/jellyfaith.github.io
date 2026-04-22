---
title: "Spring MVC 具体的工作原理？"
published: 2026-04-22
draft: false
description: ""
tags: [note]
---
# Spring MVC 具体的工作原理？

# Spring MVC 工作原理面试标准答案

## 【核心定义】
Spring MVC 是基于 Java 的请求驱动型 Web 框架，通过**前端控制器模式**（DispatcherServlet）统一接收 HTTP 请求，并依据**模型-视图-控制器**（MVC）架构进行分层处理，最终返回响应。

## 【关键要点】
1. **前端控制器统一入口**  
   DispatcherServlet 作为唯一入口，拦截所有匹配的 HTTP 请求，是整个流程的调度中心。

2. **组件化职责分离**  
   通过 HandlerMapping、HandlerAdapter、ViewResolver 等组件各司其职，实现高度解耦和可扩展性。

3. **基于注解的配置驱动**  
   使用 `@Controller`、`@RequestMapping` 等注解声明处理器和映射关系，简化开发。

4. **灵活的视图解析机制**  
   支持 JSP、Thymeleaf、FreeMarker 等多种视图技术，通过 ViewResolver 适配不同渲染方式。

5. **与 Spring 容器无缝集成**  
   MVC 组件作为 Spring IoC 容器中的 Bean 被管理，可自动注入依赖并享受 AOP 等能力。

## 【深度推导/细节】

### 请求处理全流程（逻辑拆解）
**Step 1 – 请求接收与分发**  
DispatcherServlet 接收 HTTP 请求后，调用 `doDispatch()` 方法启动处理流水线。

**Step 2 – 处理器映射**  
查询所有已注册的 HandlerMapping（如 `RequestMappingHandlerMapping`），根据 URL、HTTP 方法等匹配到对应的 `@Controller` 方法（HandlerMethod）。

**Step 3 – 处理器适配与执行**  
通过 HandlerAdapter（如 `RequestMappingHandlerAdapter`）执行处理器方法，期间完成：
- 参数绑定（@RequestParam、@RequestBody 等）
- 数据验证（@Valid）
- 调用实际业务逻辑

**Step 4 – 模型处理与视图解析**  
处理器返回 ModelAndView 或纯数据（@ResponseBody）：
- 若返回视图名，由 ViewResolver 解析为具体 View 对象
- 若返回 JSON/XML，由 HttpMessageConverter 直接序列化响应

**Step 5 – 渲染与响应**  
View 对象渲染模型数据（如填充 JSP 模板），生成最终 HTTP 响应返回客户端。

### 核心矛盾处理
**1. 多 HandlerMapping 的冲突解决**  
Spring 按注册顺序查询，默认优先级：`RequestMappingHandlerMapping` > `BeanNameUrlHandlerMapping` > `SimpleUrlHandlerMapping`。

**2. 参数绑定的灵活性与安全性**  
- 支持 Servlet API、POJO、@RequestParam 等多类型参数
- 通过 `WebDataBinder` 进行类型转换与数据校验
- 使用 `@InitBinder` 可定制绑定规则

**3. 同步 vs 异步处理**  
Spring MVC 3.2+ 支持 DeferredResult 和 Callable 实现异步非阻塞处理，避免线程池阻塞。

## 【关联/对比】

### Spring MVC vs Spring WebFlux
| 维度 | Spring MVC | Spring WebFlux |
|------|------------|----------------|
| 编程模型 | 基于 Servlet API（同步阻塞） | 基于 Reactive Streams（异步非阻塞） |
| 并发模型 | 每个请求占用一个线程（线程池） | 事件循环（少量线程处理大量连接） |
| 适用场景 | 传统 CRUD、同步业务 | 高并发 I/O 密集型、实时流处理 |

### Spring MVC vs Struts2
- **入口差异**：Spring MVC 前端控制器为 DispatcherServlet；Struts2 为 Filter（StrutsPrepareAndExecuteFilter）
- **集成度**：Spring MVC 与 Spring 容器深度集成；Struts2 相对独立
- **线程安全**：Spring MVC 控制器默认单例（需注意状态管理）；Struts2 Action 为每次请求创建实例

## 『面试官追问』

1. **DispatcherServlet 在 web.xml 中如何配置？与 ContextLoaderListener 的关系是什么？**
   - DispatcherServlet 配置自己的 WebApplicationContext（子容器），通常加载控制器、视图解析器等 MVC 相关 Bean
   - ContextLoaderListener 创建根 WebApplicationContext（父容器），加载服务层、数据层等共享 Bean
   - 子容器可以访问父容器的 Bean，反之不行

2. **@Controller 和 @RestController 的区别？**
   - @Controller 标识的类方法默认返回视图名，需要配合 @ResponseBody 才返回数据
   - @RestController = @Controller + @ResponseBody，所有方法直接返回 JSON/XML 等数据

3. **拦截器（Interceptor）与过滤器（Filter）的执行顺序和区别？**
   - **执行顺序**：Filter → DispatcherServlet → Interceptor → Controller
   - **区别**：
     - Filter 属于 Servlet 规范，可拦截所有请求；Interceptor 是 Spring MVC 组件，仅拦截进入 DispatcherServlet 的请求
     - Interceptor 可获取 HandlerMethod 等 Spring 上下文信息；Filter 只能获取 Servlet API 对象
     - Interceptor 可通过 `preHandle`、`postHandle`、`afterCompletion` 精细控制

4. **Spring MVC 如何实现文件上传？**
   - 配置 MultipartResolver（如 CommonsMultipartResolver 或 StandardServletMultipartResolver）
   - 使用 `@RequestParam("file") MultipartFile` 接收文件
   - 通过 `transferTo()` 方法保存到服务器

5. **如何处理全局异常？**
   - 使用 `@ControllerAdvice` + `@ExceptionHandler` 定义全局异常处理器
   - 可针对不同异常类型返回特定错误视图或 JSON 响应
   - 优先级高于处理器内部的 `@ExceptionHandler`

## 【版本差异】
- **Spring 2.5**：引入注解驱动（@Controller、@RequestMapping）
- **Spring 3.0**：全面支持 REST，新增 `@PathVariable`、`@ResponseBody` 等
- **Spring 3.1**：引入 `@RequestBody` 和 `HttpEntity` 支持
- **Spring 3.2**：支持异步处理（DeferredResult、Callable）
- **Spring 4.0**：支持 Java 8 特性，优化 JSON 处理
- **Spring 5.0**：引入 WebFlux 响应式编程模型，MVC 继续维护

---

**回答要点总结**：Spring MVC 通过 DispatcherServlet 统一调度，利用组件化设计实现请求处理的流水线作业。掌握其核心流程、组件职责及版本演进，能清晰解释从请求到响应的完整生命周期，并对比相关技术框架的差异。
