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

认证与用户
- `POST /api/v1/users/sessions` 用户登录（创建会话）
  - 入参: `phoneNumber`, `password`
  - 返回: `LoginResponse`（`userId`, `identifier`, `role`, `token`）
  - 位置: `skylink-backend/src/main/java/com/team/skylink/module/auth/controller/AuthController.java`
- `POST /api/v1/admins/sessions` 管理员登录（创建会话）
  - 入参: `adminAccount`, `password`
  - 返回: `String`（Token）
  - 位置: `skylink-backend/src/main/java/com/team/skylink/module/admin/controller/AdminController.java`
- `POST /api/v1/users` 用户注册
  - 入参: `phoneNumber`, `password`, `realName?`, `email?`, `idCard?`, `gender?`
  - 返回: `boolean`
  - 位置: `skylink-backend/src/main/java/com/team/skylink/module/user/controller/UserController.java`
- `GET /api/v1/users/me` 获取当前用户信息
  - Header: `Authorization: Bearer <token>`
  - 返回: `UserProfileResponse`
  - 位置: `skylink-backend/src/main/java/com/team/skylink/module/user/controller/UserController.java`
- `PUT /api/v1/users/me` 更新当前用户信息
  - 入参: `email`, `avatarUrl`, `gender`, `realName`, `idCard`
  - 位置: `skylink-backend/src/main/java/com/team/skylink/module/user/controller/UserController.java`
- `PUT /api/v1/users/me/password` 修改密码
  - 入参: `oldPassword`, `newPassword`
  - 位置: `skylink-backend/src/main/java/com/team/skylink/module/user/controller/UserController.java`
- `POST /api/v1/users/me/contacts` 绑定联系方式 (Email/Phone)
  - 入参: `value`, `code`
  - 位置: `skylink-backend/src/main/java/com/team/skylink/module/user/controller/UserController.java`

已完成所有端口（API 接口）的命名规范化，并更新了 README.md 。

主要修改内容：

1. 接口标准化 (RESTful 风格) ：
   
   - FlightController ( /api/v1/flights )：
     - GET /search -> GET / (搜索航班)
     - POST /create -> POST / (创建航班)
   - OrderController ( /api/v1/orders )：
     - GET /search -> GET / (搜索订单)
     - POST /create -> POST / (创建订单)
  - PaymentController ( /api/v1/payments )：
    - GET /search -> GET / (搜索支付)
    - POST /pay -> POST / (创建支付)
    - POST /confirm-token -> POST /confirmation-tokens
    - POST /confirm -> POST /confirmations
  - RefundChangeController ( /api/v1/refund-change-requests )：
    - GET /search -> GET / (搜索申请)
    - POST /apply -> POST / (提交申请)
    - POST /approve -> POST /approvals
    - POST /reject -> POST /rejections
2. AdminController 检查 ：
  
  - 管理员接口统一前缀为 `/api/v1/admins`，管理员会话为 `POST /api/v1/admins/sessions`，管理员账号集合为 `POST /api/v1/admins`。
3. 文档更新 ：
   
   - README.md 已全面更新，所有接口路径均已修正为最新的 RESTful 格式。
   - PowerShell 示例脚本也已同步更新。
4. 验证 ：
   
   - 运行 mvn compile 成功，代码无语法错误。
现在所有 Controller 都遵循统一的 RESTful 资源路径规范（ /api/v1/{resource} ），不再混用 /create 、 /search 等动作后缀。航班
- `GET /api/v1/flights` 航班搜索（用户端）
  - 过滤: `departurePlace`, `destination`, `flightNo`, `airlineCompany`, `cabinType`, `status`, `departureDate`, `departureTimeFrom`, `departureTimeTo`
  - 返回: `flightNo`, `departurePlace`, `destination`, `departureTime`, `arrivalTime`, `duration`, `price`, `remainingSeats`, `airlineCompany`
  - 位置: `skylink-backend/src/main/java/com/team/skylink/module/flight/controller/FlightController.java:31`
- `POST /api/v1/flights` 创建航班（用户端，通常仅用于测试或特定权限）
  - 入参: `FlightCreateRequest`（`flightNo`, `departurePlace`, `destination`, `departureTime`, `arrivalTime`, `airlineCompany`, `totalSeats`, `status`）
  - 位置: `skylink-backend/src/main/java/com/team/skylink/module/flight/controller/FlightController.java:60`
  - DTO: `skylink-backend/src/main/java/com/team/skylink/module/flight/dto/FlightCreateRequest.java`

航班管理（管理员端）
- `GET /api/v1/admins/flights` 航班列表
  - 过滤: `keyword`, `flightNo`, `departureCity`, `arrivalCity`, `page`, `size`
  - 返回: 分页的航班列表（含 `lowestPrice` 自动计算字段）
  - 位置: `skylink-backend/src/main/java/com/team/skylink/module/admin/controller/AdminFlightController.java:34`
- `POST /api/v1/admins/flights` 创建航班（自动计算最低价、自动填充座位）
  - 入参: `FlightCreateRequest`（`modelId`、`routeId` 必填；自动从Route填充城市、机场；自动根据AircraftCabinConfig生成座位）
  - 特性:
    - ✓ 自动计算最低票价 = 航线基础价 × 舱位系数（最小值）
    - ✓ 自动按机型舱位配置生成座位（座位号格式: `行号+列字母`，如`1A`, `2B`）
    - ✓ 支持布局方案（layoutNo）
  - 位置: `skylink-backend/src/main/java/com/team/skylink/module/admin/controller/AdminFlightController.java:78`
- `PUT /api/v1/admins/flights/{flightId}` 修改航班
  - 功能:
    - 修改航班基础信息（航班号、时间、航空公司等）
    - 若改变机型，自动删除旧座位、重新按新机型舱配生成座位
    - 若不改机型，座位保持不变
  - 位置: `skylink-backend/src/main/java/com/team/skylink/module/admin/controller/AdminFlightController.java:88`
- `DELETE /api/v1/admins/flights/{flightId}` 删除航班
  - 功能:
    - 级联删除所有关联座位
    - 删除航班记录
  - 位置: `skylink-backend/src/main/java/com/team/skylink/module/admin/controller/AdminFlightController.java:100`

订单
- `GET /api/v1/orders` 订单搜索
  - 过滤: `userId`, `orderNo`, `orderStatus`, `createTimeStart`, `createTimeEnd`, `flightNo`, `cabinType`
  - 返回: `orderNo`, `flightNo`, `passengerName`, `orderStatus`, `totalAmount`, `orderTime`, `payTime`, `refundTime`, `changeTime`
  - 位置: `skylink-backend/src/main/java/com/team/skylink/module/order/controller/OrderController.java:29`
- `POST /api/v1/orders` 创建订单
  - 入参: `userId`, `flightNo`, `cabinType`, `ticketNum`
  - 位置: `skylink-backend/src/main/java/com/team/skylink/module/order/controller/OrderController.java:42`
- `POST /api/v1/orders/{orderId}/cancellation` 取消订单
  - 位置: `skylink-backend/src/main/java/com/team/skylink/module/order/controller/OrderController.java`

支付
- `GET /api/v1/payments` 支付搜索
  - 过滤: `orderNo`, `userId`, `paymentStatus`, `paymentMethod`, `paymentTimeStart`, `paymentTimeEnd`
  - 返回: `paymentId`, `orderNo`, `paymentAmount`, `paymentMethod`, `paymentStatus`, `tradeNo`, `paymentTime`, `refundTime`
  - 位置: `skylink-backend/src/main/java/com/team/skylink/module/payment/controller/PaymentController.java:31`
- `POST /api/v1/payments` 创建支付并更新订单为已支付
  - 入参: `orderNo`, `amount`, `method`
  - 位置: `skylink-backend/src/main/java/com/team/skylink/module/payment/controller/PaymentController.java:53`
- `POST /api/v1/payments/confirmation-tokens` 创建支付确认 Token
  - 位置: `skylink-backend/src/main/java/com/team/skylink/module/payment/controller/PaymentController.java`
- `POST /api/v1/payments/confirmations` 确认支付
  - 位置: `skylink-backend/src/main/java/com/team/skylink/module/payment/controller/PaymentController.java`

退票/改签
- `POST /api/v1/refund-change-requests` 退票/改签申请
  - 入参: 
    - 退票: `operType=1`, `orderNo`, `remark?`
    - 改签: `operType=2`, `orderNo`, `newFlightNo`, `newCabinType`, `remark?`
  - 效果: 退票返还座位、支付记录标记退款；改签返还旧座位、扣减新座位、订单金额与改签时间更新
  - 位置: `skylink-backend/src/main/java/com/team/skylink/module/refund/controller/RefundChangeController.java`

管理与统计
- `POST /api/v1/admins` 创建管理员
  - 入参: `adminAccount`, `password`, `role`
  - 位置: `skylink-backend/src/main/java/com/team/skylink/module/admin/controller/AdminController.java`
- `GET /api/v1/admins/count` 管理员数量  
  - 位置: `skylink-backend/src/main/java/com/team/skylink/module/admin/controller/AdminController.java`
- `GET /api/v1/admins/system-configs/count` 系统配置数量  
  - 位置: `skylink-backend/src/main/java/com/team/skylink/module/admin/controller/AdminController.java`
- `GET /api/v1/admins/operation-logs/count` 系统操作日志数量  
  - 位置: `skylink-backend/src/main/java/com/team/skylink/module/admin/controller/AdminController.java`
- `GET /api/v1/admins/user-behavior-stats/count` 用户行为统计数量  
  - 位置: `skylink-backend/src/main/java/com/team/skylink/module/admin/controller/AdminController.java`
- `GET /api/v1/admins/refund-change-requests/count` 退票/改签记录数量  
  - 位置: `skylink-backend/src/main/java/com/team/skylink/module/admin/controller/AdminController.java`
- `GET /api/v1/metrics/orders/count` 订单总数  
  - 位置: `skylink-backend/src/main/java/com/team/skylink/module/trade/controller/TradeController.java`
- `GET /api/v1/metrics/payments/count` 支付总数  
  - 位置: `skylink-backend/src/main/java/com/team/skylink/module/trade/controller/TradeController.java`
- `GET /api/v1/metrics/refunds/count` 退款记录总数  
  - 位置: `skylink-backend/src/main/java/com/team/skylink/module/trade/controller/TradeController.java`
- `GET /api/v1/metrics/flights/count` 航班总数  
  - 位置: `skylink-backend/src/main/java/com/team/skylink/module/system/controller/GlobalController.java`

调试
- `GET /api/v1/system/health` 健康测试（返回 `Hello, SkyLink`）
  - 位置: `skylink-backend/src/main/java/com/team/skylink/module/system/controller/DbTestController.java:20`
- `GET /api/v1/system/db-connection` 数据库连通测试（成功返回数据库 URL，失败返回异常信息）
  - 位置: `skylink-backend/src/main/java/com/team/skylink/module/system/controller/DbTestController.java:25`

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
$response = Invoke-RestMethod -Method Post -Uri "$base/api/v1/admins/flights" `
  -Headers $headers -Body $flightBody
Write-Output "创建航班成功，航班ID: $($response.data)"

# ============ 管理员操作：查询航班列表 ============
$listResponse = Invoke-RestMethod -Method Get -Uri "$base/api/v1/admins/flights?page=1&size=10" `
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
  -Uri "$base/api/v1/admins/flights/$flightId" `
  -Headers $headers -Body $updateBody
Write-Output "修改航班成功: $($updateResponse.data)"

# ============ 管理员操作：删除航班（级联删除座位） ============
$deleteResponse = Invoke-RestMethod -Method Delete `
  -Uri "$base/api/v1/admins/flights/$flightId" `
  -Headers $headers
Write-Output "删除航班成功: $($deleteResponse.data)"

# ============ 用户操作：搜索航班 ============
$searchResponse = Invoke-RestMethod -Method Get `
  -Uri "$base/api/v1/flights?departurePlace=上海&destination=北京&departureDate=2025-12-20"
Write-Output "找到 $($searchResponse.data.Count) 个航班"

