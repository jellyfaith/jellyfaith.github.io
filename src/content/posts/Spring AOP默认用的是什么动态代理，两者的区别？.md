---
title: "Spring AOP默认用的是什么动态代理，两者的区别？"
published: 2026-03-17
draft: false
description: ""
tags: [note]
---
# Spring AOP默认用的是什么动态代理，两者的区别？

# Spring AOP默认动态代理机制详解

## 【核心定义】
Spring AOP默认根据目标对象是否实现接口来决定使用JDK动态代理（实现接口时）还是CGLIB代理（未实现接口时），从Spring 3.2+开始可以通过配置强制使用CGLIB。

## 【关键要点】
1. **代理选择逻辑**：目标类实现接口 → JDK动态代理；目标类未实现接口 → CGLIB代理
2. **JDK动态代理本质**：基于接口代理，运行时生成实现相同接口的代理类，核心是`java.lang.reflect.Proxy`
3. **CGLIB代理本质**：基于继承代理，运行时生成目标类的子类作为代理类，核心是`MethodInterceptor`
4. **配置优先级**：Spring Boot 2.0+默认使用CGLIB，可通过`spring.aop.proxy-target-class=true/false`控制

## 【深度推导/细节】

### 代理机制选择逻辑拆解
```java
// Spring AOP代理创建核心逻辑（简化版）
if (targetClass.isInterface() || Proxy.isProxyClass(targetClass)) {
    return new JdkDynamicAopProxy(config);
}
return new ObjenesisCglibAopProxy(config);
```

### 性能对比与选择考量
- **JDK动态代理**：
  - 优点：无需第三方库，Java标准库支持
  - 缺点：只能代理接口方法，反射调用有性能损耗
  - 生成代理类命名规则：`$Proxy0`、`$Proxy1`...

- **CGLIB代理**：
  - 优点：可代理类方法（包括非public方法），性能通常优于JDK代理
  - 缺点：需要额外依赖，final方法无法代理
  - 生成代理类命名规则：`TargetClass$$EnhancerByCGLIB$$...`

### 版本演进差异
| Spring版本 | 默认行为 | 关键变化 |
|-----------|---------|---------|
| Spring 1.x | 接口用JDK，类用CGLIB | 基础实现 |
| Spring 2.0 | 引入`proxy-target-class`配置 | 可强制指定 |
| Spring 3.2 | CGLIB集成到spring-core | 减少依赖 |
| Spring Boot 1.x | `proxy-target-class=false` | 默认JDK优先 |
| Spring Boot 2.x | `proxy-target-class=true` | 默认CGLIB |

## 【关联/对比】

### JDK动态代理 vs CGLIB 详细对比
| 维度 | JDK动态代理 | CGLIB代理 |
|------|------------|----------|
| 代理基础 | 接口实现 | 类继承 |
| 依赖 | JDK自带 | 需cglib库 |
| 性能 | 较慢（反射调用） | 较快（方法调用） |
| 限制 | 只能代理接口方法 | final类/方法无法代理 |
| 生成方式 | `Proxy.newProxyInstance()` | `Enhancer.create()` |
| 调用链 | `InvocationHandler.invoke()` | `MethodInterceptor.intercept()` |

### 与AspectJ的对比
- **Spring AOP**：运行时代理，仅支持方法级别的切面，依赖Spring容器
- **AspectJ**：编译时/加载时织入，支持字段、构造器、静态代码块等更多切点类型

## 『面试官追问』

### 高频问题清单
1. **为什么Spring Boot 2.x默认改用CGLIB？**
   - 统一代理方式，避免接口/类混合时的代理不一致问题
   - CGLIB性能优化（Spring 4.0+使用CGLIB的优化版本）

2. **如何强制指定使用某种代理？**
   ```java
   @EnableAspectJAutoProxy(proxyTargetClass = true)  // 强制CGLIB
   @EnableAspectJAutoProxy(proxyTargetClass = false) // 强制JDK（仅接口有效）
   ```

3. **CGLIB如何解决构造函数重复调用问题？**
   - 使用Objenesis库绕过构造函数直接实例化对象
   - Spring 4.0+默认启用此优化

4. **代理对象的方法调用流程是怎样的？**
   ```
   JDK代理：客户端 → 代理对象 → InvocationHandler → 目标方法
   CGLIB代理：客户端 → 代理对象 → MethodInterceptor → 目标方法
   ```

5. **什么情况下两种代理都会失效？**
   - 同一个类内部方法调用（this.method()）
   - 目标方法是final/static/private
   - 目标对象被多次代理且顺序不当

### 实战场景分析
```java
// 场景：Service内部调用AOP失效
@Service
public class UserService {
    public void outer() {
        this.inner();  // AOP切面不会生效！
    }
    
    @Transactional
    public void inner() {
        // 事务不会开启
    }
}
// 解决方案：注入自身代理或使用AopContext
```

### 性能优化建议
1. **代理选择策略**：
   - 纯接口项目：JDK动态代理
   - 混合或类代理：CGLIB
   - 高并发场景：考虑AspectJ编译时织入

2. **切面设计原则**：
   - 尽量减少切点匹配复杂度
   - 避免在切面中做耗时操作
   - 注意代理链长度对性能的影响

3. **监控与调试**：
   - 使用`spring.aop.proxy-target-class`日志级别查看代理选择
   - 通过`AopUtils.isCglibProxy()`判断代理类型

## 【最佳实践总结】
1. **统一性原则**：项目中保持代理方式一致
2. **明确配置**：显式声明`proxyTargetClass`避免歧义
3. **理解限制**：避免在无法代理的方法上使用AOP
4. **版本适配**：注意Spring Boot版本带来的默认行为变化
5. **性能测试**：关键路径进行两种代理的性能对比测试

这种设计体现了Spring的"约定优于配置"哲学，同时提供了足够的灵活性应对不同场景需求。
