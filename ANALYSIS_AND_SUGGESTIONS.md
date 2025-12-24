# SkyLink 项目深度分析与改进建议

> 最后更新：2025-12-24
> 
> 本文定位：项目技术文档与接口契约说明。

---

## 项目概览

### 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18.2 + TypeScript + Vite 5 + TanStack Query v5 |
| 后端 | Spring Boot 4.0.0 + Java 21 + MyBatis-Plus |
| 数据 | MySQL + ShardingSphere Proxy |

### 业务闭环

- **用户端**: 搜索 → 选择 → 下单 → 支付 → 订单管理 → 退改签
- **管理端**: 航班/机型/舱位/配置管理 + 订单审核 + 支付记录 + 系统日志

---

## 接口契约

### 响应结构

```json
{
  "code": 0,      // 0 = 成功
  "msg": "...",   // 消息
  "data": { }     // 数据
}
```

### 核心接口

| 功能 | 方法 | 路径 |
|------|------|------|
| 航班搜索 | GET | /api/v1/flights |
| 单程下单 | POST | /api/v1/orders |
| 联程下单 | POST | /api/v1/bookings |
| 座位查询 | GET | /api/v1/flights/by-flight-no/{flightNo}/seats |
| 换座 | PUT | /api/v1/orders/{orderId}/seat |
| 支付令牌 | POST | /api/v1/payments/confirmation-tokens |
| 确认支付 | POST | /api/v1/payments/confirmations |

### 状态枚举

**订单状态 (orderStatus)**
- `1` 待支付
- `2` 已支付
- `4` 改签处理中
- `5` 已退票
- `6` 已取消

**支付状态 (paymentStatus)**
- `0` 待支付
- `1` 已支付
- `2` 支付失败
- `3` 退款中
- `4` 已退款

---

## 配置项

| 配置 | 位置 | 值 |
|------|------|-----|
| 支付超时 | constants.ts | 1 分钟 |
| API 端口 | PORT_CONFIGURATION.md | 9999 |
| 前端开发端口 | vite.config.ts | 5173 |

---

## 证据来源

优先级（当材料冲突时）：

1. 源码实现
2. API_AUDIT_REPORT.md
3. 本文档
4. 其他 README

---

## 参考文档

- [API_AUDIT_REPORT.md](API_AUDIT_REPORT.md) - API 审计
- [PORT_CONFIGURATION.md](PORT_CONFIGURATION.md) - 端口配置
- [README.md](README.md) - 项目说明
