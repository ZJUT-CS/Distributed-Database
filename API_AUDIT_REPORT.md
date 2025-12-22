# SkyLink API 审计报告 (后端完整版)

> **生成时间**: 2025年12月23日
> **扫描范围**: `skylink-backend` 所有 Controller 及 DTO
> **基础路径**: `http://localhost:8080` (默认)

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
13. [附录：枚举值定义](#13-附录枚举值定义)
14. [附录：错误码说明](#14-附录错误码说明)

---

## 1. 核心规范

### 通用响应结构
所有接口统一返回 `Result<T>` 结构：

```json
{
  "code": 0,          // 0 表示成功，非 0 表示失败 (通常对应 HTTP 状态码，如 400, 401, 500)
  "msg": "success",   // 提示信息 (成功时为 success，失败时为错误描述)
  "data": { ... }     // 具体的业务数据
}
```

### 认证方式
- **Header**: `Authorization: Bearer <token>` (用户/管理员通用)
- **Header (备用)**: `X-User-Id: <id>` (仅用于开发/测试环境或特定内部调用，优先级低于 Token)
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
      "phoneNumber": "13800138000", // 必填 (@NotBlank)
      "password": "your_password"   // 必填 (@NotBlank)
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
      "adminAccount": "admin",      // 必填 (@NotBlank)
      "password": "admin_password"  // 必填 (@NotBlank)
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
      "adminRole": 2 // 1:普通管理员, 2:超级管理员
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
      "gender": 1, // 0:未知, 1:男, 2:女
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
      "oldPassword": "old_pass", // 必填
      "newPassword": "new_pass"  // 必填
  }
  ```

### 3.5 绑定联系方式 (邮箱/手机)
- **接口**: `POST /api/v1/users/me/contacts`
- **请求体**:
  ```json
  {
      "value": "xx@xx.com", // 或手机号, 必填
      "code": "123456"      // 验证码, 必填
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
  - `cabinType`: 舱位类型
  - `airlineCompany`: 航空公司
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
      "airlineCompany": "Air China",
      "duration": "PT2H30M" // ISO-8601 Duration 格式
  }
  ```

### 4.2 创建航班 (管理员功能入口见 10.2)
- （此处省略，直接参考管理后台部分）

---

## 5. 订单模块 (Order)

**认证要求**: `Authorization: Bearer <token>`

### 5.1 搜索订单
- **接口**: `GET /api/v1/orders`
- **参数**: `userId`, `orderNo`, `orderStatus` (见附录), `createTimeStart`...
- **响应数据 (列表项)**:
  ```json
  {
      "orderNo": "20240501xxxx",
      "flightNo": "CA1234",
      "passengerName": "张三",
      "totalAmount": 1200.00,
      "orderStatus": 1, // 0:待审核, 1:待支付, 2:已支付... (见附录)
      "orderTime": "..."
  }
  ```

### 5.2 创建订单 (直接下单)
- **接口**: `POST /api/v1/orders`
- **请求体**:
  ```json
  {
      "userId": 1001, // 必填
      "flightNo": "CA1234", // 必填
      "cabinType": "Economy", // 必填
      "ticketNum": 1, // 必填, >= 1
      "passengerName": "张三", // 必填
      "contactEmail": "xx@xx.com",
      "contactPhone": "138...",
      "passengersJson": "[{...}]", // 详细乘机人 JSON 字符串
      "flightNos": ["CA1234", "MU5678"] // 可选：联程航班列表
  }
  ```

### 5.3 取消订单
- **接口**: `POST /api/v1/orders/{orderId}/cancellation`

### 5.4 订单审核 (管理员)
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
      "orderNo": 123456789, // 必填
      "amount": 100.00, // 必填, > 0
      "method": "Alipay" // 必填 (Alipay, Wechat, CreditCard)
  }
  ```

### 6.2 确认支付 (Token)
- **接口**: `POST /api/v1/payments/confirmation-tokens`
- **描述**: 用于支付安全校验流程

### 6.3 确认支付 (完成)
- **接口**: `POST /api/v1/payments/confirmations`

### 6.4 支付记录搜索
- **接口**: `GET /api/v1/payments`
- **参数**: `orderNo`, `paymentStatus` (见附录)...

---

## 7. 预订模块 (Booking)

### 7.1 提交预订 (聚合下单 - 推荐)
- **接口**: `POST /api/v1/bookings`
- **描述**: 推荐使用此接口进行复杂下单 (支持单程/联程)
- **请求体**:
  ```json
  {
      "flightIds": [1001, 1002], // 航班ID列表
      "cabinId": 5, // 舱位配置ID
      "userId": 1001, 
      "isInterline": true, // true=联程(打包), false=拼凑(独立)
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
      "orderNo": 123456, // 必填
      "operType": 1, // 必填 (1:退票, 2:改签)
      "newFlightNo": "CA9999", // 改签时必填
      "remark": "行程变更"
  }
  ```

### 8.2 退改列表
- **接口**: `GET /api/v1/refund-change-requests`

### 8.3 撤销申请
- **接口**: `DELETE /api/v1/refund-change-requests/{recordId}`

### 8.4 审批操作 (管理员)
- **接口**: `POST /api/v1/refund-change-requests/{recordId}/approvals` (通过)
- **接口**: `POST /api/v1/refund-change-requests/{recordId}/rejections` (拒绝)

---

## 9. 管理后台 - 用户管理

**Headers**: `X-User-Type: 2`

### 9.1 用户列表
- **接口**: `GET /api/v1/admins/users`
- **参数**: `page`, `size`, `keyword`, `status`

### 9.2 创建用户
- **接口**: `POST /api/v1/admins/users`

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
      "flightNo": "CA8888", // 必填
      "modelId": 1, // 必填 (机型ID)
      "routeId": 5, // 必填 (航线ID)
      "airlineCompany": "AirChina", // 必填
      "departureTime": "2024-12-01 10:00:00", // 必填 (yyyy-MM-dd HH:mm:ss)
      "arrivalTime": "2024-12-01 14:00:00", // 选填
      "totalSeats": 200, // 选填
      "status": 1 // 1:计划中 (见附录)
  }
  ```

### 10.3 修改/删除
- **接口**: `PUT /api/v1/admins/flights/{flightId}`
- **接口**: `DELETE /api/v1/admins/flights/{flightId}` (级联删除)

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

**Headers**: `X-User-Type: 2` (部分需 `X-Admin-Role: 2`)

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
- **响应**: 大盘统计数据

### 12.4 基础监控
- **接口**: `GET /api/v1/system/health`
- **接口**: `GET /api/v1/system/db-connection`
- **接口**: `GET /api/v1/metrics/orders/count` ...

---

## 13. 附录：枚举值定义

### 13.1 订单状态 (orderStatus / OrderStatusEnum)
| 值 (Code) | 描述 (Desc) | 备注 |
|---|---|---|
| `0` | 待审核 | PENDING_AUDIT |
| `1` | 待支付 | PENDING_PAYMENT |
| `2` | 已支付 | CONFIRMED |
| `3` | 已拒绝 | REJECTED |
| `4` | 改签处理中 | PROCESSING |
| `5` | 已退票 | REFUNDED |
| `6` | 已取消 | CANCELLED |

### 13.2 航班状态 (status / Flight.java)
| 值 | 描述 |
|---|---|
| `1` | 计划中 |
| `2` | 取消 |
| `3` | 延误 |
| `4` | 已起飞 |
| `5` | 已到达 |

### 13.3 支付状态 (paymentStatus / Payment.java)
| 值 | 描述 |
|---|---|
| `0` | 待支付 |
| `1` | 已支付 |
| `2` | 支付失败 |
| `3` | 退款中 |
| `4` | 已退款 |

### 13.4 行程类型 (isInterline / TripTypeEnum)
| 值 | 描述 |
|---|---|
| `0` | 独立/单程 |
| `1` | 联程首段 |
| `2` | 联程后续 |

### 13.5 管理员角色 (X-Admin-Role)
| 值 | 描述 |
|---|---|
| `1` | 普通管理员 (无法管理其他管理员和系统配置) |
| `2` | 超级管理员 (最高权限) |

---

## 14. 附录：错误码说明

后端通过 `GlobalExceptionHandler` 统一处理异常，返回 `Result` 对象。

| code (返回码) | 含义 | 常见 msg 示例 |
|---|---|---|
| `0` | 成功 | success |
| `400` | 参数错误/请求无效 | validation error: flightNo is required, bind error... |
| `401` | 未认证 | login required |
| `403` | 权限不足 | admin required, super admin required |
| `500` | 服务器内部错误 | Internal Error: ... |
