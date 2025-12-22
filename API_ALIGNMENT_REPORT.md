# API 对齐报告（前端 vs 后端）

> 目标：确保 skylink-frontend 已使用/将使用的接口在 skylink-backend 中存在，且路径/方法/返回结构一致。

## ✅ 已修复的关键对齐点

- 退改签（Refund/Change）
  - 后端 `GET /api/v1/refund-change-requests`：此前服务层 `search()` 返回空数组，导致前端永远无数据；已补齐查询与 DTO 映射。
  - 后端 `POST /api/v1/refund-change-requests/{recordId}/approvals|rejections`：保持不变，前端管理端已补齐封装并在审核页接入。
  - 后端 `DELETE /api/v1/refund-change-requests/{recordId}`：已补齐 revoke 逻辑（仅允许 pending），并将订单状态回滚。

## ⚠️ 后端存在但前端未封装/未使用（目前不阻塞）

- `POST /api/v1/admins/orders/{orderId}/audits`
  - 后端存在管理员订单审核接口；前端当前页面/封装未发现实际调用点（管理端现有“退改签审核”页走的是 `refund-change-requests` 审批/驳回）。

## 变更落点

- 后端：`skylink-backend/src/main/java/com/team/skylink/module/refund/service/RefundChangeServiceImpl.java`
- 前端：
  - `skylink-frontend/src/features/admin/api/refundChangeRequests.ts`
  - `skylink-frontend/src/features/admin/index.ts`
  - `skylink-frontend/src/pages/Admin/OrderAudit.tsx`

