# SkyLink 项目深度分析与改进建议报告

## 1. 项目概览 (Project Overview)

**SkyLink** 是一个典型的现代化分布式航空订票系统。
- **后端**: Spring Boot 4 + MyBatis-Plus，采用 ShardingSphere 分库分表，支持复杂的联程（Split-Join）算法、分布式事务订单、以及 Mode B（下单锁座、支付候补/选座）的业务模式。
- **前端**: React + TypeScript + Vite，使用 TailwindCSS 进行样式开发，包含管理后台与用户前台双端。

经过对代码库的详细审查，包括核心控制器 (`OrderController`, `FlightController`)、前端页面流程 (`Booking`, `UserCenter`) 以及业务文档的分析，得出以下评估报告。

---

## 2. 现状分析 (Current State Analysis)

### ✅ 后端亮点 (Backend Strengths)
1.  **智能联程**: `FlightController` 支持内存拼接中转方案，且有 `InterlineTimeConflictException` 等完善的校验逻辑。
2.  **健壮的订单状态机**: `Pending -> Paid -> Cancelled/Refunded` 状态流转清晰，且包含定时任务 (`OrderTimeoutTask`) 处理支付超时（当前实现为 1 分钟；建议以配置为单一来源统一前后端口径）。
3.  **Mode B 选座底层支持**: 数据库 `orders` 表已新增 `seat_id`，且文档明确支持“支付后换座/选座”的逻辑，提供了锁座与释放接口。
4.  **权限控制**: 明确的 Header 鉴权 (`X-User-Type`, `X-Admin-Role`) 机制。
5.  **系统配置管理**: 已具备 `AdminConfigController` + `AdminConfigService` + 前端 `Settings.tsx` 完整链路，可用于动态开关功能。

### ⚠️ 后端待清理项 (Backend Cleanup)
- **OpenAPI 配置重复**: 同时存在 `OpenApiConfig.java` 和 `SwaggerConfig.java`，建议二选一，避免 Bean 冲突或文档不一致。

### ⚠️ 前端逻辑链现状 (Frontend Logic Chain)
1.  **基础闭环**: 搜索 -> 列表展示 -> 下单 -> 支付 -> 订单详情 -> 退改签申请 -> 管理员审核。这一核心链路已打通。
2.  **管理后台**: 功能非常完善，覆盖了航班、订单、用户、日志、机型等全量管理功能。
3.  **用户中心**: 包含个人资料、订单列表、退改签记录，逻辑清晰。
4.  **通用工具**: 已具备 CSV 导出工具 (`src/utils/export.ts`)，可用于各页面的数据导出功能。

---

## 3. 关键缺口与改进建议 (Gap Analysis & Recommendations)

经过对比后端能力与前端实现，发现以下 **3 个关键改进点**，建议优先处理以提升用户体验和业务完整性。

### 🔴 缺口 1: 缺少“在线选座”功能模块 (Missing Seat Selection)
**问题描述**:
后端 `README.md` 明确提到 **Mode B 选座机制**：“支付成功后...如有需要可进行换座”。后端已有座位锁/释放逻辑。
**现状**: 前端目前仅在下单时收集人数，并未发现用户侧的 `SeatMap`（座位图）或 `SeatSelection` 页面。用户无法利用后端的“支付后可选座”能力。

**💡 改进建议**:
*   **新增页面**: `src/pages/Booking/SeatSelection.tsx`
*   **入口**: 在“订单详情页” (`BookingDetails.tsx`)，当状态为 `已支付` 时，显示“在线选座/换座”按钮。
*   **功能**:
    1.  调用后端接口获取机型座位布局 (`rows`, `columns`, `layout`)。
    2.  可视化展示座位图（区分：可选、已售、已锁、不仅可用）。
    3.  用户点击座位后，调用后端“换座”接口进行原子更新。

**📋 接口契约草案 (基于 `SeatServiceImpl.java`)**:

| 功能 | 后端方法 | 前端 API 封装建议 | Request | Response |
|------|---------|-----------------|---------|----------|
| 查询座位布局 | `SeatMapper.selectList` | `GET /api/v1/flights/{flightId}/seats` | `flightId`, `cabinType?` | `{ seats: Seat[], layout: { rows, cols } }` |
| 支付后换座 | `SeatServiceImpl.changeSeat(orderId, newSeatId)` | `PUT /api/v1/orders/{orderId}/seat` | `{ newSeatId: number }` | `{ success: boolean }` |
| 查询可用座位数 | `SeatServiceImpl.getAvailableCount(flightId, cabinType)` | `GET /api/v1/flights/{flightId}/seats/available-count` | `cabinType` | `{ count: number }` |

**座位状态枚举 (Seat.status)**:
- `1` = 可用 (Available)
- `2` = 已售 (Sold)
- `3` = 锁定中 (Locked，待支付)

**✅ 验收标准**:
1. 已支付订单可展示完整座位图，颜色区分可用/已售/锁定状态
2. 用户点击可用座位后，订单 `seatId` 更新成功
3. 并发换座时，被抢占的座位应提示"该座位已被占用"

### 🔴 缺口 2: 支付超时体验优化 (Payment Timeout UX)
**问题描述**:
后端存在较短的支付超时窗口（当前实现为 **1分钟**，建议配置化并在前后端统一口径）。
**现状**: 前端 `BookingDetailsPage` 计算了 `getPaymentDeadlineMs`，但用户可能在浏览时不知不觉超时，导致后端已取消订单，而前端界面仍显示“待支付”，点击支付会报错。

**💡 改进建议**:
*   **实时倒计时**: 在订单详情页和支付弹窗中醒目展示倒计时（mm:ss）。
*   **自动状态同步**: 当倒计时结束时：
    1.  前端自动锁定“去支付”按钮。
    2.  弹出提示“订单已失效，请重新搜索”。
    3.  触发一次静默刷新，从后端获取最新的 `Cancelled` 状态。

### 🟠 缺口 3: 联程航班 (Interline) 的可视化展示
**问题描述**:
后端支持复杂的"智能中转"，例如 A -> B (中转) -> C。
**现状**: 搜索结果页目前是列表展示。对于非直飞航班，用户需要非常清晰地感知到"中转城市"、"中转时长"以及"是否需要重新托运"。

**💡 改进建议**:
*   **优化 `FlightResult` 卡片**:
    *   为联程航班添加独特的视觉连接线。
    *   高亮显示 **中转时长**（例如：`⚠️ 中转 2h 15m`）。
    *   如果中转时间过短（接近 2h 下限）或过长，给出不同颜色的提示。
*   **订单详情页增强**: 在展示联程订单时，将两个子航段分组展示，明确显示第一程到达时间和第二程起飞时间的时间差。

**⚠️ 风险/依赖**:
- **后端数据结构**: 需确认 `FlightSearchResult` 中是否包含分段航班信息 (`segments` 数组)。
- 根据后端 README，联程航班通过 `interlineFlights` 数组返回，每个元素包含 `segments`、`totalPrice`、`transferCity`。
- 前端需解析 `segments[].departureTime` 和 `segments[].arrivalTime` 来计算中转时长。

**✅ 验收标准**:
1. 联程航班卡片可视化显示中转城市和中转时长
2. 中转时长 < 2.5h 显示橙色警告，≥ 6h 显示蓝色提示
3. 订单详情页能分组展示多段航班信息

---

## 4. 详细执行计划 (Implementation Plan)

### 第一阶段：补全选座功能 (Priority: High)
1.  **API 对接**: 封装后端 `SeatService` 相关接口（查询布局、更换座位）。
2.  **组件开发**: 开发 `<SeatMap layout={...} occupied={...} />` 组件，使用 Canvas 或 CSS Grid 绘制机舱。
3.  **页面集成**: 在 `BookingDetails` 页面的操作区添加入口。

**✅ 验收标准**: 已支付订单可展示座位图、占用态正确、换座后订单 `seatId` 更新且座位状态一致。

### 第二阶段：优化支付流程 (Priority: Medium)
1.  **倒计时组件**: 封装 `<Countdown target={expireTime} onEnd={handleExpire} />`。
2.  **状态守卫**: 在点击"支付"前，再次校验 `Date.now() < expireTime`，减少无效请求。

**✅ 验收标准**: 订单详情页显示实时倒计时，超时后自动刷新状态并禁用支付按钮。

### 第三阶段：视觉与交互提升 (Priority: Low)
1.  **联程 UI**: 优化搜索结果列表的 CSS。
2.  **加载骨架屏**: 在搜索航班和加载订单详情时添加 Skeleton Screen，提升高级感。

**✅ 验收标准**: 联程航班有独特的视觉标识，页面加载时显示骨架屏而非空白。

### 总结
目前的后端基础非常扎实，业务模型成熟。前端的主要任务是将后端隐藏的高级能力（如Mode B选座、严格的超时控制、联程逻辑）通过更优秀的 UI/UX 暴露给用户。建议从 **在线选座** 功能开始着手迭代。

---

## 5. 后端逻辑链深度分析 (Backend Logic Chain Analysis)

### 5.1 BookingController (预订模块)
**位置**: `skylink-backend/src/main/java/com/team/skylink/module/booking/controller/BookingController.java`

**当前状态**:
- `POST /api/v1/bookings` - 提交预订请求
- `GET /api/v1/bookings` - 查询预订列表

**问题**:
- 前端 `Booking/index.tsx` 直接调用 `OrderController` 的 `createOrder`，绕过了 `BookingController`
- 预订和订单的边界不清晰，职责划分模糊

**建议**:
- 明确 `BookingController` 作为预订流程的入口，`OrderController` 作为订单管理的核心
- 在 `BookingController` 中添加预订状态流转的统一管理

### 5.2 FlightController (航班搜索)
**位置**: `skylink-backend/src/main/java/com/team/skylink/module/flight/controller/FlightController.java`

**当前状态**:
- `GET /api/v1/flights` - 搜索航班（带 `@Cacheable` 缓存）

**问题**:
- 中转航班搜索逻辑复杂（`FlightServiceImpl.java:100-150`），可能影响性能
- 缺少航班实时状态更新机制（如延误、取消）

**建议**:
- 优化中转航班搜索算法，考虑使用图算法或预计算
- 添加航班状态变更的 WebSocket 推送机制

### 5.3 OrderController (订单管理)
**位置**: `skylink-backend/src/main/java/com/team/skylink/module/order/controller/OrderController.java`

**当前状态**:
- `POST /api/v1/orders` - 创建订单
- `GET /api/v1/orders` - 查询订单
- `POST /api/v1/orders/{id}/cancellation` - 取消订单
- `POST /api/v1/orders/{id}/audit` - 审核订单（管理员）

**问题**:
- 订单状态流转逻辑分散在 `OrderServiceImpl`、`RefundChangeServiceImpl` 等多个服务中
- 缺少订单状态机统一管理

**建议**:
- 引入状态机模式（如 Spring StateMachine）统一管理订单状态流转
- 添加订单操作日志记录，便于审计

### 5.4 PaymentController (支付)
**位置**: `skylink-backend/src/main/java/com/team/skylink/module/payment/controller/PaymentController.java`

**当前状态**:
- `POST /api/v1/payments` - 创建支付
- `POST /api/v1/payments/confirmation-tokens` - 创建支付确认令牌
- `POST /api/v1/payments/confirmations` - 确认支付

> ✅ **后端已具备支付超时自动取消机制**（`OrderTimeoutTask` 定时任务；当前实现为 1 分钟超时，建议以配置为准）。

**问题 (前端体验与状态同步)**:
- 前端缺乏实时倒计时展示，用户容易不知不觉超时
- 后端订单已取消时，前端可能仍显示"待支付"状态，导致用户点击支付报错
- 缺少支付失败后的友好重试引导

**建议**:
- 前端添加醒目的倒计时组件 (`<Countdown />`)，倒计时结束时自动刷新订单状态
- 支付失败时，前端先查询订单最新状态再决定是否允许重试

### 5.5 RefundChangeController (退改管理)
**位置**: `skylink-backend/src/main/java/com/team/skylink/module/refund/controller/RefundChangeController.java`

**当前状态**:
- `POST /api/v1/refund-change-requests` - 申请退改
- `GET /api/v1/refund-change-requests` - 查询退改记录
- `DELETE /api/v1/refund-change-requests/{id}` - 撤销申请
- `PUT /api/v1/refund-change-requests/{id}` - 更新申请
- `POST /api/v1/refund-change-requests/{id}/approvals` - 审核通过
- `POST /api/v1/refund-change-requests/{id}/rejections` - 审核拒绝

**问题**:
- 退改记录查询缺少分页（`RefundChangeServiceImpl.java:search` 方法返回 `List` 而非 `PageResult`）
- 大量数据时性能会受影响

**建议**:
- 将 `search` 方法改为分页查询，返回 `PageResult<List<RefundChangeSearchResponse>>`
- 添加退改记录的导出功能

---

## 6. 前端用户页面逻辑链深度分析 (Frontend User Pages Logic Chain Analysis)

### 6.1 Booking/index.tsx (预订页面)
**位置**: `skylink-frontend/src/pages/Booking/index.tsx`

**当前逻辑链**:
1. 用户填写预订信息 → `handleConfirm`
2. 调用 `createOrder` API → `POST /api/v1/orders`
3. 保存乘客信息到本地存储 → `saveOrderPassengers`
4. 跳转到订单详情页 → `/my-bookings/{id}`

**问题**:
- 直接调用 `OrderController`，绕过了 `BookingController`
- 缺少预订前的座位锁定机制
- 缺少预订失败后的重试机制

**建议**:
- 添加座位预锁定功能（调用后端临时锁定座位接口）
- 添加预订失败后的错误提示和重试按钮
- 考虑添加预订进度指示器

### 6.2 Booking/Confirmation.tsx (确认页面)
**位置**: `skylink-frontend/src/pages/Booking/Confirmation.tsx`

**当前逻辑链**:
1. 显示预订成功信息
2. 调用 AI 目的地指南 → `getDestinationGuide`
3. 提供"查看我的订单"和"返回首页"按钮

**问题**:
- 仅展示成功信息，未提供后续操作入口（如支付、改签）
- AI 指南加载失败时无降级方案

**建议**:
- 添加"立即支付"按钮（如果订单状态为待支付）
- 添加 AI 指南加载失败的降级方案（显示静态推荐内容）

### 6.3 FlightResult/index.tsx (航班结果页面)
**位置**: `skylink-frontend/src/pages/FlightResult/index.tsx`

**当前逻辑链**:
1. 从 URL 或 location.state 获取搜索参数
2. 调用 `searchFlights` API → `GET /api/v1/flights`
3. 应用前端筛选逻辑 → `filteredFlights`
4. 用户选择航班 → `handleFlightSelect`
5. 多段行程时继续搜索下一段，否则跳转到预订页

**问题**:
- 筛选逻辑完全在前端实现，未利用后端筛选能力
- 缺少筛选条件保存功能
- 缺少筛选结果导出功能

**建议**:
- 将筛选参数传递给后端，利用后端筛选能力
- 添加筛选条件保存功能（保存到用户偏好设置）
- 添加筛选结果导出功能（导出为 Excel/PDF）

### 6.4 Home/index.tsx (首页)
**位置**: `skylink-frontend/src/pages/Home/index.tsx`

**当前逻辑链**:
1. 显示搜索表单
2. 用户提交搜索 → `handleSearch`
3. 跳转到航班结果页 → `/results?{params}`

**问题**:
- 缺少热门航线推荐
- 缺少用户历史搜索记录

**建议**:
- 添加热门航线推荐模块
- 添加用户历史搜索记录（基于用户 ID）

### 6.5 User/Bookings.tsx (我的订单页面)
**位置**: `skylink-frontend/src/pages/User/Bookings.tsx`

**当前逻辑链**:
1. 调用 `searchOrders` API → `GET /api/v1/orders?userId={id}`
2. 映射订单数据 → `mapOrderToBooking`
3. 显示订单列表

**问题**:
- 缺少订单详情的独立接口（当前通过列表接口获取单条记录）
- 缺少订单筛选功能（按状态、日期等）
- 缺少订单导出功能

**建议**:
- 添加订单详情独立接口 → `GET /api/v1/orders/{id}`
- 添加订单筛选功能（状态、日期范围、航班号等）
- 添加订单导出功能（✅ 可复用现有工具 `src/utils/export.ts` 中的 `exportToCSV`）

### 6.6 User/RefundsHelp.tsx (退改/售后页面)
**位置**: `skylink-frontend/src/pages/User/RefundsHelp.tsx`

**当前逻辑链**:
1. 调用 `listRefundChanges` API → `GET /api/v1/refund-change-requests?userId={id}`
2. 显示退改记录列表
3. 用户可撤销申请 → `handleRevoke` → `DELETE /api/v1/refund-change-requests/{id}`
4. 用户可重新申请 → `handleReApply` → `PUT /api/v1/refund-change-requests/{id}`

**问题**:
- 未充分利用后端提供的审核通过/拒绝接口（仅管理员使用）
- 缺少退改记录的分页加载
- 缺少退改记录的导出功能

**建议**:
- 添加退改记录的分页加载（需后端支持）
- 添加退改记录的导出功能（✅ 可复用 `exportToCSV`，后续再评估 Excel/PDF）
- 考虑添加退改进度实时更新（WebSocket）

---

## 7. 需要添加或更改的页面 (Pages to Add or Modify)

### 7.1 新增页面：PaymentPage (支付页面)
**位置**: `skylink-frontend/src/pages/Payment/index.tsx`

**功能**:
- 显示订单支付信息
- 提供多种支付方式选择
- 支付成功后跳转到订单详情页

**逻辑链**:
1. 从订单详情页跳转，携带订单 ID
2. 调用 `createPaymentConfirmToken` API → `POST /api/v1/payments/confirmation-tokens`
3. 用户选择支付方式并确认
4. 调用 `confirmPayment` API → `POST /api/v1/payments/confirmations`
5. 支付成功后跳转到订单详情页

### 7.2 ✅ 已存在页面：ChangeFlight.tsx (改签页面) - 待优化
**位置**: `skylink-frontend/src/pages/Booking/ChangeFlight.tsx` (已存在，约 30KB)

**当前功能**:
- 显示原航班信息
- 提供新航班搜索和选择
- 提交改签申请

**待优化点**:
1. 从订单详情页跳转，携带订单 ID
2. 显示原航班信息
3. 用户搜索新航班
4. 用户选择新航班后计算改签费用
5. 调用 `applyRefundChange` API → `POST /api/v1/refund-change-requests` (operType=2)
6. 跳转到退改/售后页面查看审核进度

### 7.3 修改页面：User/Bookings.tsx (我的订单页面)
**改进**:
- 添加订单筛选功能（状态、日期范围、航班号）
- 添加订单导出功能
- 添加订单详情独立接口调用

### 7.4 修改页面：FlightResult/index.tsx (航班结果页面)
**改进**:
- 添加筛选条件保存功能
- 添加筛选结果导出功能
- 将筛选参数传递给后端

---

## 8. 前端架构优化建议 (Frontend Architecture Optimization)

### 8.1 架构与组件拆分 (Architecture & Decomposition)
目前的 SearchForm.tsx (约 500 行) 和 BookingForm.tsx (约 500 行) 代码过于庞大，属于“巨型组件”。这会导致维护困难，且状态逻辑（State Logic）与 UI 渲染耦合太紧。
优化方针：
逻辑与视图分离 (Custom Hooks)：
现状：BookingForm 中混杂了 localStorage 读取、表单校验、价格计算、步骤跳转等逻辑。
建议：将逻辑抽离为 useBookingLogic。例如：
usePassengerValidation: 专门处理乘客信息的正则校验（身份证/手机号）。
usePriceCalculator: 专门根据乘客数量、舱位、增值服务计算总价。
useBookingDraft: 专门处理 sessionStorage 的草稿保存与恢复。
好处：组件只负责 return JSX，逻辑变得可测试、可复用。
UI 组件原子化 (Atomic Design)：
现状：SearchForm 中手写了一个非常复杂的日历组件和城市选择器。
建议：
日期选择器：将日历部分提取为 components/ui/FlightCalendar.tsx。
城市选择器：提取为 components/ui/CityPicker.tsx。
乘客卡片：在预订页，将单个乘客的输入框提取为 PassengerCard.tsx。
好处：降低主文件的大小，且这些通用组件可以在“改签页面”或“管理后台”复用。
二、 状态管理与数据流 (State Management & Data Fetching)
你目前主要使用 useState 和 useEffect 进行数据获取和状态管理。在分布式系统中，这往往不够健壮。
优化方针：
引入服务端状态管理库 (React Query / TanStack Query)：
痛点：分布式系统中，数据的“时效性”很关键。比如剩余票数可能在几秒内变化。
建议：强烈建议引入 TanStack Query 替代 useEffect + axios 的手动调用。
自动轮询：在支付等待页面，可以设置 refetchInterval 自动查询订单状态。
缓存失效：下单成功后，自动调用 queryClient.invalidateQueries(['flights']) 来刷新航班列表的库存显示。
防抖与竞态处理：搜索框输入时，React Query 能自动取消过期的请求，防止旧的搜索结果覆盖新的。
改进 AuthContext (useAuth.tsx)：
现状：手动监听 localStorage，存在跨标签页不同步的问题（比如在一个标签页退出登录，另一个标签页依然显示已登录）。
建议：
使用 window.addEventListener('storage', ...) 监听 Storage 变化，实现跨标签页登出同步。
不要将敏感的 User 对象完整存在 localStorage。建议仅存储 Token，并在应用初始化时通过 Token 换取最新的 User Profile。
三、 针对“分布式事务”的前端适配
这是你项目的核心难点。由于后端采用了分布式架构，前端必须处理 “最终一致性” 带来的 UI 挑战。
优化方针：
幂等性增强 (Idempotency)：
现状：axios.ts 中已经自动生成了 Idempotency-Key，这很好。
建议：细化错误处理。如果后端返回 409 Conflict (重复请求) 或 System Busy，前端不应直接报错，而应该：
自动查询状态：假设用户点击支付，网络超时了，但后端其实已经处理了。前端重试时应先查询“该订单号是否已支付”，而不是盲目重发支付请求。
长事务的交互设计 (Saga Pattern UI)：
场景：联程航班（Interline）可能涉及跨多个服务扣减库存，耗时较长。
建议：
乐观 UI (Optimistic UI)：点击预订后，立即显示“处理中”，不要让用户重复点击。
异步轮询结果：下单接口不要同步等待所有微服务完成。后端可能先返回“接收请求成功 (HTTP 202 Accepted)”。前端拿到 orderId 后，进入一个“出票中”的等待页面，每隔 2 秒轮询一次订单最终状态。
解决“读写延迟” (Read-Your-Writes)：
场景：用户刚修改了个人资料，跳转回首页，由于主从数据库延迟，首页可能还显示旧名字。
建议：
前端在 Mutation（修改操作）成功后，手动更新本地 Cache（React Query 的 setQueryData），确保 UI 立即显示最新数据，而不依赖后端的即时返回。
四、 安全性与数据校验 (Security & Validation)
优化方针：
表单校验库 (Zod / Yup)：
现状：BookingForm 中使用手写的 Regex 校验身份证和手机号 (validation useMemo)。
建议：引入 Zod。
定义一个 Schema，例如 PassengerSchema。这不仅能简化代码，还能保证前后端（如果后端是 Node）或者前端各处的校验逻辑一致。
复杂的逻辑（如：身份证号校验位算法）应封装为 Zod 的自定义规则。
敏感数据保护：
现状：BookingForm 代码中直接处理 passportNumber。
建议：
确保在日志打印、Sentry 上报等环节，自动对 passportNumber 和 phone 进行脱敏处理。
axios 拦截器中，如果发生错误，上报 raw 数据时要小心不要把用户的支付密码或完整身份证号传到日志服务器。
五、 用户体验 (UX) 细节优化
虚拟滚动 (Virtualization)：
场景：机票搜索结果列表可能很长。
建议：如果列表超过 50 条，建议使用 react-window 或 react-virtuoso 进行虚拟渲染，避免 DOM 节点过多导致页面卡顿。
骨架屏 (Skeleton Screens)：
现状：代码中提到了 TableSkeleton，但在 BookingForm 或 SearchForm 加载时未明确看到使用。
建议：在 API 请求期间（isAiLoading 或 loading 状态），不要只显示一个 Spinner，而是显示表单或列表的灰色占位图，减少用户的等待焦虑感。
六、 代码细节修正 (Code Review)
针对你提供的具体文件，有几个小点可以直接修复：
src/lib/axios.ts:
baseURL 默认为 localhost:9999。建议在 .env 文件中强制管理，或者使用 /api 相对路径配合 Nginx 反向代理，避免跨域 (CORS) 复杂性。
transformResponse 中使用了 JSONbig。请确保所有后端返回的 Long 类型 ID (如 Snowflake ID) 确实被前端当作字符串处理了，否则在传递给路由参数时可能会出问题。
src/features/flight/components/SearchForm.tsx:
handleDateSelect 里的逻辑非常复杂（判断往返、单程、起始日期大小）。建议引入 date-fns 库来处理日期比较（isBefore, isAfter, addDays），替换手写的字符串比较逻辑，因为字符串比较日期（虽然 'YYYY-MM-DD' 格式可行）由于时区问题容易出 Bug。
总结执行路线：
第一步（重构）：引入 Zod 和 React Hook Form 重构 BookingForm，去掉手写的校验逻辑。
第二步（状态）：引入 React Query，替换掉手动 Axios 调用，特别是针对航班搜索和订单查询接口。
第三步（组件）：将 SearchForm 中的日历组件剥离出来。
第四步（一致性）：完善订单支付后的轮询逻辑，适配分布式后端的异步处理特性。
