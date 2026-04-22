---
title: "简述 MyBatis 的插件运行原理，以及如何编写一个插件？"
published: 2026-04-22
draft: false
description: ""
tags: [note]
---
# 简述 MyBatis 的插件运行原理，以及如何编写一个插件？

# MyBatis 插件运行原理与编写指南

## 【核心定义】
MyBatis 插件是基于 JDK 动态代理和责任链模式实现的拦截器机制，允许用户在 SQL 执行的生命周期关键节点进行自定义拦截和增强。

## 【关键要点】
1. **拦截器接口**：所有插件必须实现 `Interceptor` 接口，核心方法是 `intercept()`（执行拦截逻辑）和 `plugin()`（生成代理对象）。
2. **责任链模式**：多个插件按配置顺序形成拦截链，通过 `Plugin.wrap()` 方法层层包装目标对象。
3. **四大可拦截对象**：`Executor`（执行器）、`StatementHandler`（语句处理器）、`ParameterHandler`（参数处理器）、`ResultSetHandler`（结果集处理器）。
4. **注解声明**：通过 `@Intercepts` 和 `@Signature` 注解指定要拦截的方法签名（类、方法、参数类型）。
5. **配置加载**：插件在 MyBatis 初始化时通过 XML 或注解配置加载，并插入到相应组件的代理链中。

## 【深度推导/细节】

### 插件初始化与代理链构建流程
**Step 1 - 配置解析**：MyBatis 解析配置文件时，将 `<plugin>` 标签定义的拦截器实例化并存入 `InterceptorChain`。

**Step 2 - 目标对象包装**：当创建四大核心对象时（如 `Executor`），调用 `InterceptorChain.pluginAll()`：
```java
// 简化逻辑
for (Interceptor interceptor : interceptors) {
    target = interceptor.plugin(target); // 层层包装
}
```

**Step 3 - 动态代理生成**：`Plugin.wrap()` 方法核心逻辑：
- 通过 `@Signature` 注解匹配目标对象的方法
- 若匹配成功，则用 `Plugin` 作为 `InvocationHandler` 创建 JDK 动态代理
- 代理对象的方法调用会被路由到 `interceptor.intercept()`

**Step 4 - 方法拦截执行**：当代理对象方法被调用时：
1. 进入 `Plugin.invoke()` 方法
2. 检查方法是否匹配拦截签名
3. 匹配则调用 `interceptor.intercept(Invocation)`
4. 通过 `Invocation.proceed()` 继续执行责任链中的下一个拦截器或原方法

### 关键设计要点
- **性能考量**：通过精确的方法签名匹配避免不必要的代理开销，只有声明的方法会被拦截。
- **执行顺序**：插件按配置顺序形成“洋葱模型”，先配置的插件在外层，后配置的在内层。
- **线程安全**：插件实例通常是单例的，需确保 `intercept()` 方法内的线程安全。

## 【关联/对比】
- **与 Spring AOP 对比**：MyBatis 插件是专门针对其四大组件的轻量级拦截，而 Spring AOP 提供更通用的切面编程能力。
- **与 MyBatis 拦截器链对比**：不同于 Spring 的拦截器，MyBatis 插件链是静态的，在初始化时确定，运行时不可变。
- **与 PageHelper 分页插件关系**：PageHelper 是 MyBatis 插件的典型应用，通过拦截 `Executor` 的查询方法实现自动分页。

## 『面试官追问』
1. **插件可以拦截哪些方法？为什么是这四大对象？**
   - 这四大对象覆盖了 SQL 执行的全生命周期：参数处理 → SQL 组装 → 执行 → 结果映射。
   - 设计上遵循“最小侵入原则”，只暴露必要的扩展点。

2. **多个插件的执行顺序是怎样的？**
   - 按配置文件中的声明顺序执行，形成嵌套代理。
   - 示例：配置了插件A、B，则调用链为：A.intercept → B.intercept → 原方法 → B.after → A.after。

3. **如何防止插件死循环？**
   - 在 `intercept()` 中调用 `invocation.proceed()` 而非直接调用目标方法。
   - `Plugin` 会确保每个插件只被同一方法调用一次。

4. **插件能修改 SQL 语句吗？如何实现？**
   - 可以，通过拦截 `StatementHandler.prepare()` 方法。
   - 获取 `BoundSql` 对象，修改其中的 SQL 字符串和参数映射。

## 【插件编写实战示例】

### 1. 编写自定义插件
```java
@Intercepts({
    @Signature(
        type = StatementHandler.class,
        method = "prepare",
        args = {Connection.class, Integer.class}
    )
})
public class SqlCostInterceptor implements Interceptor {
    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        long start = System.currentTimeMillis();
        try {
            return invocation.proceed(); // 执行原方法
        } finally {
            long cost = System.currentTimeMillis() - start;
            StatementHandler handler = (StatementHandler) invocation.getTarget();
            String sql = handler.getBoundSql().getSql();
            System.out.println("SQL执行耗时: " + cost + "ms, SQL: " + sql);
        }
    }
    
    @Override
    public Object plugin(Object target) {
        return Plugin.wrap(target, this); // 标准包装方法
    }
    
    @Override
    public void setProperties(Properties properties) {
        // 接收配置参数
    }
}
```

### 2. 配置文件注册
```xml
<plugins>
    <plugin interceptor="com.example.SqlCostInterceptor">
        <property name="threshold" value="1000"/>
    </plugin>
</plugins>
```

### 3. 版本差异说明
- **MyBatis 3.4.0+**：支持默认方法拦截，接口的默认方法也会被代理。
- **MyBatis 3.5+**：对插件机制进行了优化，提供了更清晰的错误提示。
- **历史版本**：早期版本中插件配置顺序对某些方法的拦截有影响，新版已优化。

### 4. 最佳实践与注意事项
- **性能影响**：避免在插件中执行耗时操作，尤其是频繁调用的方法。
- **线程安全**：如果插件有状态，需考虑线程同步或使用 ThreadLocal。
- **谨慎修改**：修改 SQL 或参数时需确保语法正确性，避免破坏原有逻辑。
- **测试覆盖**：务必测试插件的各种边界情况，特别是与其他插件共存时。

---

**总结**：MyBatis 插件机制通过精妙的责任链和动态代理设计，在保证核心执行效率的同时，提供了高度可扩展的拦截能力。编写插件时需精准定义拦截点，注意执行顺序和线程安全，避免对性能产生显著影响。
