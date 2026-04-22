---
title: "你了解的 Spring 都用到哪些设计模式？"
published: 2026-04-22
draft: false
description: ""
tags: [note]
---
# 你了解的 Spring 都用到哪些设计模式？

# Spring 框架中常用的设计模式

## 【核心定义】
Spring 框架在其核心架构和各个模块中，系统性地应用了多种经典设计模式，这些模式共同支撑了Spring的IoC、AOP等核心特性，使其具备高度的灵活性、可扩展性和可维护性。

## 【关键要点】
1. **工厂模式（Factory Pattern）**
   - **结论**：Spring IoC容器的核心实现模式。
   - **原理简述**：`BeanFactory`和`ApplicationContext`是Spring的核心工厂接口，负责创建和管理Bean对象。开发者无需直接`new`对象，而是通过配置（XML或注解）告诉工厂如何创建，由工厂负责实例化、依赖注入和生命周期管理，实现了控制反转。

2. **单例模式（Singleton Pattern）**
   - **结论**：Spring Bean的默认作用域实现方式。
   - **原理简述**：Spring容器默认将每个Bean定义映射到单个对象实例。这个单例由Spring容器自身维护（不同于传统单例模式中由类自身维护），存储在容器的单例缓存（`singletonObjects`）中，确保了应用上下文中该Bean的唯一性，同时避免了全局变量污染。

3. **代理模式（Proxy Pattern）**
   - **结论**：Spring AOP和事务管理的底层实现基石。
   - **原理简述**：Spring AOP通过JDK动态代理（基于接口）或CGLIB字节码增强（基于类子类化）为目标对象创建代理。当调用目标方法时，会经过代理对象，从而可以在方法执行前后插入切面逻辑（如日志、事务），实现非侵入式的横切关注点。

4. **模板方法模式（Template Method Pattern）**
   - **结论**：Spring简化重复性样板代码的利器。
   - **原理简述**：在`JdbcTemplate`、`RestTemplate`、`TransactionTemplate`等类中广泛应用。父类定义了算法骨架（如获取连接、执行SQL、处理异常、释放资源），而将某些步骤的具体实现延迟到子类或通过回调接口（如`RowMapper`）由使用者提供，消除了冗余代码。

5. **观察者模式（Observer Pattern）**
   - **结论**：Spring事件驱动模型的基础。
   - **原理简述**：通过`ApplicationEvent`（事件）、`ApplicationListener`（监听器）和`ApplicationEventPublisher`（发布者）实现。当容器中发生特定事件（如上下文刷新、请求处理完成）时，容器作为发布者会通知所有注册的监听器，实现模块间的松耦合通信。

6. **适配器模式（Adapter Pattern）**
   - **结论**：Spring MVC处理多种控制器类型的核心。
   - **原理简述**：`HandlerAdapter`是典型应用。Spring MVC的`DispatcherServlet`并不直接调用`@Controller`、`Controller`接口或`HttpRequestHandler`等不同类型的处理器。而是通过不同的`HandlerAdapter`（如`RequestMappingHandlerAdapter`）将它们适配成统一的调用接口，使核心流程与具体处理器类型解耦。

7. **装饰器模式（Decorator Pattern）**
   - **结论**：Spring动态增强Bean功能的手段之一。
   - **原理简述**：在`BeanDefinition`装饰、AOP包装以及`HttpServletRequest`/`Response`的包装中有所体现。例如，Spring通过`BeanDefinitionDecorator`来装饰Bean的定义；在Web层，通过`HttpServletRequestWrapper`对原生请求进行包装，添加额外功能而不改变其接口。

8. **策略模式（Strategy Pattern）**
   - **结论**：Spring在多种可互换算法场景下的选择。
   - **原理简述**：例如，资源加载的`ResourceLoader`策略、AOP代理创建策略（`DefaultAopProxyFactory`根据条件选择JDK或CGLIB）、缓存抽象（`CacheManager`的不同实现）等。定义统一的策略接口，使得算法可以独立于客户端而变化。

## 【深度推导/细节】
**核心矛盾：如何在不侵入业务代码的前提下，实现强大的横切功能和灵活的Bean管理？**
- **逻辑拆解**：
  1. **问题**：传统代码中，事务管理、日志等逻辑与业务代码高度耦合，难以复用和维护。
  2. **解决方案**：Spring采用**代理模式**作为AOP的底层支撑。
  3. **实现过程**：
     - **Step 1**: 根据配置的切点（Pointcut），Spring AOP框架识别出需要被增强的Bean。
     - **Step 2**: 如果目标对象实现了至少一个接口，则默认使用**JDK动态代理**，通过`Proxy.newProxyInstance()`创建实现相同接口的代理对象。
     - **Step 3**: 如果目标对象没有实现接口，则使用**CGLIB库**，通过生成目标类的子类来创建代理。
     - **Step 4**: 代理对象内部持有目标对象（或方法拦截器链）。当客户端调用方法时，调用被代理对象拦截，并执行关联的增强通知（Advice，如`@Before`, `@Around`）。
  4. **结果**：业务类（Target）对增强逻辑无感知，实现了完美的解耦。这是Spring声明式事务等高级特性的基础。

## 【关联/对比】
- **Spring单例 vs. GoF单例**：
  - **范围**：Spring单例是**容器级单例**，一个Bean在同一个Spring容器内只有一个实例；GoF单例是**JVM级单例**，一个类在JVM生命周期内只有一个实例。
  - **管理方**：Spring单例由**IoC容器创建和管理**；GoF单例由**类自身静态方法控制**。
  - **灵活性**：Spring单例可以通过修改Bean定义（如改为`prototype`）轻松改变作用域；GoF单例模式硬编码在类中，难以修改。
- **模板方法模式 vs. 策略模式**：
  - **模板方法**：在**父类中定义算法骨架**，部分步骤由子类实现。属于**类行为型模式**，强调通过继承实现代码复用。
  - **策略模式**：定义**一族可互换的算法**，并将其封装成独立的策略类。属于**对象行为型模式**，强调通过组合和委托，在运行时动态切换算法。Spring的`PlatformTransactionManager`不同实现就是策略模式的典型。

## 『面试官追问』
1.  **Spring默认使用单例Bean，它是线程安全的吗？如何保证线程安全？**
    - **答案**：Spring不保证单例Bean的线程安全。Bean的线程安全性完全取决于其自身的状态设计。如果Bean是**无状态的**（只有方法，没有可变的成员变量），则天然线程安全。如果是有状态的，则需要开发者自己通过**同步机制**、使用`ThreadLocal`或将Bean作用域改为`request`/`prototype`来保证安全。

2.  **Spring AOP在什么情况下用JDK动态代理，什么情况下用CGLIB？**
    - **答案**：
      - **JDK动态代理**：默认策略。**要求目标类至少实现一个接口**。代理对象会实现与该接口相同的方法。
      - **CGLIB代理**：当**目标类没有实现任何接口**时使用。通过生成目标类的子类来创建代理，因此不能代理`final`类或`final`方法。
      - **强制CGLIB**：可以通过配置`<aop:config proxy-target-class="true">`或`@EnableAspectJAutoProxy(proxyTargetClass = true)`强制使用CGLIB，即使有接口。这在需要代理类本身而非接口方法，或需要调用`this`方法触发切面时有用。

3.  **除了提到的，Spring中还用了哪些设计模式？（考察知识广度）**
    - **建造者模式（Builder）**：`BeanDefinitionBuilder`、`UriComponentsBuilder`用于复杂对象的逐步构建。
    - **责任链模式（Chain of Responsibility）**：Spring Security的过滤器链（`FilterChain`）、Spring MVC的拦截器链（`HandlerInterceptor`）。
    - **访问者模式（Visitor）**：在解析注解或Bean定义时，用于对元素结构进行操作。
    - **原型模式（Prototype）**：对应Bean的`prototype`作用域，每次请求都返回一个新的实例副本。

4.  **工厂模式（BeanFactory）和工厂方法模式（Factory Method）在Spring中都有体现吗？**
    - **答案**：是的。
      - **工厂模式（简单/静态工厂）**：`BeanFactory`是典型的工厂模式，它作为一个巨大的对象工厂，根据客户端请求（Bean名称/类型）返回对象。
      - **工厂方法模式**：在`FactoryBean`接口中体现得尤为明显。实现了`FactoryBean`的类本身是一个工厂，其`getObject()`方法就是工厂方法，用于创建复杂的、不能直接通过简单构造器实例化的对象（如集成MyBatis的`SqlSessionFactoryBean`）。

## 【版本差异】
- **Spring 3.0+**：引入了基于注解的配置，大量使用`@Bean`注解的方法，这本质上是**工厂方法模式**在Java配置类中的体现。
- **Spring 4.x/5.x**：对响应式编程的支持（WebFlux）引入了新的模式应用，例如在响应式流处理中广泛使用了**观察者模式**的变体（Reactive Streams规范）。
- **Spring Boot**：其自动配置（Auto-configuration）机制，大量运用了**条件化装配**，这可以看作是**策略模式**与**模板方法模式**的混合体，根据类路径、环境等条件选择不同的配置策略。
