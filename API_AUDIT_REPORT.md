# SkyLink API 审计报告 (后端完整版)

> **生成时间**: 2025年12月23日
> **扫描范围**: `skylink-backend` 所有 Controller 及 DTO
> **基础路径**: `http://localhost:9999` (默认)

---

## 📚 目录

1. [核心规范](#1-核心规范)
2. [认证模块 (Auth)](#2-认证模块-auth)
3. [用户模块 (User)](#3-用户模块-user)
4. [航班模块 (Flight)](#4-航班模块-flight)
5. [订单模块 (Order)](#5-订单模块-order)
6. [支付模块 (Payment)](#6-支付模块-payment)
7. [预订模块 (Booking)](#7-预订模块-booking)
8. [退改模块 (Refund)](#8-退改模块-refund)
9. [管理后台 - 用户管理](#9-管理后台---用户管理)
10. [管理后台 - 航班管理](#10-管理后台---航班管理)
11. [管理后台 - 订单管理](#11-管理后台---订单管理)
12. [管理后台 - 系统配置与监控](#12-管理后台---系统配置与监控)

---

## 1. 核心规范

### 通用响应结构
所有接口统一返回 `Result<T>` 结构：

```json
{
  "code": 0,          // 0 表示成功，非 0 表示失败
  "msg": "success",   // 提示信息
  "data": { ... }     // 具体的业务数据
}
```

### 认证方式
- **Header**: `Authorization: Bearer <token>` (用户/管理员通用)
- **Header (备用)**: `X-User-Id: <id>` (仅用于开发/测试环境或特定内部调用)
- **管理员特有 Header**:
  - `X-User-Type: 2` (必须，标识管理员身份)
  - `X-Admin-Role: 1` (普通管理员) 或 `2` (超级管理员)

---

## 2. 认证模块 (Auth)

### 2.1 用户登录
- **接口**: `POST /api/v1/users/sessions`
- **描述**: 创建用户会话 (登录)
- **请求体 (JSON)**:
  ```json
  {
      "phoneNumber": "13800138000", // 必填
      "password": "your_password"   // 必填
  }
  ```
- **响应数据**:
  ```json
  {
      "id": 1001,
      "displayName": "User_1001",
      "role": "user",
      "token": "eyJhbGciOiJIUzI1NiJ9..."
  }
  ```

### 2.2 管理员登录
- **接口**: `POST /api/v1/admins/sessions`
- **描述**: 管理员登录
- **请求体 (JSON)**:
  ```json
  {
      "adminAccount": "admin",      // 必填
      "password": "admin_password"  // 必填
  }
  ```
- **响应数据**:
  ```json
  {
      "id": 1,
      "displayName": "Super Admin",
      "role": "admin",
      "token": "...",
      "userType": 2,
      "adminRole": 2
  }
  ```

---

## 3. 用户模块 (User)

**认证要求**: `Authorization: Bearer <token>`

### 3.1 用户注册
- **接口**: `POST /api/v1/users`
- **描述**: 手机号注册
- **请求体**:
  ```json
  {
      "phoneNumber": "138XXXX",
      "password": "XXXX",
      "code": "1234" // 验证码
  }
  ```

### 3.2 获取个人信息
- **接口**: `GET /api/v1/users/me`
- **响应数据**:
  ```json
  {
      "userId": 1001,
      "phoneNumber": "138...",
      "email": "test@example.com",
      "realName": "张三",
      "idCard": "110...",
      "gender": 1,
      "avatarUrl": "http://...",
      "createTime": "2024-01-01T12:00:00"
  }
  ```

### 3.3 更新个人信息
- **接口**: `PUT /api/v1/users/me`
- **请求体**:
  ```json
  {
      "email": "new@example.com",
      "avatarUrl": "...",
      "gender": 1,
      "realName": "张三",
      "idCard": "..."
  }
  ```

### 3.4 修改密码
- **接口**: `PUT /api/v1/users/me/password`
- **请求体**:
  ```json
  {
      "oldPassword": "old_pass",
      "newPassword": "new_pass"
  }
  ```

### 3.5 绑定联系方式 (邮箱/手机)
- **接口**: `POST /api/v1/users/me/contacts`
- **请求体**:
  ```json
  {
      "value": "xx@xx.com", // 或手机号
      "code": "123456"      // 验证码
  }
  ```

---

## 4. 航班模块 (Flight)

### 4.1 搜索航班 (公开)
- **接口**: `GET /api/v1/flights`
- **参数 (Query)**:
  - `departurePlace`: 出发地
  - `destination`: 目的地
  - `departureDate`: 出发日期 (yyyy-MM-dd)
  - `page`: 页码 (默认1)
  - `size`: 分页大小 (默认10)
- **响应数据**:
  ```json
  {
      "flightNo": "CA1234",
      "departurePlace": "Beijing",
      "destination": "Shanghai",
      "departureTime": "2024-05-01T10:00:00",
      "arrivalTime": "2024-05-01T12:30:00",
      "price": 1200.50,
      "remainingSeats": 50,
      "airlineCompany": "Air China"
  }
  ```

### 4.2 创建航班 (仅限开发/测试用，不需要Auth?)
- **注意**: 此接口在 User 端 controller，但通常应该是 Admin 功能。
- **接口**: `POST /api/v1/flights`
- **请求体**: 见 10.2 节 Admin 创建航班部分。

---

## 5. 订单模块 (Order)

**认证要求**: `Authorization: Bearer <token>`

### 5.1 搜索订单
- **接口**: `GET /api/v1/orders`
- **参数**: `userId`, `orderNo`, `orderStatus`, `createTimeStart`...
- **响应数据 (列表项)**:
  ```json
  {
      "orderNo": "20240501xxxx",
      "flightNo": "CA1234",
      "passengerName": "张三",
      "totalAmount": 1200.00,
      "orderStatus": 1, // 0:待支付, 1:已支付, 2:已取消...
      "orderTime": "..."
  }
  ```

### 5.2 创建订单
- **接口**: `POST /api/v1/orders`
- **请求体**:
  ```json
  {
      "userId": 1001,
      "flightNo": "CA1234",
      "cabinType": "Economy",
      "ticketNum": 1,
      "passengerName": "张三",
      "contactEmail": "xx@xx.com",
      "contactPhone": "138...",
      "passengersJson": "[{...}]", // 详细乘机人列表
      "flightNos": ["CA1234", "MU5678"] // 联程票时填写
  }
  ```

### 5.3 取消订单
- **接口**: `POST /api/v1/orders/{orderId}/cancellation`

### 5.4 订单审核 (疑似内部使用)
- **接口**: `POST /api/v1/orders/{orderId}/audit`
- **参数**: `approved=true/false`

---

## 6. 支付模块 (Payment)

**认证要求**: `Authorization: Bearer <token>`

### 6.1 发起支付
- **接口**: `POST /api/v1/payments`
- **请求体**:
  ```json
  {
      "orderNo": 123456789,
      "amount": 100.00,
      "method": "Alipay" // Wechat, CreditCard
  }
  ```

### 6.2 确认支付 (Token)
- **接口**: `POST /api/v1/payments/confirmation-tokens`
- **描述**: 用于支付安全校验流程

### 6.3 确认支付 (完成)
- **接口**: `POST /api/v1/payments/confirmations`

### 6.4 支付记录搜索
- **接口**: `GET /api/v1/payments`

---

## 7. 预订模块 (Booking)

### 7.1 提交预订 (聚合下单)
- **接口**: `POST /api/v1/bookings`
- **描述**: 处理复杂下单逻辑 (单程/联程)
- **请求体**:
  ```json
  {
      "flightIds": [1001, 1002],
      "cabinId": 5,
      "userId": 1001,
      "isInterline": true, // 是否联程
      "passengers": [
          { "name": "张三", "idCard": "...", "phone": "..." }
      ]
  }
  ```

### 7.2 预订历史
- **接口**: `GET /api/v1/bookings`
- **参数**: `userId`

---

## 8. 退改模块 (Refund)

**认证要求**: `Authorization: Bearer <token>`

### 8.1 申请退改
- **接口**: `POST /api/v1/refund-change-requests`
- **请求体**:
  ```json
  {
      "orderNo": 123456,
      "operType": 1, // 1:退票, 2:改签
      "newFlightNo": "CA9999", // 改签时必填
      "remark": "行程变更"
  }
  ```

### 8.2 退改列表
- **接口**: `GET /api/v1/refund-change-requests`

### 8.3 撤销申请
- **接口**: `DELETE /api/v1/refund-change-requests/{recordId}`

### 8.4 审批操作 (管理员/系统)
- **接口**: `POST /api/v1/refund-change-requests/{recordId}/approvals` (通过)
- **接口**: `POST /api/v1/refund-change-requests/{recordId}/rejections` (拒绝)

---

## 9. 管理后台 - 用户管理

**Headers**: `X-User-Type: 2` (Admin)

### 9.1 用户列表
- **接口**: `GET /api/v1/admins/users`
- **参数**: `page`, `size`, `keyword`, `status`

### 9.2 创建用户 (管理员视角)
- **接口**: `POST /api/v1/admins/users`
- **请求体**: `{ "phoneNumber": "...", "password": "...", "realName": "..." }`

### 9.3 更新用户 / 重置密码
- **接口**: `PUT /api/v1/admins/users/{userId}`
- **接口**: `PUT /api/v1/admins/users/{userId}/password`

### 9.4 删除用户
- **接口**: `DELETE /api/v1/admins/users/{userId}`

---

## 10. 管理后台 - 航班管理

**Headers**: `X-User-Type: 2`

### 10.1 航班列表
- **接口**: `GET /api/v1/admins/flights`
- **参数**: `page`, `size`, `keyword` (支持航班号、城市、机场模糊搜索)

### 10.2 创建航班
- **接口**: `POST /api/v1/admins/flights`
- **请求体**:
  ```json
  {
      "flightNo": "CA8888",
      "modelId": 1,
      "routeId": 5,
      "airlineCompany": "AirChina",
      "departureTime": "2024-12-01 10:00:00",
      "arrivalTime": "2024-12-01 14:00:00", // 选填
      "totalSeats": 200, // 选填
      "status": 1 // 1:计划中
  }
  ```

### 10.3 修改/删除
- **接口**: `PUT /api/v1/admins/flights/{flightId}`
- **接口**: `DELETE /api/v1/admins/flights/{flightId}`

---

## 11. 管理后台 - 订单管理

**Headers**: `X-User-Type: 2`

### 11.1 订单列表
- **接口**: `GET /api/v1/admins/orders`

### 11.2 更新状态
- **接口**: `PUT /api/v1/admins/orders/{orderId}/status`
- **请求体**: `{ "orderStatus": 2 }`

### 11.3 取消/删除
- **接口**: `PUT /api/v1/admins/orders/{orderId}/cancellation`
- **接口**: `DELETE /api/v1/admins/orders/{orderId}`

### 11.4 订单审核
- **接口**: `POST /api/v1/admins/orders/{orderId}/audits`
- **请求体**: `{ "pass": true }`

---

## 12. 管理后台 - 系统配置与监控

**Headers**: `X-User-Type: 2` (部分需要 `X-Admin-Role: 2` 超级管理员)

### 12.1 管理员账号管理 (仅超管)
- **接口**: `POST /api/v1/admins` (创建管理员)
- **接口**: `GET /api/v1/admins/count`

### 12.2 系统配置 (仅超管)
- **接口**: `GET /api/v1/admins/system-configs`
- **接口**: `POST /api/v1/admins/system-configs`
- **接口**: `PUT /api/v1/admins/system-configs/{id}`
- **接口**: `DELETE /api/v1/admins/system-configs/{id}`

### 12.3 仪表盘数据
- **接口**: `GET /api/v1/admins/dashboards/metrics`
- **响应**: 包含 GMV、订单数、用户数、待办事项等聚合数据。

### 12.4 基础监控
- **接口**: `GET /api/v1/system/health` (Keep-alive)
- **接口**: `GET /api/v1/system/db-connection` (DB Connectivity)
- **接口**: `GET /api/v1/metrics/orders/count` ... (各类计数)
