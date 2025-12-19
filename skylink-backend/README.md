# SkyLink 后端接口文档

基础信息
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
- `GET /flights/search` 航班搜索
  - 过滤: `departurePlace`, `destination`, `flightNo`, `airlineCompany`, `cabinType`, `status`, `departureDate`, `departureTimeFrom`, `departureTimeTo`
  - 返回: `flightNo`, `departurePlace`, `destination`, `departureTime`, `arrivalTime`, `duration`, `price`, `remainingSeats`, `airlineCompany`
  - 位置: `skylink-backend/src/main/java/com/team/skylink/controller/FlightController.java:38`
- `POST /flights/create` 创建航班
  - 入参: `FlightCreateRequest`（`flightNo`, `departurePlace`, `destination`, `departureTime`, `arrivalTime`, `airlineCompany`, `totalSeats`, `status`）
  - 位置: `skylink-backend/src/main/java/com/team/skylink/controller/FlightController.java:118`
  - DTO: `skylink-backend/src/main/java/com/team/skylink/dto/FlightCreateRequest.java:14`（ISO 日期时间）
- `POST /flights/cabins/create` 创建舱位
  - 入参: `flightNo`, `cabinType`, `price`, `remainingSeats`
  - 位置: `skylink-backend/src/main/java/com/team/skylink/controller/FlightController.java:144`

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

# 创建航班
$flightBody = @{
  flightNo='MU1234'
  departurePlace='上海'
  destination='北京'
  departureTime='2025-12-20T09:00:00'
  arrivalTime='2025-12-20T11:15:00'
  airlineCompany='中国东方航空'
  totalSeats=180
  status=1
} | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "$base/flights/create" -ContentType 'application/json' -Body $flightBody



错误与约定
- 所有接口错误通过 `code` 与 `msg` 返回；常见值：
  - `400` 参数错误或缺失
  - `401` 登录凭证错误
  - `404` 资源不存在（如 `flight not found`）
  - `409` 资源冲突（如座位不足、已存在）
  - `500` 服务器内部错误（统一消息 `"internal error"`，全局处理见 `skylink-backend/src/main/java/com/team/skylink/common/GlobalExceptionHandler.java:25`）

