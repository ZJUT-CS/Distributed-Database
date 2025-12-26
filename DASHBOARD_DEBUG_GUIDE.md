# Dashboard 数据显示问题排查指南

## 📋 问题现象
Dashboard 页面显示但所有数据为 0，没有趋势图和热门航线数据。

## 🔍 排查步骤

### 1. 检查后端服务是否启动
```bash
# 后端应该运行在 localhost:8080
curl http://localhost:8080/api/v1/admins/dashboards/metrics
```

**期望结果**: 返回JSON数据，包含各种指标

### 2. 检查浏览器控制台
打开浏览器开发者工具 (F12)：

#### 控制台 (Console) 标签页
查找以下日志：
- `[Dashboard] 开始请求后端数据...`
- `[Dashboard] 后端返回数据: {...}`
- 如果有错误会显示红色错误信息

#### 网络 (Network) 标签页
1. 刷新页面
2. 查找请求: `metrics`
3. 检查:
   - **状态码**: 应该是 200
   - **响应**: 点击查看返回的JSON数据
   - **请求头**: 检查是否有 Authorization token

### 3. 数据库中是否有数据

#### 检查关键表：
```sql
-- 检查订单数据
SELECT COUNT(*) FROM orders;
SELECT * FROM orders LIMIT 5;

-- 检查航班数据
SELECT COUNT(*) FROM flights;
SELECT * FROM flights LIMIT 5;

-- 检查用户数据
SELECT COUNT(*) FROM users;

-- 检查支付数据
SELECT COUNT(*) FROM payments WHERE payment_status = 1;
```

### 4. 后端日志检查

查看后端控制台输出：
- 是否有 SQL 执行日志
- 是否有异常堆栈信息
- Controller 是否收到请求

### 5. 前端配置检查

检查 API 基础路径配置：
```typescript
// skylink-frontend/src/lib/axios.ts
// 确认 baseURL 是否正确指向后端
```

## 🛠️ 常见问题解决

### 问题1: 后端未启动
**症状**: Network 标签显示请求失败 (ERR_CONNECTION_REFUSED)

**解决**:
```bash
cd skylink-backend
mvn spring-boot:run
# 或者在 IDE 中启动 Application.java
```

### 问题2: 数据库为空
**症状**: 接口返回 200，但所有 count 为 0

**解决**: 插入测试数据
```sql
-- 参考 mysql-init/01-init.sql 中的测试数据
```

### 问题3: CORS 跨域问题
**症状**: Console 显示 CORS policy blocked

**解决**: 检查后端 CORS 配置
```java
// 确保后端有正确的 CORS 配置
@CrossOrigin(origins = "*")
```

### 问题4: 权限认证问题
**症状**: 返回 401 或 403

**解决**: 
1. 确认已登录管理员账号
2. 检查 token 是否过期
3. 查看 SecurityConfig 是否需要认证

## 📊 验证数据正确性

当数据显示后，验证以下内容：

### 订单趋势图
- 应显示最近 7 天的数据
- X 轴显示日期 (MM-DD 格式)
- 柱状图高度反映订单数量

### 热门航线 TOP 5
- 显示出发/到达城市和机场代码
- 右侧显示订单数量
- 底部显示 GMV (交易金额)

### 数据卡片
- 今日订单数、GMV 应有数字增长动画
- 历史累计 GMV 应显示总额
- 航班状态饼图应有颜色分区

## 🎯 快速测试

### 最小化测试数据
在数据库中插入最少测试数据：

```sql
-- 1条用户
INSERT INTO users (username, password, email, create_time) 
VALUES ('test', '$2a$10$...', 'test@test.com', NOW());

-- 1条航班
INSERT INTO flights (flight_id, route_id, departure_time, status) 
VALUES (1, 1, NOW() + INTERVAL 2 HOUR, 1);

-- 1条订单
INSERT INTO orders (flight_id, user_id, order_time, order_status, total_amount) 
VALUES (1, 1, NOW(), 2, 1000.00);

-- 1条支付
INSERT INTO payments (order_id, payment_amount, payment_status, payment_time) 
VALUES (1, 1000.00, 1, NOW());
```

刷新 Dashboard，应该能看到：
- 今日订单: 1
- 今日 GMV: ¥1,000
- 订单趋势图最后一天有 1 个柱子

## 📝 调试日志位置

### 前端日志
- 浏览器控制台 (F12 → Console)
- 查找 `[Dashboard]` 前缀的日志

### 后端日志
- IDE 控制台输出
- 或查看 `logs/` 目录下的日志文件

## ✅ 成功标志

当 Dashboard 正常工作时，你应该看到：
1. ✅ 页面顶部没有红色错误提示框
2. ✅ 数据卡片显示实际数字（不全是0）
3. ✅ 订单趋势图有柱状图显示
4. ✅ 航班状态饼图显示分布
5. ✅ 热门航线列表显示具体航线
6. ✅ 控制台日志: `[Dashboard] 后端返回数据: { ... }`

## 🔧 已完成的优化 (2025-12-25)

### ✅ 增强调试功能
- 在 `useEffect` 中添加详细数据检查日志
- 输出 `ordersTrend7d` 和 `topRoutes7d` 的完整结构信息
- 显示数据存在性、类型、长度和样本数据

### ✅ 优化订单趋势图
- 增加数据转换的安全检查（`?.slice?.()` 和 `Number()` 转换）
- 改进降级方案：使用空数据而非今日数据，避免误导
- 添加详细的处理过程日志

### ✅ 修复实时航线监控
- **从硬编码改为使用后端 `topRoutes7d` 数据**
- 添加机场代码到坐标的映射配置（支持国内外主要机场）
- 动态生成航点和航线，根据订单量分配权重
- 过滤无坐标的航点，避免地图显示异常
- 添加加载状态显示

### 📊 调试日志说明

打开浏览器控制台 (F12)，刷新页面后会看到：

```javascript
// 1️⃣ 基础请求日志
[Dashboard] 开始请求后端数据...
[Dashboard] 后端返回数据: { ... }

// 2️⃣ 订单趋势数据检查
[Dashboard] 📊 订单趋势数据检查: {
  exists: true,
  isArray: true,
  length: 7,
  sample: { date: "2025-12-19", count: 5 },
  allData: [...]
}

// 3️⃣ 热门航线数据检查
[Dashboard] 🛫 热门航线数据检查: {
  exists: true,
  isArray: true,
  length: 5,
  sample: { routeId: 1, departureCity: "北京", ... },
  allData: [...]
}

// 4️⃣ 订单趋势处理日志
[订单趋势] 开始处理数据...
[订单趋势] 原始数据: [...]
[订单趋势] ✅ 转换后数据: [{ date: "12-19", count: 5 }, ...]

// 5️⃣ 航线监控处理日志
[航线监控] 开始处理热门航线数据...
[航线监控] 原始数据: [...]
[航线监控] ✅ 处理完成: {
  pointsCount: 8,
  routesCount: 5,
  points: [...],
  routes: [...]
}
```

### 🚨 问题定位

根据控制台日志快速定位：

| 日志内容 | 问题原因 | 解决方法 |
|---------|---------|---------|
| `exists: false` | 后端未返回该字段 | 检查后端接口实现 |
| `isArray: false` | 数据类型不匹配 | 检查后端返回格式 |
| `length: 0` | 数组为空 | 检查数据库是否有数据 |
| `⚠️ 后端未返回有效数据` | 数据验证失败 | 查看前面的数据检查日志 |
| `📉 使用降级数据` | 触发降级方案 | 修复后端数据返回 |

## 🆘 仍然无法解决？

请提供以下信息：
1. 浏览器控制台**完整**日志（包括所有 `[Dashboard]`、`[订单趋势]`、`[航线监控]` 前缀的日志）
2. Network 标签中 metrics 请求的详情（截图）
3. 后端控制台输出（文本）
4. 数据库查询结果：
   ```sql
   SELECT COUNT(*) FROM orders;
   SELECT * FROM orders ORDER BY order_time DESC LIMIT 3;
   ```
