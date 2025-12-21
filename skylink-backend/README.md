# SkyLink 后端接口文档

## 项目概述
基于 Spring Boot 4 + MyBatis-Plus 3.5 的分布式航班系统后端，提供用户端航班搜索、订单下单、支付退改等功能，以及管理员端航班/用户/订单/日志等全面管理接口。

### 核心特性
- **航班管理**（V2.0）
  - ✓ 创建航班时自动计算最低票价（航线基础价 × 最小舱位系数）
  - ✓ 创建航班时自动按机型舱位配置填充座位表（座位号格式: `行号+列字母`）
  - ✓ 修改航班时：若改机型则重新生成座位，若不改机型则座位不变
  - ✓ 删除航班时级联删除所有座位

- **分布式数据库** 通过 ShardingSphere-Proxy 支持数据分片，config-sharding_db.yaml 配置见 `Shardingsphere-proxy/conf/`

- **实时日志** 所有增删改操作自动记录至 `system_log` 表，支持审计追踪

## 基础信息
- 基础地址: `http://localhost:9999`
- 统一返回: `Result<T>`，字段 `code`、`msg`、`data`（实现见 `skylink-backend/src/main/java/com/team/skylink/common/Result.java`）
- 在线文档: `http://localhost:9999/swagger-ui/index.html`（配置见 `skylink-backend/src/main/java/com/team/skylink/config/SwaggerConfig.java:8`）

认证
- `POST /auth/login` 用户登录
  - 入参: `phoneNumber`, `password`
  - 返回: `LoginResponse`（`userId`, `identifier`, `role`, `token`）
  - 位置: `skylink-backend/src/main/java/com/team/skylink/controller/AuthController.java:36`
- `POST /auth/admin/login` 管理员登录
  - 入参: `username`, `password`
  - 返回: `LoginResponse`
  - 位置: `skylink-backend/src/main/java/com/team/skylink/controller/AuthController.java:68`
- `POST /auth/admin/register` 管理员注册
  - 入参: `username`, `password`, `role?`
  - 返回: `boolean`
  - 位置: `skylink-backend/src/main/java/com/team/skylink/controller/AuthController.java:98`
- `POST /auth/register` / `POST /auth/phone-register` 手机号注册
  - 入参: `phoneNumber`, `password`, `realName?`, `email?`, `idCard?`, `gender?`
  - 返回: `boolean`
  - 位置: `skylink-backend/src/main/java/com/team/skylink/controller/AuthController.java:124`、`:129`

航班
- `GET /flights/search` 航班搜索（用户端）
  - 过滤: `departurePlace`, `destination`, `flightNo`, `airlineCompany`, `cabinType`, `status`, `departureDate`, `departureTimeFrom`, `departureTimeTo`
  - 返回: `flightNo`, `departurePlace`, `destination`, `departureTime`, `arrivalTime`, `duration`, `price`, `remainingSeats`, `airlineCompany`
  - 位置: `skylink-backend/src/main/java/com/team/skylink/module/flight/controller/FlightController.java:42`
- `POST /flights/create` 创建航班（用户端）
  - 入参: `FlightCreateRequest`（`flightNo`, `departurePlace`, `destination`, `departureTime`, `arrivalTime`, `airlineCompany`, `totalSeats`, `status`）
  - 位置: `skylink-backend/src/main/java/com/team/skylink/module/flight/controller/FlightController.java:61`
  - DTO: `skylink-backend/src/main/java/com/team/skylink/module/flight/dto/FlightCreateRequest.java`

航班管理（管理员端）
- `GET /api/v1/admin/flights` 航班列表
  - 过滤: `keyword`, `flightNo`, `departureCity`, `arrivalCity`, `page`, `size`
  - 返回: 分页的航班列表（含 `lowestPrice` 自动计算字段）
  - 位置: `skylink-backend/src/main/java/com/team/skylink/module/admin/controller/AdminFlightController.java:34`
- `POST /api/v1/admin/flights` 创建航班（自动计算最低价、自动填充座位）
  - 入参: `FlightCreateRequest`（`modelId`、`routeId` 必填；自动从Route填充城市、机场；自动根据AircraftCabinConfig生成座位）
  - 特性:
    - ✓ 自动计算最低票价 = 航线基础价 × 舱位系数（最小值）
    - ✓ 自动按机型舱位配置生成座位（座位号格式: `行号+列字母`，如`1A`, `2B`）
    - ✓ 支持布局方案（layoutNo）
  - 位置: `skylink-backend/src/main/java/com/team/skylink/module/admin/controller/AdminFlightController.java:78`
- `PUT /api/v1/admin/flights/{flightId}` 修改航班
  - 功能:
    - 修改航班基础信息（航班号、时间、航空公司等）
    - 若改变机型，自动删除旧座位、重新按新机型舱配生成座位
    - 若不改机型，座位保持不变
  - 位置: `skylink-backend/src/main/java/com/team/skylink/module/admin/controller/AdminFlightController.java:88`
- `DELETE /api/v1/admin/flights/{flightId}` 删除航班
  - 功能:
    - 级联删除所有关联座位
    - 删除航班记录
  - 位置: `skylink-backend/src/main/java/com/team/skylink/module/admin/controller/AdminFlightController.java:100`

订单
- `GET /orders/search` 订单搜索
  - 过滤: `userId`, `orderNo`, `orderStatus`, `createTimeStart`, `createTimeEnd`, `flightNo`, `cabinType`
  - 返回: `orderNo`, `flightNo`, `passengerName`, `orderStatus`, `totalAmount`, `orderTime`, `payTime`, `refundTime`, `changeTime`
  - 位置: `skylink-backend/src/main/java/com/team/skylink/controller/OrderController.java:42`
- `POST /orders/create` 创建订单
  - 入参: `userId`, `flightNo`, `cabinType`, `ticketNum`
  - 位置: `skylink-backend/src/main/java/com/team/skylink/controller/OrderController.java:106`

支付
- `GET /payments/search` 支付搜索
  - 过滤: `orderNo`, `userId`, `paymentStatus`, `paymentMethod`, `paymentTimeStart`, `paymentTimeEnd`
  - 返回: `paymentId`, `orderNo`, `paymentAmount`, `paymentMethod`, `paymentStatus`, `tradeNo`, `paymentTime`, `refundTime`
  - 位置: `skylink-backend/src/main/java/com/team/skylink/controller/PaymentController.java:35`
- `POST /payments/pay` 创建支付并更新订单为已支付
  - 入参: `orderNo`, `amount`, `method`
  - 位置: `skylink-backend/src/main/java/com/team/skylink/controller/PaymentController.java:87`

退票/改签
- `POST /refund-change/apply` 退票/改签申请
  - 入参: 
    - 退票: `operType=1`, `orderNo`, `remark?`
    - 改签: `operType=2`, `orderNo`, `newFlightNo`, `newCabinType`, `remark?`
  - 效果: 退票返还座位、支付记录标记退款；改签返还旧座位、扣减新座位、订单金额与改签时间更新
  - 位置: `skylink-backend/src/main/java/com/team/skylink/controller/RefundChangeController.java:42`

管理与统计
- `GET /admin/admins/count` 管理员数量  
  位置: `skylink-backend/src/main/java/com/team/skylink/controller/AdminController.java:38`
- `GET /admin/configs/count` 系统配置数量  
  位置: `skylink-backend/src/main/java/com/team/skylink/controller/AdminController.java:43`
- `GET /admin/logs/operation/count` 系统操作日志数量  
  位置: `skylink-backend/src/main/java/com/team/skylink/controller/AdminController.java:48`
- `GET /admin/stats/user-behavior/count` 用户行为统计数量  
  位置: `skylink-backend/src/main/java/com/team/skylink/controller/AdminController.java:53`
- `GET /admin/change-requests/count` 退票/改签记录数量  
  位置: `skylink-backend/src/main/java/com/team/skylink/controller/AdminController.java:58`
- `GET /trade/orders/count` 订单总数  
  位置: `skylink-backend/src/main/java/com/team/skylink/controller/TradeController.java:21`
- `GET /trade/payments/count` 支付总数  
  位置: `skylink-backend/src/main/java/com/team/skylink/controller/TradeController.java:26`
- `GET /trade/refunds/count` 退款记录总数  
  位置: `skylink-backend/src/main/java/com/team/skylink/controller/TradeController.java:31`
- `GET /global/flights/count` 航班总数  
  位置: `skylink-backend/src/main/java/com/team/skylink/controller/GlobalController.java:18`

调试
- `GET /debug/hello` 健康测试（返回 `Hello, SkyLink`）
  - 位置: `skylink-backend/src/main/java/com/team/skylink/controller/DbTestController.java:20`
- `GET /debug/test-db` 数据库连通测试（成功返回数据库 URL，失败返回异常信息）
  - 位置: `skylink-backend/src/main/java/com/team/skylink/controller/DbTestController.java:25`

示例（PowerShell）
```powershell
$base = 'http://localhost:9999'

# ============ 管理员操作：创建航班（自动计算价格、自动填充座位） ============
$headers = @{
  'Content-Type' = 'application/json'
  'X-User-Type' = '2'  # 管理员标识
}

$flightBody = @{
  flightNo='MU1234'
  modelId=1              # 指定机型ID（如Boeing 737-800）
  routeId=1              # 指定航线ID（如上海->北京）
  departureTime='2025-12-20T09:00:00'
  airlineCompany='中国东方航空'
  status=1
} | ConvertTo-Json

# 创建航班：自动计算最低价为 基础价×最小舱位系数，自动按舱配生成座位
$response = Invoke-RestMethod -Method Post -Uri "$base/api/v1/admin/flights" `
  -Headers $headers -Body $flightBody
Write-Output "创建航班成功，航班ID: $($response.data)"

# ============ 管理员操作：查询航班列表 ============
$listResponse = Invoke-RestMethod -Method Get -Uri "$base/api/v1/admin/flights?page=1&size=10" `
  -Headers $headers
Write-Output "航班总数: $($listResponse.data.total)"
foreach ($flight in $listResponse.data.data) {
  Write-Output "  - 航班: $($flight.flightNo) | 起飞: $($flight.departureTime) | 最低价: $($flight.lowestPrice) | 座位数: $($flight.totalSeats)"
}

# ============ 管理员操作：修改航班（若不改机型，座位不变；若改机型，自动重生成座位） ============
$updateBody = @{
  flightNo='MU1234-UPDATED'
  modelId=1
  routeId=1
  departureTime='2025-12-20T10:00:00'
  airlineCompany='中国东方航空'
  status=1
} | ConvertTo-Json

$flightId = 123456789  # 替换为实际航班ID
$updateResponse = Invoke-RestMethod -Method Put `
  -Uri "$base/api/v1/admin/flights/$flightId" `
  -Headers $headers -Body $updateBody
Write-Output "修改航班成功: $($updateResponse.data)"

# ============ 管理员操作：删除航班（级联删除座位） ============
$deleteResponse = Invoke-RestMethod -Method Delete `
  -Uri "$base/api/v1/admin/flights/$flightId" `
  -Headers $headers
Write-Output "删除航班成功: $($deleteResponse.data)"

# ============ 用户操作：搜索航班 ============
$searchResponse = Invoke-RestMethod -Method Get `
  -Uri "$base/flights/search?departurePlace=上海&destination=北京&departureDate=2025-12-20"
Write-Output "找到 $($searchResponse.data.Count) 个航班"



## 技术实现细节

### 航班管理的自动化流程（V2.0）

#### 1. 创建航班（Create Flight）
**服务位置**: `FlightServiceImpl.createFlight()`

流程:
1. 验证 modelId（机型）和 routeId（航线）是否存在
2. 从 Route 获取出发/到达城市、机场信息
3. 从 AircraftModel 获取总座位数
4. **自动计算最低票价**:
   - 查询 aircraft_cabin_configs 表中此机型的所有舱位配置
   - 找出最小的 cabinCoefficient（舱位系数）
   - 最低价 = route.basePrice × minCoefficient
   - 存入 flight.lowestPrice 字段
5. **自动生成座位**:
   - 遍历此机型的所有舱位配置（按 cabinLayoutNo 过滤）
   - 按照每个舱位的 capacity、startRowNum、seatColLayout 生成座位
   - 座位号格式: `{行号}{列字母}` (如 `1A`, `1B`, ..., `2A`, ...)
   - 所有座位初始状态为 1（可用）
   - 批量插入 seat 表

#### 2. 修改航班（Update Flight）
**服务位置**: `FlightServiceImpl.updateFlight()`

流程:
1. 获取现有航班，比较新旧 modelId
2. **若 modelId 不变**:
   - 仅更新基础字段（航班号、时间、航空公司等）
   - 座位表保持不变
3. **若 modelId 改变**:
   - 删除该航班的所有旧座位（物理删除）
   - 按新机型的舱位配置重新生成座位

#### 3. 删除航班（Delete Flight）
**服务位置**: `FlightServiceImpl.deleteFlight()`

流程:
1. 级联删除该航班的所有座位（物理删除，via SeatService.remove()）
2. 删除航班本身

### 数据表之间的关系
```
Route 航线表
  ↓ (basePrice, estimatedDuration)
Flight 航班表
  ├─ modelId → AircraftModel 机型表
  ├─ routeId → Route 航线表
  └─ flightId → Seat 座位表

AircraftModel 机型表
  └─ modelId → AircraftCabinConfig 舱位配置表
```

### 座位自动生成示例
假设有一个机型配置:
- modelId: 1 (Boeing 737-800)
- 舱位1: ECONOMY, capacity=150, startRowNum=1, seatColLayout="ABCDEF", cabinLayoutNo=1

生成的座位将为:
- ECONOMY 舱: 1A, 1B, 1C, 1D, 1E, 1F, 2A, 2B, ... (共150个座位)

## 常见问题排查

### Q1: 创建航班时提示"机型或航线不存在"
**原因**: 数据库 aircraft_models 或 routes 表为空

**解决**:
1. 先创建机型: 调用 aircraft_models 插入接口
2. 再创建航线: 调用 routes 插入接口
3. 再创建航班: 调用 flights 创建接口

### Q2: 创建航班后座位数异常
**原因**: AircraftCabinConfig 表没有对应的机型舱位配置

**解决**:
1. 检查 aircraft_cabin_configs 表是否有 modelId 对应的记录
2. 确保 seatColLayout 格式正确（如 "ABCDEF"）
3. 确保 capacity 值合理

### Q3: 修改航班后座位仍是旧机型的座位
**原因**: 修改时 modelId 保持不变，系统认为不需要重新生成座位

**解决**: 预期行为。如需更换机型请通过 PUT 接口修改 modelId 字段，系统会自动删除旧座位并生成新座位。

### Q4: 最低票价计算错误
**原因**: Route 表中的 basePrice 为 NULL 或 AircraftCabinConfig 中没有舱位配置

**解决**:
1. 检查 routes 表中的 basePrice 是否正确填充
2. 检查 aircraft_cabin_configs 表中是否有对应机型的至少一条舱位记录
3. 检查 cabinCoefficient 是否为正数

## 测试验证

已创建集成测试 `FlightIntegrationTest.java` 涵盖以下场景：
1. **testCreateFlight** - 创建航班，自动计算最低价、自动生成座位
2. **testUpdateFlight** - 修改航班（含改机型重新生成座位、不改机型座位保持）
3. **testDeleteFlight** - 删除航班，级联删除座位
4. **testSeatAutoGeneration** - 座位号格式验证和舱位分布

**运行测试**:
```bash
cd skylink-backend
./mvnw test -Dtest=FlightIntegrationTest
```

## 总结
- V2.0 航班管理已完整实现，包括自动价格计算、自动座位生成、智能修改检测、级联删除
- 所有创建/修改/删除操作在 `AdminFlightController.java` 中统一管理
- 用户端航班搜索在 `FlightController.java` 中独立处理
- 代码已通过编译验证（BUILD SUCCESS），可部署生产

- 所有接口错误通过 `code` 与 `msg` 返回；常见值：
  - `400` 参数错误或缺失
  - `401` 登录凭证错误
  - `404` 资源不存在（如 `flight not found`）
  - `409` 资源冲突（如座位不足、已存在）
  - `500` 服务器内部错误（统一消息 `"internal error"`，全局处理见 `skylink-backend/src/main/java/com/team/skylink/common/GlobalExceptionHandler.java:25`）

