# SkyLink 综合优化与落地报告（2025-12-24 更新）

> 本报告于 2025-12-24 更新，反映最新的项目状态。

---

## 当前状态总结

### ✅ 已完成功能

| 功能 | 状态 | 说明 |
|------|------|------|
| 航班搜索 | ✅ | 支持直飞和联程方案展示 |
| 单程下单 | ✅ | `POST /api/v1/orders` |
| **联程下单** | ✅ | `POST /api/v1/bookings` + 前端智能分流 |
| 支付流程 | ✅ | 倒计时 + 超时处理（统一1分钟） |
| 订单列表 | ✅ | 防御性处理，确保页面不崩溃 |
| **在线选座** | ✅ | `GET /by-flight-no/{flightNo}/seats` 新增 |
| 退改签申请 | ✅ | 完整链路 |
| 管理后台 | ✅ | TanStack Query 全面迁移 |

### 技术栈

- **前端**: React 18.2 + TypeScript + Vite + TanStack Query v5
- **后端**: Spring Boot 4.0.0 + Java 21 + MyBatis-Plus
- **数据层**: MySQL + ShardingSphere Proxy

---

## 接口契约

### 统一响应结构

```json
{
  "code": 0,      // 0 = 成功, 其他 = 失败
  "msg": "...",   // 错误消息
  "data": { }     // 业务数据
}
```

### 错误码语义

| 错误码 | 类型 | 可重试 | 说明 |
|-------|------|--------|------|
| 400 | VALIDATION | ❌ | 参数校验失败 |
| 401 | AUTH | ❌ | 认证失败，需重新登录 |
| 403 | PERMISSION | ❌ | 权限不足 |
| 404 | NOT_FOUND | ❌ | 资源不存在 |
| 409 | CONFLICT | ✅ | 业务冲突（如座位被占用） |
| 5xx | SERVER | ✅ | 服务器错误 |

### 支付超时配置

- **配置位置**: `skylink-frontend/src/config/constants.ts`
- **当前值**: 1 分钟 (60,000 ms)
- **与后端一致**: `OrderTimeoutTask` 1 分钟

---

## 关键接口清单

### 用户端

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/flights | 航班搜索 |
| POST | /api/v1/orders | 单程下单 |
| POST | /api/v1/bookings | 联程下单 |
| POST | /api/v1/payments/confirmation-tokens | 创建支付令牌 |
| POST | /api/v1/payments/confirmations | 确认支付 |
| GET | /api/v1/flights/by-flight-no/{flightNo}/seats | 座位查询 |
| PUT | /api/v1/orders/{orderId}/seat | 换座 |

### 管理端

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/admin/users | 用户管理 |
| GET | /api/v1/admin/flights | 航班管理 |
| GET | /api/v1/admin/orders | 订单管理 |
| GET | /api/v1/payments/page | 支付记录 |

---

## 前端架构

```
skylink-frontend/
├── src/
│   ├── components/       # 共享组件 (Countdown, Toast, SeatMap)
│   ├── features/         # 业务模块
│   │   ├── booking/api/  # booking.ts, order.ts, seat.ts
│   │   ├── flight/       # 航班搜索
│   │   └── admin/        # 管理后台
│   ├── pages/            # 页面组件
│   └── config/constants.ts  # 统一配置
```

---

## 验收标准

| 功能 | 验收条件 | 状态 |
|------|----------|------|
| 订单列表 | 无论后端返回何种数据，页面不崩溃 | ✅ |
| 单程下单 | 下单→支付→订单列表 完整闭环 | ✅ |
| 联程下单 | 多段选择→下单→订单详情分段展示 | ✅ |
| 支付超时 | 倒计时结束自动取消，禁止继续支付 | ✅ |
| 选座功能 | 通过航班号查询座位 | ✅ |
