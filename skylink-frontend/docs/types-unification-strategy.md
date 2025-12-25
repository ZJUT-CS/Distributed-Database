# 类型定义统一策略

## 当前类型分布

### 1. 全局共享类型 (src/types/index.ts)
| 类型 | 用途 | 状态 |
|------|------|------|
| APIResponse | 标准 API 响应结构 | ✅ |
| PaginationParams | 分页请求参数 | ✅ |
| PaginatedResponse | 分页响应结构 | ✅ |

### 2. Feature 内部类型

#### booking/types.ts
| 类型 | 用途 |
|------|------|
| PassengerInfo | 乘客信息 |
| BookingDetails | 预订详情 |
| ConfirmedBooking | 确认订单 |

#### flight/types.ts
| 类型 | 用途 |
|------|------|
| Flight | 航班实体 |
| FlightSegment | 联程航段 |
| Airport | 机场信息 |
| MapPoint | 地图点 |
| FilterState | 筛选状态 |
| SearchParams | 搜索参数 |

#### auth/types.ts
| 类型 | 用途 |
|------|------|
| User | 用户实体 |

#### payment/types.ts
| 类型 | 用途 |
|------|------|
| Payment | 支付记录 |

#### refund/types.ts
| 类型 | 用途 |
|------|------|
| RefundChange | 退改记录 |
| AuditStatus | 审核状态 |

#### user/types.ts
| 类型 | 用途 |
|------|------|
| RefundChangeRecord | 退改记录 (展示用) |
| AuditStatus | 审核状态 (重复) |

#### ai/types.ts
| 类型 | 用途 |
|------|------|
| AIRecommendation | AI 推荐城市 |

#### admin/api/types.ts
| 类型 | 用途 |
|------|------|
| PageResult | 分页结果 (与 PaginatedResponse 重复) |

## 发现的问题

### 1. 类型重复
- `AuditStatus` 同时定义在 `refund/types.ts` 和 `user/types.ts`
- `PageResult` (admin) 与 `PaginatedResponse` (全局) 功能重复

### 2. 职责不清晰
- 退改相关类型分散在 `refund/types.ts` 和 `user/types.ts`
- `user/types.ts` 包含了退改记录类型，应该归入 refund feature

## 优化方案

### 方案 1: 统一 PageResult
将 `admin/api/types.ts` 中的 `PageResult` 替换为全局 `PaginatedResponse`

### 方案 2: 统一退改相关类型
将 `user/types.ts` 中的退改相关类型迁移到 `refund/types.ts`，保持单一职责

### 方案 3: 创建 barrel 导出
为每个 feature 创建 `index.ts` 统一导出该 feature 的所有类型，方便外部引用

## 实施计划

1. 将 `user/types.ts` 中的 `RefundChangeRecord` 和 `AuditStatus` 迁移到 `refund/types.ts`
2. 将 `admin/api/types.ts` 中的 `PageResult` 替换为 `PaginatedResponse`
3. 为每个 feature 创建 `types/index.ts` barrel 文件
4. 更新所有引用

## 类型导入规范

- 跨 Feature 共享类型：从 `src/types` 导入
- Feature 内部类型：从 `@/features/{feature}/types` 导入
- Feature API 类型：从 `@/features/{feature}/api` 导入
