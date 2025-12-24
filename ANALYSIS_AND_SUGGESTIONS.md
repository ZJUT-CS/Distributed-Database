# SkyLink 项目深度分析与改进建议

> 最后更新：2025-12-24 23:15
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
| 座位查询 | GET | /api/v1/flights/{flightId}/seats |
| 座位查询 (航班号) | GET | /api/v1/flights/by-flight-no/{flightNo}/seats |
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

## 前后端衔接改进建议

### 🔴 高优先级

| 问题 | 现状 | 建议 |
|------|------|------|
| **API 重复定义** | `booking/api/` 和 `hooks/` 目录存在重复的接口调用 | 统一在 `api/` 目录定义，`hooks/` 仅封装 TanStack Query |
| **类型不同步** | 前端 `Flight` 类型缺少后端部分字段 (如 `aircraftModel`) | 建立共享类型定义或使用自动生成工具 |
| **错误码处理** | 前端多处硬编码错误处理逻辑 | 统一的错误拦截器 + 错误边界组件 |

### 🟡 中优先级

| 问题 | 建议 |
|------|------|
| **缓存策略** | 后端明确指定 Cache-Control，前端配合 TanStack Query staleTime |
| **分页参数** | 统一使用 `page/size` 或 `offset/limit`，当前混用 |
| **日期格式** | 统一使用 ISO 8601，前端需转换 `datetime-local` 格式 |

### 🟢 低优先级

| 问题 | 建议 |
|------|------|
| **国际化** | 错误消息硬编码中文，建议后端返回错误码，前端映射 |
| **API版本** | 当前 `/api/v1/`，建议准备 v2 迁移方案 |

---

## 新增功能清单 (2025-12-24)

| 功能 | 说明 |
|------|------|
| 托运行李显示 | 从 `aircraft_cabin_configs.default_checked` 读取并显示 |
| 机上服务配置 | 从 `aircraft_cabin_configs.default_services` 读取，解析为服务图标 |
| 管理员舱位配置 | 新增「机上服务配置」输入框 |
| 通用航班卡片 | `JourneyTimeline` 组件统一单程/联程显示 |

---

## 配置项

| 配置 | 位置 | 值 |
|------|------|-----|
| 支付超时 | constants.ts | 1 分钟 |
| API 端口 | application.yml | 9999 |
| 前端开发端口 | vite.config.ts | 5173 |

---

## 参考文档

- [API_AUDIT_REPORT.md](API_AUDIT_REPORT.md) - API 审计
- [PORT_CONFIGURATION.md](PORT_CONFIGURATION.md) - 端口配置
- [README.md](README.md) - 项目说明
