---
title: "Cookie、Session、Token 之间有什么区别？"
published: 2026-04-22
draft: false
description: ""
tags: [note]
---
# Cookie、Session、Token 之间有什么区别？

# Cookie、Session、Token 的区别

## 【核心定义】
Cookie、Session、Token 是三种不同的 Web 身份认证与状态管理机制，分别通过客户端存储、服务端存储和令牌验证来解决 HTTP 无状态协议下的用户身份识别问题。

## 【关键要点】
1. **存储位置不同**
   - **Cookie**：存储在客户端浏览器中，每次请求自动携带在 HTTP 头部。
   - **Session**：存储在服务器端（内存、数据库或缓存），客户端仅保存 Session ID（通常通过 Cookie 存储）。
   - **Token**：存储在客户端（LocalStorage、Cookie 或内存），由客户端主动在请求时携带（通常在 Authorization 头部）。

2. **安全性对比**
   - **Cookie**：易受 XSS 和 CSRF 攻击，可通过 `HttpOnly`、`Secure`、`SameSite` 属性增强安全。
   - **Session**：服务端存储敏感信息，相对安全，但需防范 Session 劫持和固定攻击。
   - **Token**：无状态，签名防篡改，但需妥善保管防止泄露，天然防御 CSRF。

3. **扩展性与性能**
   - **Cookie**：受单域名 4KB 限制，数量有限制，每次请求自动携带可能增加带宽消耗。
   - **Session**：服务端存储带来扩展性问题，集群环境下需 Session 共享方案。
   - **Token**：无状态，天然支持分布式，服务端无需存储，适合 RESTful API 和微服务架构。

4. **生命周期管理**
   - **Cookie**：通过 `Expires`/`Max-Age` 设置过期时间，可持久化存储。
   - **Session**：服务端控制过期，支持滑动过期和绝对过期。
   - **Token**：通过 payload 中的 `exp` 声明设置过期时间，可结合 Refresh Token 实现无感刷新。

## 【深度推导/细节】

### 1. **Session 的工作原理与性能瓶颈**
```
Step 1: 用户登录 → 服务端创建 Session 对象并生成唯一 Session ID
Step 2: 服务端将 Session ID 通过 Set-Cookie 返回给客户端
Step 3: 客户端后续请求自动携带 Cookie（含 Session ID）
Step 4: 服务端根据 Session ID 查找对应的 Session 数据
Step 5: 验证通过后返回响应
```
**性能瓶颈**：高并发时服务端存储压力大，集群环境需要 Session 复制或集中存储（Redis），增加了架构复杂度。

### 2. **Token（JWT）的签名验证机制**
```javascript
// JWT 结构：Header.Payload.Signature
// 签名生成：HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), secret)
```
**安全要点**：
- 签名确保 Token 不被篡改，但内容本身是 Base64 编码的明文
- 不应在 Token 中存储敏感信息
- Secret 密钥需严格保管，定期轮换

### 3. **Cookie 的安全加固策略**
```http
Set-Cookie: sessionId=abc123; 
HttpOnly;     // 防止 XSS 读取
Secure;       // 仅 HTTPS 传输
SameSite=Strict; // 防御 CSRF
Max-Age=3600; // 过期时间
```

## 【关联/对比】

| 特性 | Cookie | Session | Token (JWT) |
|------|--------|---------|-------------|
| **存储位置** | 客户端 | 服务端 | 客户端 |
| **网络传输** | 自动携带 | 仅传 ID | 手动携带 |
| **状态管理** | 客户端状态 | 服务端状态 | 无状态 |
| **扩展性** | 好 | 差（需共享） | 优秀 |
| **CSRF 防御** | 需 SameSite | 需额外措施 | 天然防御 |
| **XSS 风险** | 高（可 HttpOnly） | 低 | 高（需妥善存储） |
| **适用场景** | 简单状态保持 | 传统 Web 应用 | API/微服务/移动端 |

**现代实践演进**：
- **传统方案**：Session + Cookie（适合服务端渲染的 Web 应用）
- **SPA/移动端**：JWT + LocalStorage/HttpOnly Cookie
- **混合方案**：Session 存储在 Redis，客户端使用 HttpOnly Cookie 存储 Session ID
- **OAuth 2.0**：基于 Token 的授权框架，Access Token + Refresh Token 组合

## 『面试官追问』

1. **为什么 JWT 比 Session 更适合微服务架构？**
   - 无状态特性：每个服务可独立验证 Token，无需共享 Session 存储
   - 减少网络开销：避免服务间频繁查询 Session 存储
   - 权限信息自包含：Token payload 可包含用户角色和权限，减少额外查询

2. **如何防止 JWT Token 被盗用后的滥用？**
   - 设置较短的过期时间（如 15-30 分钟）
   - 使用 Refresh Token 机制，Access Token 过期后需用 Refresh Token 获取新 Token
   - 维护 Token 黑名单（部分场景）
   - 结合 IP 绑定或设备指纹

3. **Cookie 的 SameSite 属性有什么作用？**
   - `SameSite=Strict`：完全禁止第三方 Cookie，防御 CSRF 最严格
   - `SameSite=Lax`：允许部分安全请求（如导航）携带 Cookie
   - `SameSite=None`：允许所有跨站请求，但必须同时设置 `Secure`

4. **Session 在分布式环境下如何共享？**
   - **Session 复制**：各节点同步 Session（性能差，不推荐）
   - **集中存储**：Redis/Memcached 存储 Session（主流方案）
   - **粘性 Session**：Nginx IP Hash 保证同一用户访问同一节点（非真正共享）

5. **Token 存储在 LocalStorage 和 Cookie 各有什么优劣？**
   - **LocalStorage**：容量大（5MB），易受 XSS，需手动处理携带逻辑
   - **Cookie**：自动携带，可设置 HttpOnly 防 XSS，但容量小（4KB），易受 CSRF
   - **最佳实践**：Access Token 存内存，Refresh Token 存 HttpOnly Cookie

## 【版本差异与演进】

- **传统 Web 1.0/2.0**：Session + Cookie 是标准方案
- **SPA/前后端分离**：JWT 成为主流，配合 OAuth 2.0
- **现代安全要求**：SameSite Cookie 成为默认（Chrome 80+），HttpOnly 成为标配
- **无密码认证**：WebAuthn 等新标准开始普及，减少对传统认证的依赖

## 【实战建议】

1. **选择依据**：
   - 传统 Web 应用：Session + HttpOnly Cookie + CSRF Token
   - API/微服务：JWT + 短过期时间 + Refresh Token
   - 高安全要求：多因素认证 + 设备绑定 + 行为分析

2. **安全基线**：
   - 始终使用 HTTPS
   - Cookie 必须设置 HttpOnly 和 Secure
   - JWT 使用强密钥，定期轮换
   - 实施速率限制和异常检测

3. **性能优化**：
   - Session 使用 Redis 集群，设置合理过期时间
   - JWT payload 尽量精简，避免存储过多数据
   - 考虑使用无状态 Session（加密 Cookie 存储用户数据）

---

**总结**：三种机制各有适用场景，现代应用常采用混合方案。核心原则是：理解业务需求，平衡安全与性能，遵循最小权限原则，持续监控和更新安全策略。
