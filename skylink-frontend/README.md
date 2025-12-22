<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1QClGtJJ23q8UaaR13-1pxBTlABhxEAzv

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

---

# SkyLink 后端 API 文档（按源码扫描生成）

> 本文档基于 `skylink-backend/src/main/java` 下所有 Controller 源码整理。

## 0. 基础约定

- Base URL: `http://localhost:9999`
- API 统一前缀: `/api/v1`
- 请求体: JSON（建议统一带 `Content-Type: application/json`）

### 0.1 统一返回结构

所有 JSON API 默认返回：

```json
{
   "code": 0,
   "msg": "success",
   "data": {}
}
```

- `code=0` 表示成功
- `code!=0` 表示失败（常见：`400/401/403/409/500`）

分页返回：

```json
{
   "code": 0,
   "msg": "success",
   "data": {
      "total": 123,
      "data": []
   }
}
```

### 0.2 错误与 HTTP Status

后端在部分场景下会把 `Result.code` 同步为 HTTP 状态码（例如 `400/401/403/500`），因此前端建议：

- 优先读 JSON 的 `code/msg`
- 同时兼容 HTTP status 非 200 的情况

### 0.3 时间格式

- 大部分查询参数时间：ISO-8601（例如 `2025-12-20T10:00:00`）
- `FlightCreateRequest` 的时间字段使用 `yyyy-MM-dd HH:mm:ss`（例如 `2025-12-20 10:00:00`）

## 1. 鉴权与权限（现状说明）

后端 Spring Security 当前为 `permitAll()`（不拦截请求），但部分 Controller 内部仍会通过 Header 做“软校验”。

### 1.1 用户端

以下接口会校验登录状态：

- `GET /api/v1/users/me`
- `PUT /api/v1/users/me`
- `PUT /api/v1/users/me/password`
- `POST /api/v1/users/me/contacts`

支持的身份传递方式：

- 推荐：`Authorization: Bearer <token>`（由 `POST /api/v1/users/sessions` 返回）
- 兼容：`X-User-Id: <userId>`（仅用于本项目当前实现的回退方案）

### 1.2 管理端

管理员接口一般需要：

- `X-User-Type: 2`

超级管理员额外需要：

- `X-Admin-Role: 2`

部分接口会读取操作者 ID：

- `X-User-Id: <adminId>`（例如系统配置创建/更新）

## 2. 接口文档（按模块）

### 2.1 用户会话与用户资料

#### 2.1.1 用户登录

- `POST /api/v1/users/sessions`
- Body(JSON):

```json
{
   "phoneNumber": "13800138000",
   "password": "123456"
}
```

- Response(`LoginResponse`):

```json
{
   "code": 0,
   "msg": "success",
   "data": {
      "id": 1001,
      "displayName": "张三",
      "role": "user",
      "token": "<token>"
   }
}
```

#### 2.1.2 用户注册

- `POST /api/v1/users`
- Body(JSON，Map 形式，常用字段如下):

```json
{
   "phoneNumber": "13800138000",
   "password": "123456",
   "realName": "张三",
   "email": "a@b.com",
   "idCard": "110101199001011234",
   "gender": "1"
}
```

- Response: `Result<Boolean>`

#### 2.1.3 获取当前用户信息

- `GET /api/v1/users/me`
- Auth: `Authorization: Bearer <token>`（或 `X-User-Id` 回退）
- Response(`UserProfileResponse`):

```json
{
   "code": 0,
   "msg": "success",
   "data": {
      "userId": 1001,
      "phoneNumber": "13800138000",
      "email": "a@b.com",
      "realName": "张三",
      "idCard": "110101199001011234",
      "gender": 1,
      "avatarUrl": "https://...",
      "createTime": "2025-01-01T12:00:00"
   }
}
```

#### 2.1.4 更新当前用户信息

- `PUT /api/v1/users/me`
- Auth: 同上
- Body(JSON):

```json
{
   "email": "new@b.com",
   "avatarUrl": "https://...",
   "gender": 1,
   "realName": "张三",
   "idCard": "110101199001011234"
}
```

- Response: `Result<User>`（用户实体）

#### 2.1.5 修改密码

- `PUT /api/v1/users/me/password`
- Auth: 同上
- Body(JSON):

```json
{
   "oldPassword": "123456",
   "newPassword": "abcdef"
}
```

- Response: `Result<Boolean>`

#### 2.1.6 绑定联系方式（邮箱/手机）

- `POST /api/v1/users/me/contacts`
- Auth: 同上
- Body(JSON):

```json
{
   "value": "a@b.com",
   "code": "123456"
}
```

- 说明：`value` 包含 `@` 时走邮箱绑定，否则走手机号绑定
- Response: `Result<User>`

### 2.2 航班（用户端）

#### 2.2.1 航班搜索（支持直飞 + 联程组合返回）

- `GET /api/v1/flights`
- Query(均可选)：
   - `departurePlace`, `destination`, `flightNo`, `airlineCompany`, `cabinType`, `status`
   - `departureDate`（ISO DATE）
   - `departureTimeFrom`, `departureTimeTo`（ISO DATE_TIME）
   - `page`（默认 1）, `size`（默认 10）
- Response(`FlightSearchResult`):

```json
{
   "code": 0,
   "msg": "success",
   "data": {
      "directFlights": {
         "total": 1,
         "data": [
            {
               "flightNo": "MU1234",
               "departurePlace": "上海",
               "destination": "北京",
               "departureTime": "2025-12-20T10:00:00",
               "arrivalTime": "2025-12-20T12:00:00",
               "duration": "2h0m",
               "price": 1200.00,
               "remainingSeats": 20,
               "airlineCompany": "中国东方航空",
               "cabinType": "Y"
            }
         ]
      },
      "interlineFlights": [
         {
            "segments": [
               { "flightNo": "MU1001", "departurePlace": "上海", "destination": "西安" },
               { "flightNo": "MU2002", "departurePlace": "西安", "destination": "北京" }
            ],
            "totalPrice": 2100.00,
            "transferCity": "西安",
            "transferDuration": "3h 30m"
         }
      ]
   }
}
```

#### 2.2.2 创建航班（用户端/测试用途）

- `POST /api/v1/flights`
- Body(JSON，时间格式为 `yyyy-MM-dd HH:mm:ss`):

```json
{
   "flightNo": "MU1234",
   "modelId": 1,
   "routeId": 1,
   "departureTime": "2025-12-20 10:00:00",
   "airlineCompany": "中国东方航空",
   "layoutNo": 1,
   "status": 1
}
```

- Response: `Result<Boolean>`

### 2.3 订单（用户端）

#### 2.3.1 订单搜索

- `GET /api/v1/orders`
- Query(可选)：`userId`, `orderNo`, `orderStatus`, `createTimeStart`, `createTimeEnd`, `flightNo`, `cabinType`
- Response: `Result<List<OrderSearchResponse>>`

#### 2.3.2 创建订单

- `POST /api/v1/orders`
- Body(JSON):

```json
{
   "userId": 1001,
   "flightNo": "MU1234",
   "cabinType": "Y",
   "ticketNum": 1,
   "passengerName": "张三",
   "contactEmail": "a@b.com",
   "contactPhone": "13800138000",
   "passengersJson": "[{\"name\":\"张三\"}]"
}
```

- 说明：`passengersJson` 为字符串形式 JSON（后端按字符串存储）
- Response: `Result<OrderSearchResponse>`

#### 2.3.3 取消订单

- `POST /api/v1/orders/{orderId}/cancellation`
- Response: `Result<Boolean>`

#### 2.3.4 审核订单（用户端接口，按实现存在）

- `POST /api/v1/orders/{orderId}/audit?approved=true|false`
- Response: `Result<Boolean>`

### 2.4 下单/预订（Booking）

#### 2.4.1 提交预订

- `POST /api/v1/bookings`
- Body(JSON):

```json
{
   "flightIds": [1001],
   "cabinId": 2001,
   "userId": 1001,
   "isInterline": false,
   "passengers": [
      {
         "name": "张三",
         "idCard": "110101199001011234",
         "phone": "13800138000"
      }
   ]
}
```

- Response: `Result<Map<String,Object>>`（具体 key 由服务实现决定）

#### 2.4.2 预订列表

- `GET /api/v1/bookings?userId=1001`
- Response: `Result<List<BookingResponse>>`

### 2.5 支付

#### 2.5.1 支付搜索

- `GET /api/v1/payments`
- Query(可选)：`orderNo`, `userId`, `paymentStatus`, `paymentMethod`, `paymentTimeStart`, `paymentTimeEnd`
- Response: `Result<List<PaymentSearchResponse>>`

#### 2.5.2 创建支付确认 Token

- `POST /api/v1/payments/confirmation-tokens`
- Body(JSON):

```json
{
   "orderNo": 202512200001,
   "amount": 1200.00
}
```

- Response(`CreatePaymentTokenResponse`):

```json
{
   "code": 0,
   "msg": "success",
   "data": {
      "orderNo": "202512200001",
      "amount": 1200.00,
      "timestamp": 1734698400000,
      "token": "<token>",
      "expiresAt": 1734698700000
   }
}
```

#### 2.5.3 确认支付

- `POST /api/v1/payments/confirmations`
- Body(JSON):

```json
{
   "orderNo": 202512200001,
   "amount": 1200.00,
   "timestamp": 1734698400000,
   "token": "<token>",
   "method": "ALIPAY"
}
```

- Response: `Result<PaymentSearchResponse>`

#### 2.5.4 创建支付（直接支付）

- `POST /api/v1/payments`
- Body(JSON):

```json
{
   "orderNo": 202512200001,
   "amount": 1200.00,
   "method": "ALIPAY"
}
```

- Response: `Result<PaymentSearchResponse>`

### 2.6 退票/改签

#### 2.6.1 查询退改申请

- `GET /api/v1/refund-change-requests`
- Query(可选)：`userId`, `orderNo`
- Response: `Result<List<RefundChangeSearchResponse>>`

#### 2.6.2 提交退票/改签申请

- `POST /api/v1/refund-change-requests`
- Body(JSON):

退票（`operType=1`）：

```json
{
   "orderNo": 202512200001,
   "operType": 1,
   "remark": "行程变化"
}
```

改签（`operType=2`）：

```json
{
   "orderNo": 202512200001,
   "operType": 2,
   "newFlightNo": "MU5678",
   "newCabinType": "Y",
   "remark": "改签到更晚的航班"
}
```

- Response: `Result<Long>`（申请记录 ID）
- 注意：改签时如果新航班余票不足，服务实现可能返回 `409`

#### 2.6.3 审批/驳回/撤销/修改（按记录 ID）

- `POST /api/v1/refund-change-requests/{recordId}/approvals` 通过
- `POST /api/v1/refund-change-requests/{recordId}/rejections` 驳回
- `DELETE /api/v1/refund-change-requests/{recordId}` 撤销
- `PUT /api/v1/refund-change-requests/{recordId}` 修改待处理申请（Body 同 `RefundChangeApplyRequest`）

### 2.7 管理员：登录与统计

#### 2.7.1 管理员登录

- `POST /api/v1/admins/sessions`
- Body(JSON):

```json
{
   "adminAccount": "admin",
   "password": "123456"
}
```

- Response(`AdminLoginResponse`):

```json
{
   "code": 0,
   "msg": "success",
   "data": {
      "id": 1,
      "displayName": "管理员",
      "role": "admin",
      "token": "<token>",
      "userType": 2,
      "adminRole": 2
   }
}
```

#### 2.7.2 创建管理员（仅超级管理员）

- `POST /api/v1/admins`
- Headers: `X-User-Type: 2`, `X-Admin-Role: 2`
- Body(JSON):

```json
{
   "adminAccount": "ops_001",
   "password": "123456",
   "role": 1
}
```

- Response: `Result<Admin>`

#### 2.7.3 管理端计数类接口

这些接口返回 `Result<Long>`：

- `GET /api/v1/admins/count`
- `GET /api/v1/admins/system-configs/count`
- `GET /api/v1/admins/operation-logs/count`
- `GET /api/v1/admins/user-behavior-stats/count`
- `GET /api/v1/admins/refund-change-requests/count`

#### 2.7.4 管理端大盘指标（一次返回多个指标）

- `GET /api/v1/admins/dashboards/metrics`
- Response: `Result<AdminDashboardMetricsResponse>`（字段见后端 DTO，含 flightCount/orderCount/paymentCount 等）

### 2.8 管理员：系统配置（System Configs）

#### 2.8.1 系统配置列表

- `GET /api/v1/admins/system-configs`
- Headers: `X-User-Type: 2`
- Query：`page`(默认 1), `size`(默认 10), `keyword`(可选)
- Response: `Result<PageResult<SystemConfig>>`

#### 2.8.2 创建/更新/删除系统配置（仅超级管理员）

- `POST /api/v1/admins/system-configs`
- `PUT /api/v1/admins/system-configs/{configId}`
- `DELETE /api/v1/admins/system-configs/{configId}`

Headers（创建/更新/删除）：

- `X-User-Type: 2`
- `X-Admin-Role: 2`
- 创建/更新建议带：`X-User-Id: <adminId>`（用于记录操作者）

Body(JSON，创建/更新使用 `AdminConfigUpsertRequest`):

```json
{
   "configName": "payment_timeout",
   "configValue": "1800",
   "configDesc": "支付超时时间（秒）",
   "effectiveTime": "2025-01-01T00:00:00"
}
```

### 2.9 管理员：用户管理

所有接口 Headers：`X-User-Type: 2`

- `GET /api/v1/admins/users`（分页列表）
   - Query：`page`,`size`,`keyword?`,`status?`
   - Response：`Result<PageResult<User>>`

- `POST /api/v1/admins/users`（创建用户）

```json
{
   "phoneNumber": "13800138000",
   "password": "123456",
   "email": "a@b.com",
   "realName": "张三"
}
```

- `PUT /api/v1/admins/users/{userId}`（更新用户）

```json
{
   "phoneNumber": "13800138000",
   "email": "new@b.com",
   "realName": "张三",
   "userStatus": 1
}
```

- `PUT /api/v1/admins/users/{userId}/password`（重置密码）

```json
{ "password": "abcdef" }
```

- `DELETE /api/v1/admins/users/{userId}`（删除用户）

### 2.10 管理员：航班管理

所有接口 Headers：`X-User-Type: 2`

- `GET /api/v1/admins/flights`（分页列表）
   - Query：`page`,`size`,`keyword?`,`flightNo?`,`departureCity?`,`arrivalCity?`
   - Response：`Result<PageResult<Flight>>`

- `POST /api/v1/admins/flights`（创建航班）
- `PUT /api/v1/admins/flights/{flightId}`（更新航班）
- `DELETE /api/v1/admins/flights/{flightId}`（删除航班，包含级联删除座位的实现）

Body（创建/更新同 `FlightCreateRequest`，时间格式 `yyyy-MM-dd HH:mm:ss`）：

```json
{
   "flightNo": "MU1234",
   "modelId": 1,
   "routeId": 1,
   "departureTime": "2025-12-20 10:00:00",
   "airlineCompany": "中国东方航空",
   "layoutNo": 1,
   "status": 1
}
```

### 2.11 管理员：订单管理

所有接口 Headers：`X-User-Type: 2`

- `GET /api/v1/admins/orders`（分页列表）
   - Query：`page`,`size`,`orderNo?`,`userId?`,`orderStatus?`,`flightNo?`
   - Response：`Result<PageResult<AdminOrderItem>>`（列表项字段见后端 `AdminOrderController.AdminOrderItem`）

- `PUT /api/v1/admins/orders/{orderId}/status`（更新状态）

```json
{ "orderStatus": 1 }
```

- `PUT /api/v1/admins/orders/{orderId}/cancellation`（取消订单）
- `DELETE /api/v1/admins/orders/{orderId}`（删除订单）

- `POST /api/v1/admins/orders/{orderId}/audits`（审核订单）

```json
{ "pass": true }
```

### 2.12 系统：指标与健康检查

#### 2.12.1 业务指标计数

返回均为 `Result<Long>`：

- `GET /api/v1/metrics/orders/count`
- `GET /api/v1/metrics/payments/count`
- `GET /api/v1/metrics/refunds/count`
- `GET /api/v1/metrics/flights/count`

#### 2.12.2 系统自检

- `GET /api/v1/system/health`（返回纯字符串：`Hello, SkyLink`）
- `GET /api/v1/system/db-connection`（返回纯字符串：成功/失败信息）

## 3. 备注与已知限制

- 当前仅对 `users/me` 系列与部分 admin 操作做了 Header 级别的守卫；其它用户端业务接口多为“按参数”调用（例如 `userId` 查询），前端应避免把这些接口暴露给未登录用户。
- 后端接口在返回 `code!=0` 时可能同时设置 HTTP 状态码为对应 `code`，前端需要同时兼容两种判断方式。
