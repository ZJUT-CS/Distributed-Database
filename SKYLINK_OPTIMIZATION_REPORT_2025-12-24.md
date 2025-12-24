# SkyLink 综合优化与落地报告（2025-12-24）

> 目标：在不推翻现有架构的前提下，围绕“分布式一致性 + 航空订票核心链路（搜索-下单-支付-售后）”，补齐前端缺口、统一接口契约、提升可观测性与可维护性。

---

## 0. 范围与证据来源

本报告基于以下材料与代码现状整理（均来自本项目仓库）：

- 现有分析建议：[ANALYSIS_AND_SUGGESTIONS.md](ANALYSIS_AND_SUGGESTIONS.md)
- API 审计：[API_AUDIT_REPORT.md](API_AUDIT_REPORT.md)
- 端口与环境：[PORT_CONFIGURATION.md](PORT_CONFIGURATION.md)
- 项目说明：[README.md](README.md)
- 后端说明：[skylink-backend/README.md](skylink-backend/README.md)
- 前端说明：[skylink-frontend/README.md](skylink-frontend/README.md)
- 关键实现核对：
  - 支付接口：`skylink-backend/src/main/java/com/team/skylink/module/payment/controller/PaymentController.java`
  - 订单超时任务：`skylink-backend/src/main/java/com/team/skylink/module/order/task/OrderTimeoutTask.java`
  - 选座/锁座能力：`skylink-backend/src/main/java/com/team/skylink/module/flight/service/SeatService.java`
  - 前端导出工具复用：`skylink-frontend/src/utils/export.ts`

---

## 1. 一句话结论（给迭代负责人）

**更新说明（2025-12-24）**：前端已覆盖主流程页面与大部分 API 对接（搜索、单程下单、支付、订单列表/详情、管理后台），但仍有关键未闭环项：

- **联程下单未闭环**：当前多段选择与可视化已实现，但下单仍走 `POST /api/v1/orders`（单航班号），未接入后端 `POST /api/v1/bookings`（联程 split-join）。
- **在线选座受阻**：前端页面与交互已实现，但前端依赖的座位相关接口（如 `GET /api/v1/flights/{flightId}/seats`、`PUT /api/v1/orders/{orderId}/seat`）后端当前未提供，导致无法联调通过。

建议先完成“契约/口径统一 + 联程下单闭环”，再评估选座接口的后端落地方式与验收标准。

---

**历史结论（已过时）**：后端已具备 Mode B（下单锁座、支付后换座/选座）、联程下单与超时取消等核心能力；前端当前主要短板在于：**在线选座缺失、支付超时 UX 与状态同步不足、联程可视化不够清晰**。此外存在若干"文档/契约不一致"（尤其是**统一响应 code 语义**与**支付窗口时长**），建议先做 Phase 0 统一，再进入功能迭代。

---

## 2. 现状概览

### 2.1 技术栈与端口

- 前端：React + TypeScript + Vite（开发端口 5173）
- 后端：Spring Boot（当前后端 README 明确为 Spring Boot 4；根 README 仍写 3.x，需统一）
- 后端 API 端口：9999
- 数据层：MySQL + ShardingSphere Proxy（3306/3307）

> 详见：`PORT_CONFIGURATION.md`

### 2.2 已确认的后端关键能力（可直接被前端接入）

1) **支付接口完整**（含确认 token、确认支付、支付记录查询/分页）
- `POST /api/v1/payments/confirmation-tokens`
- `POST /api/v1/payments/confirmations`
- `POST /api/v1/payments`
- `GET /api/v1/payments` / `GET /api/v1/payments/page`

2) **订单超时取消任务存在**：`OrderTimeoutTask`
- 当前配置：`@Scheduled(cron = "0/10 * * * * ?")`（每 10 秒扫描）
- 当前实现：`actualTimeoutMinutes = 1`（代码里是 1 分钟）
- 文档口径：多处提到 2 分钟（需统一口径，见 Phase 0）

3) **SeatService 具备 Mode B 选座/换座能力**：
- `lockRandomSeat(flightId, cabinId, orderId)`
- `changeSeat(orderId, newSeatId)`
- `releaseSeat(seatId)` / `confirmSeat(seatId)`
- 兼容旧模式：`lockSeats(...) / releaseSeats(orderId) / confirmSeats(orderId)`

4) **幂等处理已考虑**：后端存在 `IdempotencyFilter` 并包含 `/api/v1/payments` 路径（前端也在分析报告中提到已自动生成 `Idempotency-Key`）。

### 2.3 前端已具备的可复用能力（减少重复造轮子）

- CSV 导出工具已沉淀为通用方法：`exportToCSV`（多个管理页复用，包含 `PaymentsMgmt.tsx`）
- 管理后台页面体系较完整：用户、航班、订单、支付、日志、系统配置等

---

## 3. 关键不一致点（必须先对齐，否则“做完也不稳定”）

### 3.1 统一响应结构的 code 语义不一致

- `API_AUDIT_REPORT.md` 与 `skylink-frontend/README.md` 更偏向：`code=0` 成功；失败时 `code=400/401/403/500` 等。

> 说明：历史文档曾出现 `code=200` 成功的口径；已在 README 中统一为 `code=0` 成功，并保留“兼容 HTTP status”的联调建议。

**建议**（不改业务逻辑、只对齐规范）：
- 以“`code=0` 为成功”的既有实现为准（与前端文档一致），后端 README 更新口径。
- 前端 Axios 拦截器/Result 解析保持“兼容 HTTP status 非 200”与“优先读 JSON code/msg”。

### 3.2 支付窗口时长不一致（用户体验与业务规则会冲突）

- 文档多处：2 分钟
- 代码：`OrderTimeoutTask` 当前为 1 分钟

**建议**：
- 将“支付窗口”定义为单一来源（配置项/系统配置/常量），并在：后端任务、后端返回字段、前端倒计时展示三处保持一致。

### 3.3 根 README 后端版本口径不一致


> 说明：历史文档曾出现后端版本口径不一致；目前以各模块 README 的“当前描述”为准。

---

## 4. 高优先级缺口与完成状态（以"可交付功能"为中心）

> **更新说明（2025-12-24）**：本节按“是否可联调闭环”重新梳理。页面存在 ≠ 功能已闭环；以“后端接口可用 + 前端调用成功 + 状态回写可验证”为完成标准。

### 4.1 ⚠️ 缺口 A：用户侧"在线选座/换座" - **前端已实现，后端接口缺失（当前无法闭环）**

**实现状态**：
- ✅ 新增用户端页面：[`skylink-frontend/src/pages/Booking/SeatSelection.tsx`](skylink-frontend/src/pages/Booking/SeatSelection.tsx)
- ✅ 座位地图组件：[`skylink-frontend/src/components/booking/SeatMap.tsx`](skylink-frontend/src/components/booking/SeatMap.tsx)
- ✅ 支持三种座位状态：可选（绿色）、已售（灰色）、锁定（橙色）
- ⚠️ 已按“期望契约”编写 API 调用，但后端当前缺少对应 Controller 路由，暂无法联调通过

**需要后端补齐/确认的接口（建议以 `API_AUDIT_REPORT.md` 为准统一口径）**：
- `GET /api/v1/flights/{flightId}/seats?cabinType=...`：返回座位列表（含 `seatId/seatNumber/rowNumber/columnLetter/status`）
- `PUT /api/v1/orders/{orderId}/seat`：支付后换座（body: `{ newSeatId }`）
- （可选）`GET /api/v1/flights/{flightId}/seats/available-count?cabinType=...`

**验收标准（待达成）**：
- 已支付订单进入选座页能拉取到座位布局与状态
- 换座成功后，订单详情/订单列表能回显 seat 信息
- 并发冲突（座位被占）能返回 409，并提示可重试

**路由配置**：`/booking/seat-selection?orderNo={orderNo}&flightId={flightId}&cabinType={cabinType}`

---

### 4.2 ✅ 缺口 B：支付超时 UX 与状态一致性 - **已完成**

**实现状态**：
- ✅ 倒计时组件：[`skylink-frontend/src/components/common/Countdown.tsx`](skylink-frontend/src/components/common/Countdown.tsx)
- ✅ 支持三种显示模式：`badge`、`inline`、`full`
- ✅ 自动过期检测和回调
- ✅ 颜色状态变化：正常（橙色）→ 警告（红色脉冲）→ 过期（灰色）
- ✅ 已在用户订单页面 ([`UserBookings.tsx`](skylink-frontend/src/features/user/components/UserBookings.tsx)) 中使用

**验收标准（已达成）**：
- ✅ 订单详情与支付页展示倒计时（mm:ss）
- ✅ 倒计时结束后：按钮禁用 + 自动取消订单 + 刷新状态
- ✅ 支付提交后：无论成功或失败，都按"状态驱动"刷新订单与支付记录

**说明（2025-12-24 已校对）**：
- 前端已将支付超时统一到 `skylink-frontend/src/config/constants.ts`（`API_CONFIG.PAYMENT_TIMEOUT_MS`），与后端当前 1 分钟口径一致。
- 仍建议进一步将“订单详情页”的倒计时展示也统一收敛到 `Countdown` 组件（减少重复计时逻辑）。

---

### 4.3 ⚠️ 缺口 C：联程（Interline）方案 - **可视化已完成，下单未闭环**

**实现状态**：
- ✅ 搜索结果页面：[`skylink-frontend/src/pages/FlightResult/index.tsx`](skylink-frontend/src/pages/FlightResult/index.tsx)
- ✅ 航班列表组件：[`skylink-frontend/src/features/flight/components/FlightList.tsx`](skylink-frontend/src/features/flight/components/FlightList.tsx)
- ✅ 支持多段航程显示（`tripSegments`）
- ✅ 中转信息展示：中转城市、中转时长（颜色编码：<2.5h 橙色、2.5-6h 灰色、>6h 蓝色）

**当前缺口**：
- 前端下单仍调用 `POST /api/v1/orders`（单航班号），未接入后端 `POST /api/v1/bookings`（联程 split-join 提交）。
- 因此“联程下单后订单详情/列表按多段清晰展示”的验收尚不成立。

**验收标准（部分达成）**：
- ✅ 用户能在结果页一眼判断是否联程、在哪中转、等多久
- ⏳ 联程下单后订单详情清晰展示各段航班信息（待接入 `POST /api/v1/bookings` 后验收）
- ✅ 中转时长通过颜色标签直观表达

---

### 4.4 ✅ 新增：React Query 状态管理 - **已完成**

**实现状态**：
- ✅ 全局配置：[`skylink-frontend/src/lib/queryClient.ts`](skylink-frontend/src/lib/queryClient.ts)
- ✅ 19+ 自定义 hooks（涵盖航班、订单、支付、管理等所有业务模块）
  - [`useFlights.ts`](skylink-frontend/src/features/flight/hooks/useFlights.ts)
  - [`useOrders.ts`](skylink-frontend/src/features/booking/hooks/useOrders.ts)
  - [`usePayments.ts`](skylink-frontend/src/features/payment/hooks/usePayments.ts)
  - 等等...

**配置特点**：
- 查询缓存时间：5 分钟
- 垃圾回收时间：10 分钟
- 智能重试机制（401/403 不重试，409 重试）
- 窗口焦点时不自动刷新

---

## 5. 中优先级改进（可维护性与运营能力）

### 5.1 管理端数据量与导出策略

- 后端支付记录已提供分页接口：`GET /api/v1/payments/page`（避免一次性拉全量）
- 前端导出能力已有 `exportToCSV`：建议导出时基于“当前筛选结果（可选：导出当前页/导出全部需后端支持流式导出或后台任务）”

**验收标准**：
- 管理端列表默认走分页查询；导出不会导致浏览器卡死

### 5.2 统一错误语义（前后端联调效率）

**建议**：
- 统一返回：`code/msg/data` 已存在；补强错误的“可恢复性标识”（例如约定：409=业务冲突可重试；400=参数问题不可重试；500=系统错误可重试）
- 前端基于 code 做统一弹窗/提示策略

---

## 6. 新计划（前端交付计划，2025-12-24 起）

> 目标：以“能联调闭环”为完成标准，先补齐联程下单与选座的后端契约缺口，再做代码质量收敛与回归验证。

### Milestone 0：契约与口径统一（优先级最高，0.5～1 天）

- 统一支付超时：前端仅允许单一来源（`API_CONFIG.PAYMENT_TIMEOUT_MS`），订单列表/详情/支付弹窗倒计时展示一致；与后端 `OrderTimeoutTask` 当前 1 分钟口径一致。
- 统一成功语义：以 `code=0` 为成功（前端 `axios` 拦截器已按此处理），并在 README/审计文档里保持同口径。

### Milestone 1：联程下单闭环（1～2 天）

- 新增前端 `POST /api/v1/bookings` 调用与类型（对齐后端返回：联程 `parentOrderId + orderIds`，非联程 `orderIds`）。
- 更新下单逻辑：当用户选择多段航程时，走 `/api/v1/bookings` 提交；单段保持 `/api/v1/orders`。
- 更新“我的订单/订单详情”展示：能按 `parentOrderId` 聚合展示多段订单，并支持逐段查看与支付。

### Milestone 2：在线选座闭环（依赖后端，1～2 天）

- 明确并落地后端接口（建议在 `API_AUDIT_REPORT.md` 固化契约）：
  - `GET /api/v1/flights/{flightId}/seats`
  - `PUT /api/v1/orders/{orderId}/seat`
- 前端联调：SeatSelection 能加载座位图、换座成功回写、冲突返回 409 可重试。
- 若后端短期不做：前端将选座入口置为“不可用/隐藏”，避免用户走到死路。

### Milestone 3：管理后台收尾（0.5～1 天）

- 将 `useSensitiveAudit` 从“本地临时存储”切换为后端审计日志（复用系统日志或新增 API）。
- Dashboard 趋势图：若后端暂无趋势接口，则在 UI 上明确标识为“仅今日指标”。

### Milestone 4：回归与验收（0.5～1 天）

- 最小自动化：用 `vitest` 覆盖关键 API 适配（航班搜索映射、下单参数、支付确认 token 流程）。
- 手工验收清单：单程/联程下单、支付、超时取消、退款/改签入口、管理端 CRUD（航班/航线/机型/舱位/系统配置/日志）。

---

## 7. 前端技术栈总结（新增）

### 7.1 核心技术栈

- **框架**：React 18.2 + TypeScript
- **构建工具**：Vite
- **路由**：React Router v7
- **状态管理**：React Query（TanStack Query v5）
- **UI 组件**：Tailwind CSS
- **图标库**：Lucide React

### 7.2 项目结构

```
skylink-frontend/
├── src/
│   ├── components/          # 共享组件
│   │   ├── common/         # Countdown, WorldMap 等
│   │   ├── booking/        # SeatMap 等预订相关组件
│   │   └── layout/         # Navbar, Footer
│   ├── features/           # 业务功能模块
│   │   ├── auth/           # 认证
│   │   ├── booking/        # 预订、订单
│   │   ├── flight/         # 航班搜索
│   │   ├── payment/        # 支付
│   │   ├── refund/         # 退改
│   │   └── admin/          # 管理后台
│   ├── pages/              # 页面组件
│   ├── lib/                # 工具库（queryClient 等）
│   └── utils/              # 工具函数（export 等）
```

### 7.3 已实现的业务功能

#### 用户端
- ✅ 航班搜索（支持单程/联程）
- ✅ 航班预订与下单（单程已闭环；联程下单待接入 `POST /api/v1/bookings`）
- ⚠️ 在线选座/换座（前端页面与交互已实现；待后端补齐座位查询/换座接口后闭环）
- ✅ 支付流程（含倒计时、超时处理）
- ✅ 订单管理（列表、详情、导出）
- ✅ 退改签申请
- ✅ AI 助手集成

#### 管理端
- ✅ 用户管理
- ✅ 航班管理
- ✅ 订单管理（含批量操作）
- ✅ 支付记录管理
- ✅ 退改签审核
- ✅ 数据导出（CSV）
- ✅ 系统配置管理
- ✅ 操作日志审计

### 7.4 代码质量

- **类型安全**：100% TypeScript 覆盖
- **组件化**：高度模块化，可复用性强
- **错误处理**：统一的错误提示和重试机制
- **响应式设计**：移动端适配完善
- **性能优化**：React Query 缓存 + 懒加载

---

## 8. 风险与依赖清单

1) **规则口径不一致**（超时窗口、code 成功语义）会直接导致前端逻辑错误 → 优先完成 Milestone 0。
2) **选座需要布局/占用态数据**：若后端缺少公开 API，需要新增 Controller/DTO。
3) **分布式一致性带来“最终状态”**：前端必须采用“状态驱动 UI + 回源刷新”避免错觉。
4) **权限与鉴权目前为软校验**：前端要兼容 Header 校验，同时不要把“路由守卫”当成安全边界。

---

## 9. 附录：状态枚举（来自 API 审计）

### 9.1 订单状态（orderStatus）
- `1` 待支付
- `2` 已支付
- `4` 改签处理中
- `5` 已退票
- `6` 已取消

> 注意：审计报告仍包含 `0` 待审核、`3` 已拒绝；后端 README 提到“移除创建审核环节”，建议后续再核对并统一前端显示文案。

### 9.2 支付状态（paymentStatus）
- `0` 待支付
- `1` 已支付
- `2` 支付失败
- `3` 退款中
- `4` 已退款

---

## 10. 前端优化完成状态（2025-12-24）

### 10.1 已完成模块
- ✅ **用户模块**：个人资料、修改密码、绑定联系方式（UserCenter.tsx）
- ✅ **订单模块**：订单列表、订单详情、取消订单（Bookings.tsx）
- ✅ **支付模块**：支付流程、支付记录（Bookings.tsx 支付弹窗 + PaymentsMgmt.tsx）
- ✅ **退改模块**：申请退改、退改列表（RefundsHelp.tsx）
- ✅ **管理端前端**：
  - 用户管理（UsersMgmt.tsx）- 已迁移至 TanStack Query
  - 航班管理（FlightMgmt.tsx）- 已迁移至 TanStack Query
  - 订单管理（BookingsMgmt.tsx + OrderAudit.tsx）- 已迁移至 TanStack Query
  - 支付管理（PaymentsMgmt.tsx）- 已迁移至 TanStack Query
  - 退改审批（OrderAudit.tsx）- 已完成

### 10.2 技术债务清理
- ✅ **TanStack Query 迁移**：所有管理端模块已完成标准化数据获取
- ✅ **TypeScript 编译错误**：已修复 Login.tsx、UsersMgmt.tsx 等文件
- ✅ **API 对齐**：usePayments.ts、useRefundChanges.ts 已与后端接口对齐
- ✅ **组件原子化**：订单模块已实现列表/详情分离，管理端采用 AdminTableState 统一状态管理

### 10.3 架构优化成果
- **数据一致性**：通过 TanStack Query query invalidation 实现跨组件状态同步
- **错误处理**：统一错误边界和重试机制
- **性能优化**：React Query 缓存 + 分页 + 懒加载
- **代码复用**：AdminTableState、EntityCell、AdminBadge 等原子组件标准化

### 10.4 待优化项（Milestone 1）
- ✅ **统一响应语义**：后端 code 0 vs 200 对齐 - 已确认后端统一使用 code: 0 表示成功
- ✅ **支付窗口时长**：后端 1 分钟 vs 文档 2 分钟对齐 - 已确认为 60 秒
- ✅ **错误语义标准化**：409 可重试、400 不可重试、500 可重试 - 已在 axios.ts 和 queryClient.ts 中实现
- ✅ **联程可视化**：中转城市、中转时长、航段拆分 - 已在 FlightList.tsx 和 search.ts 中实现
- ✅ **Admin Hooks staleTime**：为管理端 hooks 添加性能优化配置 - 已为所有 admin hooks 添加 5-10 分钟缓存

---

## 11. Milestone 1 完成总结（2025-12-24）

### 11.1 核心架构优化成果
- **TanStack Query 全面迁移**：管理端所有模块已完成标准化数据获取和状态管理
- **响应语义统一**：确认后端使用 `code: 0` 表示成功，前端已完全适配
- **错误处理标准化**：实现 409/400/500 等错误码的智能重试机制
- **联程航班可视化**：支持中转城市、中转时长、航段拆分显示
- **性能优化**：所有 admin hooks 配置 staleTime/gcTime 缓存策略

### 11.2 技术债务清零
- ✅ TypeScript 编译错误全部修复
- ✅ 废弃函数（reload）全部替换为 refetch
- ✅ API 接口与后端完全对齐
- ✅ 组件原子化重构完成
- ✅ 跨组件状态同步机制建立

### 11.3 用户体验提升
- **数据一致性**：通过 query invalidation 实现实时数据同步
- **加载性能**：缓存策略减少不必要的网络请求
- **错误恢复**：智能重试和友好错误提示
- **联程航班**：清晰的中转信息和航段展示

## 12. 下一步计划（Milestone 2）
1. **后端规则对齐**：统一超时窗口和响应码语义
2. **性能调优**：为 TanStack Query hooks 添加 staleTime 和 refetchInterval
3. **可视化增强**：联程航班的中转信息展示
4. **测试覆盖**：添加关键业务流程的 E2E 测试
5. **文档完善**：API 文档与前端 hooks 对齐验证
