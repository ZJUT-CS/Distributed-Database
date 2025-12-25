# 订单趋势图问题诊断

## 📋 问题现象
- ✅ 其他数据都正常显示
- ✅ 日期轴显示正常（12-19 到 12-25）
- ❌ 订单趋势图柱状图不显示（空白）

## 🔍 诊断步骤

### 第一步：检查浏览器控制台日志

打开浏览器开发者工具 (F12)，查找以下日志：

```
[Dashboard] 📊 订单趋势数据检查: { ... }
[订单趋势] 开始处理数据...
[订单趋势] 原始数据: ...
```

**关键点**：
1. `ordersTrend7d` 的 `length` 是多少？
2. `sample` 数据的 `count` 是多少？
3. 是否看到 "✅ 转换后数据" 还是 "⚠️ 后端未返回有效数据"？

### 第二步：检查后端返回的原始数据

在浏览器控制台运行：
```javascript
// 查看完整的 metrics 对象
console.log('完整数据:', JSON.stringify(window.lastMetrics, null, 2));
```

或者在 Network 标签中：
1. 找到 `metrics` 请求
2. 查看 Response 标签
3. 查找 `ordersTrend7d` 字段
4. **确认数组长度和每个元素的 count 值**

示例正确格式：
```json
{
  "ordersTrend7d": [
    { "date": "2025-12-19", "count": 5 },
    { "date": "2025-12-20", "count": 3 },
    { "date": "2025-12-21", "count": 8 },
    { "date": "2025-12-22", "count": 2 },
    { "date": "2025-12-23", "count": 0 },
    { "date": "2025-12-24", "count": 1 },
    { "date": "2025-12-25", "count": 2 }
  ]
}
```

### 第三步：检查数据库订单数据

连接数据库执行：

```sql
-- 检查订单表是否有数据
SELECT COUNT(*) AS total_orders FROM orders;

-- 检查最近7天的订单（按 order_time）
SELECT 
    DATE(order_time) AS order_date,
    COUNT(*) AS order_count
FROM orders
WHERE order_time >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
GROUP BY DATE(order_time)
ORDER BY order_date;

-- 检查订单时间范围
SELECT 
    MIN(order_time) AS earliest_order,
    MAX(order_time) AS latest_order,
    COUNT(*) AS total
FROM orders;

-- 如果没有最近7天的数据，查看所有订单日期分布
SELECT 
    DATE(order_time) AS order_date,
    COUNT(*) AS cnt
FROM orders
GROUP BY DATE(order_time)
ORDER BY order_date DESC
LIMIT 10;
```

## 🎯 可能的问题及解决方案

### 问题1：后端返回的 ordersTrend7d 数组为空或全是0

**原因**：数据库中没有最近7天的订单数据

**症状**：
- 控制台显示 `length: 7` 但所有 `count` 都是 0
- 或者 `length: 0`

**解决方案A**：插入测试数据（最快）
```sql
-- 插入最近7天的测试订单
INSERT INTO orders (flight_id, user_id, order_time, order_status, total_amount, pay_time, payment_id)
VALUES 
(1, 1, DATE_SUB(NOW(), INTERVAL 6 DAY), 2, 1200.00, DATE_SUB(NOW(), INTERVAL 6 DAY), 1),
(1, 2, DATE_SUB(NOW(), INTERVAL 5 DAY), 2, 1500.00, DATE_SUB(NOW(), INTERVAL 5 DAY), 2),
(2, 3, DATE_SUB(NOW(), INTERVAL 4 DAY), 2, 1800.00, DATE_SUB(NOW(), INTERVAL 4 DAY), 3),
(2, 1, DATE_SUB(NOW(), INTERVAL 3 DAY), 2, 1300.00, DATE_SUB(NOW(), INTERVAL 3 DAY), 4),
(3, 2, DATE_SUB(NOW(), INTERVAL 2 DAY), 2, 2000.00, DATE_SUB(NOW(), INTERVAL 2 DAY), 5),
(3, 3, DATE_SUB(NOW(), INTERVAL 1 DAY), 2, 1600.00, DATE_SUB(NOW(), INTERVAL 1 DAY), 6),
(1, 1, NOW(), 2, 1400.00, NOW(), 7);
```

**解决方案B**：修改后端查询逻辑（如果有历史数据）
如果数据库中有订单，但都是很久以前的，可以修改后端代码：
```java
// 改为查询最近有数据的7天，而不是固定最近7天
// 或者扩大查询范围到30天、90天等
```

### 问题2：后端未返回 ordersTrend7d 字段

**症状**：
- 控制台显示 `exists: false`
- Network 中看不到 `ordersTrend7d` 字段

**解决方案**：
1. 检查后端代码是否执行到设置 ordersTrend7d 的逻辑
2. 检查后端日志是否有异常
3. 重启后端服务

### 问题3：前端数据类型不匹配

**症状**：
- 控制台显示数据存在但转换失败
- 看到 "❌ 数据转换失败" 错误

**解决方案**：检查后端返回的 count 字段类型
- 后端：`long count`
- 前端期望：`number`
- JSON 中应该是数字，不是字符串

## 🛠️ 临时调试代码

在浏览器控制台运行以下代码查看详细信息：

```javascript
// 方法1：拦截并保存 metrics 数据
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const response = await originalFetch(...args);
  const cloned = response.clone();
  if (args[0].includes('metrics')) {
    const data = await cloned.json();
    window.lastMetrics = data;
    console.log('🔍 拦截到 metrics 数据:', data);
    console.log('📊 ordersTrend7d:', data.ordersTrend7d);
  }
  return response;
};

// 刷新页面后查看
// 然后运行：console.log('订单趋势:', window.lastMetrics?.ordersTrend7d);
```

## ✅ 验证修复

修复后应该看到：
1. ✅ 控制台显示：`[订单趋势] ✅ 转换后数据: [...]` 且 count > 0
2. ✅ 页面上出现蓝色渐变柱状图
3. ✅ 鼠标悬停在柱状图上显示具体订单数

---

**请执行以上步骤后，将以下信息反馈给我**：
1. 浏览器控制台的完整 `[订单趋势]` 相关日志
2. Network 中 metrics 请求的 ordersTrend7d 数据（截图或文本）
3. 数据库查询结果（订单数量和日期分布）
