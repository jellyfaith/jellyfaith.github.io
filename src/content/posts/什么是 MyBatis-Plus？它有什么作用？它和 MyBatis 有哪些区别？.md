---
title: "什么是 MyBatis-Plus？它有什么作用？它和 MyBatis 有哪些区别？"
published: 2026-04-22
draft: false
description: ""
tags: [note]
---
# 什么是 MyBatis-Plus？它有什么作用？它和 MyBatis 有哪些区别？

# MyBatis-Plus 面试标准答案

## 【核心定义】
MyBatis-Plus 是一个基于 MyBatis 的增强工具，它在不改变 MyBatis 核心功能的前提下，通过内置的通用 CRUD 操作、条件构造器、分页插件等，极大地简化了持久层开发。

## 【关键要点】
1. **核心定位**：MyBatis 的增强框架，旨在简化开发、提高效率。
2. **核心功能**：
   - 内置通用 Mapper 和 Service，实现单表 CRUD 零 SQL 编写
   - 强大的条件构造器（QueryWrapper、UpdateWrapper）
   - 支持 Lambda 表达式查询
   - 内置分页插件（支持多种数据库）
   - 代码生成器（自动生成 Entity、Mapper、Service、Controller）
   - SQL 注入器（支持自定义全局方法）
3. **设计原则**：只做增强不做改变，引入它不会对现有 MyBatis 工程产生影响。

## 【深度推导/细节】

### 1. 条件构造器的实现原理
```java
// 传统 MyBatis 需要编写 XML 或注解 SQL
@Select("SELECT * FROM user WHERE age > #{age} AND name LIKE #{name}")
List<User> findUsers(@Param("age") Integer age, @Param("name") String name);

// MyBatis-Plus 使用条件构造器
QueryWrapper<User> wrapper = new QueryWrapper<>();
wrapper.gt("age", 18).like("name", "张");
List<User> users = userMapper.selectList(wrapper);
```

**底层实现**：
- `QueryWrapper` 内部维护 `List<SqlSegment>` 存储条件片段
- 通过 `AbstractWrapper` 的 `apply()` 方法动态拼接 SQL
- 最终生成 `WHERE age > 18 AND name LIKE '%张%'`

### 2. 通用 Mapper 的魔法
```java
// 只需继承 BaseMapper 即可获得完整 CRUD 方法
public interface UserMapper extends BaseMapper<User> {
    // 无需编写任何方法
}

// 直接使用
userMapper.selectById(1);
userMapper.insert(user);
userMapper.updateById(user);
```

**实现机制**：
- 通过 MyBatis 的 `MapperProxy` 动态代理
- `SqlMethod` 枚举定义了所有基础 SQL 模板
- `SqlSource` 动态生成 SQL 语句

### 3. 分页插件的拦截器设计
```java
@Configuration
public class MybatisPlusConfig {
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.MYSQL));
        return interceptor;
    }
}
```

**执行流程**：
```
Step 1: 执行查询前，PaginationInnerInterceptor 拦截
Step 2: 判断是否需要分页（Page 参数存在）
Step 3: 改写原始 SQL，添加 COUNT(*) 查询和 LIMIT 语句
Step 4: 执行改写后的 SQL
Step 5: 将结果封装到 Page 对象中
```

## 【关联/对比】

### MyBatis vs MyBatis-Plus 核心区别

| 对比维度 | MyBatis | MyBatis-Plus |
|---------|---------|-------------|
| **CRUD 操作** | 需要手动编写 SQL/XML | 内置通用 CRUD，零 SQL |
| **条件查询** | 需要写 @Select 注解或 XML | 提供条件构造器 |
| **代码生成** | 需要第三方插件 | 内置代码生成器 |
| **分页支持** | 需要手动编写分页 SQL | 内置分页插件 |
| **性能监控** | 需要集成第三方 | 提供 SQL 性能分析插件 |
| **学习成本** | 较高，需要掌握 XML 配置 | 较低，API 友好 |
| **灵活性** | 极高，完全控制 SQL | 较高，但某些复杂 SQL 仍需自定义 |

### 与 JPA/Hibernate 的对比
- **MyBatis-Plus**：SQL 友好型，开发者对 SQL 有完全控制权
- **JPA**：对象关系映射更彻底，但复杂查询性能可能不如原生 SQL
- **选择依据**：项目是否需要精细控制 SQL 执行

## 『面试官追问』

### Q1：MyBatis-Plus 的乐观锁如何实现？
**回答要点**：
1. 在实体类字段添加 `@Version` 注解
2. 配置乐观锁插件
3. 更新时自动带上版本条件
```java
@Bean
public MybatisPlusInterceptor optimisticLockerInterceptor() {
    MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
    interceptor.addInnerInterceptor(new OptimisticLockerInnerInterceptor());
    return interceptor;
}
```

### Q2：多租户场景下 MyBatis-Plus 如何处理？
**回答要点**：
1. 使用 `TenantLineInnerInterceptor` 租户拦截器
2. 自动在 SQL 中添加租户条件
3. 支持忽略特定表或操作

### Q3：MyBatis-Plus 的性能损耗如何？
**回答要点**：
1. 条件构造器通过字符串拼接，有轻微性能损耗
2. 分页插件需要执行 COUNT 查询，复杂查询可能影响性能
3. 可通过关闭某些功能（如 SQL 性能分析）优化性能

### Q4：复杂联表查询如何处理？
**回答要点**：
1. 使用 `@Select` 注解编写自定义 SQL
2. 使用 XML 映射文件
3. 结合 MyBatis-Plus 的条件构造器进行条件拼接
```java
@Select("SELECT u.*, d.dept_name FROM user u LEFT JOIN dept d ON u.dept_id = d.id ${ew.customSqlSegment}")
List<User> selectUserWithDept(@Param(Constants.WRAPPER) Wrapper<User> wrapper);
```

### Q5：MyBatis-Plus 3.x 与 2.x 的主要区别？
**回答要点**：
1. **包名变更**：`com.baomidou` 保持不变，但内部结构重构
2. **条件构造器**：3.x 使用 `LambdaQueryWrapper`，类型安全
3. **主键生成策略**：增加更多内置策略
4. **SQL 注入器**：更灵活的扩展机制
5. **性能优化**：底层实现优化，减少反射使用

## 【最佳实践建议】
1. **简单查询**：优先使用条件构造器
2. **复杂查询**：使用自定义 SQL 或 XML
3. **分页查询**：统一使用 Page 对象，保持一致性
4. **事务管理**：结合 Spring 的 `@Transactional`
5. **性能监控**：生产环境开启 SQL 执行时间分析

## 【总结】
MyBatis-Plus 是 MyBatis 的强力补充，它通过提供开箱即用的通用功能，显著提升了开发效率。对于以单表操作为主、需要快速开发的中小型项目尤为适合。但在处理极端复杂的多表关联查询时，仍需回归 MyBatis 的原生能力。选择与否的关键在于项目对 SQL 控制精度和开发效率的权衡。
