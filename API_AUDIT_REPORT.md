# SkyLink 系统 API 审查报告

> **生成时间**: 2025年12月22日  
> **审查标准**: RESTful 资源路径规范 `/api/v1/{resource}`

---

## 📊 审查统计

| 项目 | 后端 | 前端 | 合计 |
|------|------|------|------|
| **API 端点总数** | 48 | 44 | 92 |
| **符合规范端点** | 39 | 27 | 66 |
| **问题端点** | 9 | 17 | 26 |
| **合规率** | 81.3% | 61.4% | 71.7% |

---

## ⚠️ 问题端点汇总

### 🔴 严重问题 - 动作后缀（违反 RESTful 核心原则）

| 位置 | 当前路径 | HTTP方法 | 问题描述 | 规范路径 |
|------|----------|----------|----------|----------|
| 前端 `order.ts` | `/api/v1/orders/create` | POST | `/create` 动作后缀 | `POST /api/v1/orders` |
| 前端 `order.ts` | `/api/v1/orders/search` | GET | `/search` 动作后缀 | `GET /api/v1/orders` |
| 前端 `order.ts` | `/api/v1/orders/{id}/cancel` | POST | `/cancel` 动作后缀 | `POST /api/v1/orders/{id}/cancellation` |
| 前端 `payment.ts` | `/api/v1/payments/pay` | POST | `/pay` 动作后缀 | `POST /api/v1/payments` |
| 前端 `payment.ts` | `/api/v1/payments/confirm-token` | POST | 非标准路径 | `POST /api/v1/payments/confirmation-tokens` |
| 前端 `payment.ts` | `/api/v1/payments/confirm` | POST | `/confirm` 动作后缀 | `POST /api/v1/payments/confirmations` |
| 前端 `refund.ts` | `/api/v1/refund-change/search` | GET | `/search` 动作后缀 | `GET /api/v1/refund-change-requests` |
| 前端 `refund.ts` | `/api/v1/refund-change/apply` | POST | `/apply` 动作后缀 | `POST /api/v1/refund-change-requests` |
| 前端 `search.ts` | `/flights/search` | GET | `/search` 后缀 + 缺少版本前缀 | `GET /api/v1/flights` |

---

### 🟠 中等问题 - 路径风格不一致

| 位置 | 当前路径 | 问题描述 | 规范路径 |
|------|----------|----------|----------|
| 后端 `AdminConfigController` | `/api/v1/admin/configs` | 单数 `admin` 与其他控制器 `admins` 不一致 | `/api/v1/admins/configs` |
| 前端 `refund.ts` | `/api/v1/refund-change/{id}` | 资源名 `refund-change` 应为 `refund-change-requests` | `/api/v1/refund-change-requests/{id}` |

---

### 🟡 一般问题 - 缺少 API 版本前缀

| 位置 | 当前路径 | HTTP方法 | 规范路径 |
|------|----------|----------|----------|
| 前端 `auth.ts` | `/auth/login` | POST | `POST /api/v1/users/sessions` |
| 前端 `auth.ts` | `/auth/phone-register` | POST | `POST /api/v1/users` |
| 前端 `auth.ts` | `/api/v1/auth/user/me` | GET | `GET /api/v1/users/me` |
| 前端 `auth.ts` | `/api/v1/auth/user/profile` | PUT | `PUT /api/v1/users/me` |
| 前端 `auth.ts` | `/api/v1/auth/user/email/send-code` | POST | `POST /api/v1/users/me/email-verification-codes` |
| 前端 `auth.ts` | `/api/v1/auth/user/email` | PUT | `PUT /api/v1/users/me/email` |
| 前端 `auth.ts` | `/api/v1/auth/user/phone/send-code` | POST | `POST /api/v1/users/me/phone-verification-codes` |
| 前端 `auth.ts` | `/api/v1/auth/user/phone` | PUT | `PUT /api/v1/users/me/phone` |
| 前端 `auth.ts` | `/api/v1/auth/user/password` | PUT | `PUT /api/v1/users/me/password` |

---

### 🔵 轻微问题 - `/count` 统计端点

> 注：`/count` 作为统计端点在实践中较常见，可考虑保留或改为 `/statistics`

| 位置 | 当前路径 | 建议路径 |
|------|----------|----------|
| 后端 `AdminController` | `GET /api/v1/admins/count` | `GET /api/v1/admins?count=true` 或保留 |
| 后端 `AdminController` | `GET /api/v1/admins/system-configs/count` | `GET /api/v1/admins/system-configs?count=true` |
| 后端 `AdminController` | `GET /api/v1/admins/operation-logs/count` | `GET /api/v1/admins/operation-logs?count=true` |
| 后端 `AdminController` | `GET /api/v1/admins/user-behavior-stats/count` | `GET /api/v1/admins/user-behavior-stats?count=true` |
| 后端 `AdminController` | `GET /api/v1/admins/refund-change-requests/count` | `GET /api/v1/admins/refund-change-requests?count=true` |
| 后端 `GlobalController` | `GET /api/v1/metrics/flights/count` | `GET /api/v1/metrics/flights` |
| 后端 `TradeController` | `GET /api/v1/metrics/orders/count` | `GET /api/v1/metrics/orders` |
| 后端 `TradeController` | `GET /api/v1/metrics/payments/count` | `GET /api/v1/metrics/payments` |
| 后端 `TradeController` | `GET /api/v1/metrics/refunds/count` | `GET /api/v1/metrics/refunds` |

---

## ✅ 后端规范端点清单

### 认证与用户模块

| HTTP方法 | 路径 | 描述 | 控制器 |
|----------|------|------|--------|
| POST | `/api/v1/users/sessions` | 用户登录（创建会话） | AuthController |
| POST | `/api/v1/admins/sessions` | 管理员登录（创建会话） | AdminController |
| POST | `/api/v1/users` | 用户注册 | UserController |
| GET | `/api/v1/users/me` | 获取当前用户信息 | UserController |
| PUT | `/api/v1/users/me` | 更新当前用户信息 | UserController |
| PUT | `/api/v1/users/me/password` | 修改密码 | UserController |
| POST | `/api/v1/users/me/contacts` | 绑定联系方式 | UserController |

### 航班模块

| HTTP方法 | 路径 | 描述 | 控制器 |
|----------|------|------|--------|
| GET | `/api/v1/flights` | 航班搜索（用户端） | FlightController |
| POST | `/api/v1/flights` | 创建航班 | FlightController |
| GET | `/api/v1/admins/flights` | 航班列表（管理员端） | AdminFlightController |
| POST | `/api/v1/admins/flights` | 创建航班（管理员端） | AdminFlightController |
| PUT | `/api/v1/admins/flights/{flightId}` | 修改航班 | AdminFlightController |
| DELETE | `/api/v1/admins/flights/{flightId}` | 删除航班 | AdminFlightController |

### 订单模块

| HTTP方法 | 路径 | 描述 | 控制器 |
|----------|------|------|--------|
| GET | `/api/v1/orders` | 订单搜索 | OrderController |
| POST | `/api/v1/orders` | 创建订单 | OrderController |
| POST | `/api/v1/orders/{orderId}/cancellation` | 取消订单 | OrderController |
| GET | `/api/v1/admins/orders` | 订单列表（管理员端） | AdminOrderController |
| PUT | `/api/v1/admins/orders/{orderId}` | 更新订单状态 | AdminOrderController |
| PUT | `/api/v1/admins/orders/{orderId}/cancellation` | 取消订单（管理员端） | AdminOrderController |
| DELETE | `/api/v1/admins/orders/{orderId}` | 删除订单 | AdminOrderController |
| POST | `/api/v1/admins/orders/{orderId}/audits` | 审核订单 | AdminOrderController |

### 支付模块

| HTTP方法 | 路径 | 描述 | 控制器 |
|----------|------|------|--------|
| GET | `/api/v1/payments` | 支付搜索 | PaymentController |
| POST | `/api/v1/payments` | 创建支付 | PaymentController |
| POST | `/api/v1/payments/confirmation-tokens` | 创建支付确认令牌 | PaymentController |
| POST | `/api/v1/payments/confirmations` | 确认支付 | PaymentController |

### 退改模块

| HTTP方法 | 路径 | 描述 | 控制器 |
|----------|------|------|--------|
| GET | `/api/v1/refund-change-requests` | 退改请求搜索 | RefundChangeController |
| POST | `/api/v1/refund-change-requests` | 申请退改 | RefundChangeController |
| POST | `/api/v1/refund-change-requests/{recordId}/approvals` | 批准退改 | RefundChangeController |
| POST | `/api/v1/refund-change-requests/{recordId}/rejections` | 拒绝退改 | RefundChangeController |
| DELETE | `/api/v1/refund-change-requests/{recordId}` | 撤销退改请求 | RefundChangeController |
| PUT | `/api/v1/refund-change-requests/{recordId}` | 更新待处理请求 | RefundChangeController |

### 预订模块

| HTTP方法 | 路径 | 描述 | 控制器 |
|----------|------|------|--------|
| POST | `/api/v1/bookings` | 提交订单（下单） | BookingController |
| GET | `/api/v1/bookings` | 查询预订列表 | BookingController |

### 管理员用户管理

| HTTP方法 | 路径 | 描述 | 控制器 |
|----------|------|------|--------|
| GET | `/api/v1/admins/users` | 用户列表 | AdminUserController |
| POST | `/api/v1/admins/users` | 创建用户 | AdminUserController |
| PUT | `/api/v1/admins/users/{userId}` | 更新用户信息 | AdminUserController |
| PUT | `/api/v1/admins/users/{userId}/password` | 重置用户密码 | AdminUserController |
| DELETE | `/api/v1/admins/users/{userId}` | 删除用户 | AdminUserController |

### 系统模块

| HTTP方法 | 路径 | 描述 | 控制器 |
|----------|------|------|--------|
| GET | `/api/v1/system/health` | 健康检查 | DbTestController |
| GET | `/api/v1/system/db-connection` | 数据库连接测试 | DbTestController |
| GET | `/api/v1/admins/dashboards/metrics` | 仪表盘指标 | AdminDashboardController |

---

## 📋 修改建议方案

### 一、后端修改（1处）

#### 1. AdminConfigController 路径修正

**文件**: `AdminConfigController.java`

```java
// 修改前
@RequestMapping("/api/v1/admin/configs")

// 修改后
@RequestMapping("/api/v1/admins/configs")
```

---

### 二、前端修改（17处）

#### 1. auth.ts - 用户认证相关

| 函数 | 当前 URL | 修正为 |
|------|----------|--------|
| `loginApi` | `/auth/login` | `/api/v1/users/sessions` |
| `registerApi` | `/auth/phone-register` | `/api/v1/users` |
| `getMyProfile` | `/api/v1/auth/user/me` | `/api/v1/users/me` |
| `updateMyProfile` | `/api/v1/auth/user/profile` | `/api/v1/users/me` |
| `sendEmailCode` | `/api/v1/auth/user/email/send-code` | `/api/v1/users/me/email-verification-codes` |
| `bindEmail` | `/api/v1/auth/user/email` | `/api/v1/users/me/email` |
| `sendPhoneCode` | `/api/v1/auth/user/phone/send-code` | `/api/v1/users/me/phone-verification-codes` |
| `bindPhone` | `/api/v1/auth/user/phone` | `/api/v1/users/me/phone` |
| `changePassword` | `/api/v1/auth/user/password` | `/api/v1/users/me/password` |

#### 2. search.ts - 航班搜索

| 函数 | 当前 URL | 修正为 |
|------|----------|--------|
| `searchFlights` | `/flights/search` | `/api/v1/flights` |

#### 3. order.ts - 订单相关

| 函数 | 当前 URL | 修正为 |
|------|----------|--------|
| `createOrder` | `/api/v1/orders/create` | `/api/v1/orders` |
| `searchOrders` | `/api/v1/orders/search` | `/api/v1/orders` |
| `cancelOrder` | `/api/v1/orders/{id}/cancel` | `/api/v1/orders/{id}/cancellation` |

#### 4. payment.ts - 支付相关

| 函数 | 当前 URL | 修正为 |
|------|----------|--------|
| `payOrder` | `/api/v1/payments/pay` | `/api/v1/payments` |
| `createPaymentConfirmToken` | `/api/v1/payments/confirm-token` | `/api/v1/payments/confirmation-tokens` |
| `confirmPayment` | `/api/v1/payments/confirm` | `/api/v1/payments/confirmations` |

#### 5. refund.ts - 退改相关

| 函数 | 当前 URL | 修正为 |
|------|----------|--------|
| `listRefundChanges` | `/api/v1/refund-change/search` | `/api/v1/refund-change-requests` |
| `applyRefundChange` | `/api/v1/refund-change/apply` | `/api/v1/refund-change-requests` |
| `revokeRefundChange` | `/api/v1/refund-change/{id}` | `/api/v1/refund-change-requests/{id}` |
| `updateRefundChange` | `/api/v1/refund-change/{id}` | `/api/v1/refund-change-requests/{id}` |

---

## 🎯 优先级建议

| 优先级 | 修改内容 | 影响范围 | 工作量 |
|--------|----------|----------|--------|
| **P0** | 前端订单/支付/退改 API 路径 | 核心业务流程 | 中 |
| **P1** | 前端用户认证 API 路径 | 登录注册流程 | 中 |
| **P2** | 后端 AdminConfigController 路径 | 管理端配置 | 低 |
| **P3** | `/count` 端点统一 | 统计功能 | 低（可选） |

---

## ✅ 规范设计亮点

1. **版本化 API** - 所有路径以 `/api/v1/` 开头 ✅
2. **复数资源名** - `users`, `flights`, `orders`, `payments`, `bookings` ✅
3. **子资源设计** - `/users/me`, `/orders/{id}/cancellation`, `/admins/flights` ✅
4. **会话资源化** - 使用 `/sessions` 代替 `/login` ✅
5. **HTTP 方法正确** - CRUD 操作对应 GET/POST/PUT/DELETE ✅

---

*报告结束*
