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

后端已具备 Mode B（下单锁座、支付后换座/选座）、联程下单与超时取消等核心能力；前端当前主要短板在于：**在线选座缺失、支付超时 UX 与状态同步不足、联程可视化不够清晰**。此外存在若干“文档/契约不一致”（尤其是**统一响应 code 语义**与**支付窗口时长**），建议先做 Phase 0 统一，再进入功能迭代。

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

## 4. 高优先级缺口（以“可交付功能”为中心）

### 4.1 缺口 A：用户侧“在线选座/换座”缺失

**现状**：后端已提供换座能力（`SeatService.changeSeat`），订单表也有 `seat_id`，但前端缺少 SeatMap/SeatSelection 页面与入口。

**建议交付**：
- 新增用户端页面：`SeatSelection`（支付成功后可进入）
- 在订单详情页根据 `orderStatus=已支付` 显示“在线选座/换座”入口

**验收标准（可测试）**：
- 已支付订单可进入选座页并显示座位布局
- 选中座位后调用换座接口成功，订单详情刷新后 seatId/seatNo 更新
- 并发冲突（座位被占）返回明确错误并提示可重试

### 4.2 缺口 B：支付超时 UX 与状态一致性不足

**现状**：后端会自动取消；前端可能仍停留在“待支付”并允许点击支付，造成报错/困惑。

**建议交付**：
- 订单详情与支付页展示倒计时（mm:ss）
- 倒计时结束后：按钮禁用 + 弹提示 + 触发一次回源刷新订单状态
- 支付提交后：无论成功或超时/网络问题，都按“状态驱动”刷新订单与支付记录

**验收标准**：
- 订单超时后前端不再允许发起支付，并自动刷新显示“已取消”
- 支付请求超时/断网后，前端不会无限报错；会提示“正在确认支付结果/请刷新订单状态”，并可查看最终状态

### 4.3 缺口 C：联程（Interline）方案的可视化表达不足

**现状**：后端支持联程组合返回；前端列表展示对“中转城市/中转时长/航段拆分”表达不够强。

**建议交付**：
- 搜索结果卡片：
  - 直飞/联程分组展示
  - 联程展示：总价、总时长、中转城市、每段起降时间 + 中转时长
- 订单详情页：联程订单按航段分组展示，突出衔接时间

**验收标准**：
- 用户能在结果页一眼判断是否联程、在哪中转、等多久
- 联程下单后订单详情清晰展示各段航班信息

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

## 6. 分阶段落地计划（建议）

### Phase 0：契约对齐与文档修正（1 次迭代内完成）

- 对齐：统一响应 `code` 成功语义（0 or 200 二选一，建议 0）
- 对齐：支付窗口时长（2min vs 1min）改为单一来源
- 修订根 README：后端版本口径

**产出**：文档一致、前端拦截器策略确定、后续功能不会踩“规则不一致”。

### Phase 1：在线选座（高优先）

- UI：SeatMap + SeatSelection 页面
- 接口：对接座位布局/可用态/换座（如缺少“座位布局查询”API，则补后端 Controller 并在 `API_AUDIT_REPORT` 更新）

### Phase 2：支付流程体验与一致性（中高优先）

- 倒计时 + 订单状态刷新
- 支付提交后的“确认结果”策略（失败/超时/重复点击）

### Phase 3：联程可视化（中优先）

- 结果卡片与订单详情的联程分段展示

---

## 7. 风险与依赖清单

1) **规则口径不一致**（超时窗口、code 成功语义）会直接导致前端逻辑错误 → 先做 Phase 0。
2) **选座需要布局/占用态数据**：若后端缺少公开 API，需要新增 Controller/DTO。
3) **分布式一致性带来“最终状态”**：前端必须采用“状态驱动 UI + 回源刷新”避免错觉。
4) **权限与鉴权目前为软校验**：前端要兼容 Header 校验，同时不要把“路由守卫”当成安全边界。

---

## 8. 附录：状态枚举（来自 API 审计）

### 8.1 订单状态（orderStatus）
- `1` 待支付
- `2` 已支付
- `4` 改签处理中
- `5` 已退票
- `6` 已取消

> 注意：审计报告仍包含 `0` 待审核、`3` 已拒绝；后端 README 提到“移除创建审核环节”，建议后续再核对并统一前端显示文案。

### 8.2 支付状态（paymentStatus）
- `0` 待支付
- `1` 已支付
- `2` 支付失败
- `3` 退款中
- `4` 已退款
