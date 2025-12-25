# SkyLink 综合优化与落地报告（2025-12-24 更新）

> 本报告于 2025-12-24 23:15 更新，反映最新的项目状态。

---

## 增量更新内容（2025-12-25）

### 订单链路锚点收口：`flightId` 取代 `flightNo`

- 目标：前端页面/联程组合/改签入口不再使用 `flightNo` 或时间戳作为 `id/key/路由锚点`，避免与后端“`flightNo` 必须唯一解析”策略冲突。
- 约定：雪花 ID 在前端一律以 **string** 承载与传输。

### 前端修改

| 文件 | 修改内容 |
|------|----------|
| `src/features/flight/api/search.ts` | 联程 `id` 仅由各段 `flightId` 拼接；缺失 `flightId` 的方案直接过滤 |
| `src/pages/Booking/ChangeFlight.tsx` | 改签页/联程结果不再用 `flightNo`/`Date.now()` 兜底生成 `id`；缺失 `flightId` 直接不可办理或过滤 |
| `src/features/booking/api/cabin.ts` | `getAvailableCabins` 支持 `flightId` 以 string 传参，兼容雪花 ID |

### 验证

- 前端构建：`npm run build`（`tsc && vite build`）通过。

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
| **行李/服务显示** | ✅ 新增 | 从 `aircraft_cabin_configs` 读取真实数据 |
| **通用航班卡片** | ✅ 新增 | `JourneyTimeline` + `FlightSegmentCard` 组件 |

### 技术栈

- **前端**: React 18.2 + TypeScript + Vite + TanStack Query v5
- **后端**: Spring Boot 4.0.0 + Java 21 + MyBatis-Plus
- **数据层**: MySQL + ShardingSphere Proxy

---

## 今日更新内容 (2025-12-24)

### 后端修改

| 文件 | 修改内容 |
|------|----------|
| `FlightSearchResponse.java` | 新增 `baggageAllowance`、`services` 字段 |
| `FlightServiceImpl.java` | 从 `AircraftCabinConfig` 读取行李/服务数据填充响应 |

### 前端修改

| 文件 | 修改内容 |
|------|----------|
| `types.ts` | 新增 `baggageAllowance`、`services` 字段 |
| `search.ts` | 添加 `parseBaggageWeight()` 和 `parseAmenities()` 函数 |
| `FlightList.tsx` | 显示真实行李数据和服务图标 |
| `FlightSegmentCard.tsx` | 新建通用航班卡片组件 |
| `JourneyTimeline.tsx` | 新建统一行程时间线组件 |
| `CabinConfigsMgmt.tsx` | 新增「机上服务配置」输入框 |

---

## 前后端衔接待改进项

### 🔴 高优先级

| 问题 | 影响 | 建议 |
|------|------|------|
| **API 定义分散** | 维护成本高 | 将 `features/*/hooks/` 中的接口调用移至 `features/*/api/` |
| **类型手动同步** | 易出错 | 使用 OpenAPI Generator 或手动维护 types 文件 |
| **错误处理碎片化** | UX不一致 | 统一的 `apiError.ts` + Toast 通知 |

### 🟡 中优先级

| 问题 | 建议 |
|------|------|
| 后端分页返回格式不统一 | 统一为 `{ data: [], total: number }` |
| 部分接口缺少字段校验 | 后端添加 `@Valid` 注解 |
| 前端类型 `any` 过多 | 渐进式补全类型定义 |

### 🟢 低优先级

| 问题 | 建议 |
|------|------|
| API 路径命名风格混合 | 统一使用 kebab-case |
| 缺少接口文档 | 使用 Swagger/OpenAPI 自动生成 |
| 缺少端到端测试 | 使用 Playwright 覆盖核心流程 |

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

### 关键接口清单

#### 用户端

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/flights | 航班搜索 (含 `baggageAllowance`, `services`) |
| POST | /api/v1/orders | 单程下单 |
| POST | /api/v1/bookings | 联程下单 |
| POST | /api/v1/payments/confirmation-tokens | 创建支付令牌 |
| POST | /api/v1/payments/confirmations | 确认支付 |
| GET | /api/v1/flights/{flightId}/seats | 座位查询 |
| GET | /api/v1/flights/by-flight-no/{flightNo}/seats | 按航班号查座位 |
| PUT | /api/v1/orders/{orderId}/seat | 换座 |

#### 管理端

| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST/PUT/DELETE | /api/v1/admins/flights | 航班管理 |
| GET/POST/PUT/DELETE | /api/v1/admins/cabin-configs | 舱位配置管理 |
| GET | /api/v1/admins/orders | 订单管理 |
| GET | /api/v1/payments/page | 支付记录 |

---

## 前端架构

```
skylink-frontend/src/
├── components/           # 共享组件
│   ├── booking/          # JourneyTimeline, FlightSegmentCard, InterlineOrderBadge
│   ├── common/           # Toast, Countdown, SeatMap
│   └── layout/           # Header, Footer, Sidebar
├── features/             # 业务模块
│   ├── admin/api/        # 管理后台 API (12 文件)
│   ├── booking/api/      # booking.ts, order.ts, seat.ts, payment.ts
│   ├── flight/           # 航班搜索
│   ├── auth/             # 登录注册
│   └── payment/          # 支付流程
├── pages/                # 页面组件
└── config/constants.ts   # 统一配置
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
| **行李显示** | 显示后端返回的真实行李额度 | ✅ 新增 |
| **服务图标** | 根据服务配置显示对应图标 | ✅ 新增 |

---

## 下一步建议

1. **统一 API 调用层** - 消除 hooks 和 api 目录的重复定义
2. **自动化类型生成** - 考虑使用 OpenAPI 规范
3. **添加加载骨架屏** - 提升用户体验
4. **实现离线缓存** - 使用 Service Worker 缓存静态资源
5. **端到端测试** - 覆盖核心用户流程
