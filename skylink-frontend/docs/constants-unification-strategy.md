# 常量配置整理策略

## 当前常量分布

### 1. 全局配置 (src/config/)

#### src/constants.ts
| 常量 | 用途 | 建议位置 |
|------|------|----------|
| POPULAR_AIRPORTS | 热门机场列表 | src/config/data/airports.ts |
| AIRLINES | 航空公司列表 | src/config/data/airlines.ts |
| AIRCRAFTS | 机型列表 | src/config/data/aircrafts.ts |

#### src/config/constants.ts
| 常量 | 用途 | 建议位置 |
|------|------|----------|
| API_CONFIG | API 配置（支付超时、订单状态等） | src/config/api/index.ts |

### 2. Feature 专用配置

#### src/features/admin/constants.ts
| 常量 | 用途 |
|------|------|
| ORDER_STATUS | 订单状态枚举 |
| ORDER_STATUS_META | 订单状态元数据 |
| USER_STATUS | 用户状态枚举 |
| GENDER | 性别枚举 |
| FLIGHT_STATUS | 航班状态枚举 |
| PAYMENT_TYPE | 支付类型 |
| PAYMENT_STATUS | 支付状态 |
| PAYMENT_METHOD | 支付方式 |
| ADMIN_ROLE | 管理员角色 |
| LOG_TYPE | 日志类型 |
| CHANGE_REQUEST_TYPE | 退改签类型 |
| CHANGE_REQUEST_STATUS | 退改签状态 |

#### src/features/admin/dashboard/airports.ts
| 常量 | 用途 |
|------|------|
| AIRPORT_COORDINATES | 机场坐标数据 |

## 优化方案

### 方案 1: 目录结构调整
```
src/config/
  ├── api/              # API 相关配置
  │   └── index.ts      # API_CONFIG
  ├── data/             # 静态数据
  │   ├── airports.ts   # 机场数据
  │   ├── airlines.ts   # 航空公司数据
  │   └── aircrafts.ts  # 机型数据
  └── features/         # Feature 专用配置
      ├── admin/        # 管理后台配置
      ├── booking/      # 预订配置
      ├── flight/       # 航班配置
      └── ...
```

### 方案 2: 迁移 Feature 常量
将 `src/features/admin/constants.ts` 移动到 `src/config/features/admin/constants.ts`，更新所有引用。

### 方案 3: 创建 Feature 配置文件
为 booking、flight 等 feature 创建常量文件，整理散落各处的魔法数字和字符串。

## 实施计划

1. 创建 `src/config/data/` 目录，迁移 airports、airlines、aircrafts
2. 创建 `src/config/api/` 目录，迁移 API_CONFIG
3. 创建 `src/config/features/` 目录
4. 迁移 `src/features/admin/constants.ts` 到 `src/config/features/admin/constants.ts`
5. 为 booking、flight 等创建常量文件
6. 更新所有引用

## 配置导入规范

- 全局配置：从 `@/config` 导入
- Feature 专用配置：从 `@/config/features/{feature}` 导入
